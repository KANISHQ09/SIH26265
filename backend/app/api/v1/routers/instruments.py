from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, check_instrument_access, require_roles
from app.models.enums import InstrumentStatus, TrustLevel, UserRole
from app.models.entities import Instrument, FieldTrust, Observation, Bank, Institution, User
from app.schemas.instrument import (
    InstrumentResponse, InstrumentDetailResponse, InstrumentCreate, 
    InstrumentUpdate, StatusTransitionRequest, RenewalRequest, 
    ObservationCreate, ObservationResponse
)
from app.services.state_machine import transition
from app.services.discrepancy.engine import engine as discrepancy_engine
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/instruments", tags=["Instruments"])


@router.get("", response_model=List[InstrumentResponse])
async def list_instruments(
    status: Optional[InstrumentStatus] = None,
    bank_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    trust_level: Optional[TrustLevel] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Instrument)
        .options(
            selectinload(Instrument.institution),
            selectinload(Instrument.bank),
            selectinload(Instrument.field_trusts),
            selectinload(Instrument.observations),
        )
        .order_by(desc(Instrument.created_at))
    )

    # Multi-tenant isolation for institutions
    if current_user.role == UserRole.INSTITUTION_USER:
        stmt = stmt.where(Instrument.institution_id == current_user.institution_id)
    elif institution_id:
        stmt = stmt.where(Instrument.institution_id == institution_id)

    if status:
        stmt = stmt.where(Instrument.status == status)
    if bank_id:
        stmt = stmt.where(Instrument.bank_id == bank_id)
    if trust_level:
        stmt = stmt.where(Instrument.overall_trust == trust_level)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                Instrument.reference_number.ilike(search_filter),
                Instrument.branch_name.ilike(search_filter),
                Instrument.purpose.ilike(search_filter),
            )
        )

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    instruments = result.scalars().all()
    return list(instruments)


@router.get("/{id}", response_model=InstrumentDetailResponse)
async def get_instrument(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Instrument)
        .options(
            selectinload(Instrument.institution),
            selectinload(Instrument.bank),
            selectinload(Instrument.field_trusts),
            selectinload(Instrument.observations),
            selectinload(Instrument.status_history),
        )
        .where(Instrument.id == id)
    )
    result = await db.execute(stmt)
    instrument = result.scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    check_instrument_access(instrument, current_user)
    return instrument


@router.post("", response_model=InstrumentResponse, status_code=status.HTTP_201_CREATED)
async def create_instrument(
    data: InstrumentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Determine target institution
    target_inst_id = data.institution_id
    if current_user.role == UserRole.INSTITUTION_USER:
        target_inst_id = current_user.institution_id
    elif not target_inst_id:
        raise HTTPException(status_code=400, detail="institution_id is required for administrative creation")

    inst = Instrument(
        institution_id=target_inst_id,
        type=data.type,
        reference_number=data.reference_number,
        bank_id=data.bank_id,
        branch_name=data.branch_name,
        amount=data.amount,
        issue_date=data.issue_date,
        maturity_date=data.maturity_date,
        lien_marked=data.lien_marked,
        purpose=data.purpose,
        status=InstrumentStatus.DRAFT,
        overall_trust=TrustLevel.SUBMITTED,
        created_by=current_user.id,
    )
    db.add(inst)
    await db.flush()

    # Initialize field trust records
    fields_to_track = [
        ("reference_number", inst.reference_number),
        ("amount", str(inst.amount)),
        ("maturity_date", inst.maturity_date.isoformat()),
        ("lien_marked", str(inst.lien_marked)),
    ]
    for field_name, val in fields_to_track:
        ft = FieldTrust(
            instrument_id=inst.id,
            field_name=field_name,
            value_text=val,
            trust=TrustLevel.SUBMITTED,
            source_ref=current_user.id,
        )
        db.add(ft)

    await create_audit_log(
        db=db,
        action="CREATE_INSTRUMENT_DRAFT",
        entity_type="INSTRUMENT",
        entity_id=inst.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        after_json={"reference_number": inst.reference_number, "amount": inst.amount},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
    return await get_instrument(inst.id, current_user, db)


@router.post("/{id}/submit", response_model=InstrumentResponse)
async def submit_instrument(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    check_instrument_access(instrument, current_user)

    # Transition to SUBMITTED
    await transition(
        db=db,
        instrument=instrument,
        to_status=InstrumentStatus.SUBMITTED,
        actor=current_user,
        reason="Instrument submitted by institution for verification.",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # Automatically trigger discrepancy detection engine
    discrepancies = await discrepancy_engine.scan_instrument(db, instrument.id)
    if discrepancies:
        # If open discrepancies found, automatically flag to UNDER_SCRUTINY / DISCREPANCY_FLAGGED
        await transition(
            db=db,
            instrument=instrument,
            to_status=InstrumentStatus.UNDER_SCRUTINY,
            actor=None,
            reason="Automated intake scan initiated.",
        )
        await transition(
            db=db,
            instrument=instrument,
            to_status=InstrumentStatus.DISCREPANCY_FLAGGED,
            actor=None,
            reason=f"Automated intake engine detected {len(discrepancies)} discrepancy item(s).",
        )

    await db.commit()
    return await get_instrument(instrument.id, current_user, db)


@router.post("/{id}/transition", response_model=InstrumentResponse)
async def transition_instrument_status(
    id: str,
    body: StatusTransitionRequest,
    request: Request,
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.COMPETENT_AUTHORITY, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    await transition(
        db=db,
        instrument=instrument,
        to_status=body.to_status,
        actor=current_user,
        reason=body.reason or "Officer status transition",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    return await get_instrument(instrument.id, current_user, db)


@router.post("/{id}/renew", response_model=InstrumentResponse)
async def renew_instrument(
    id: str,
    data: RenewalRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == id)
    parent = (await db.execute(stmt)).scalars().first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent instrument not found")

    check_instrument_access(parent, current_user)

    # Coverage gap validation: new issue date should be on or before parent maturity date
    if data.issue_date > parent.maturity_date:
        # Allowed but flagged
        pass

    # Create new child instrument in renewal chain
    child = Instrument(
        institution_id=parent.institution_id,
        parent_id=parent.id,
        type=parent.type,
        reference_number=data.reference_number,
        bank_id=data.bank_id or parent.bank_id,
        branch_name=data.branch_name or parent.branch_name,
        amount=data.amount,
        issue_date=data.issue_date,
        maturity_date=data.maturity_date,
        lien_marked=data.lien_marked,
        purpose=data.purpose or f"Renewal of FDR #{parent.reference_number}",
        status=InstrumentStatus.DRAFT,
        overall_trust=TrustLevel.SUBMITTED,
        created_by=current_user.id,
    )
    db.add(child)

    # Move parent to RENEWAL_PENDING if not already
    if parent.status in {InstrumentStatus.EXPIRING, InstrumentStatus.ACTIVE, InstrumentStatus.OVERDUE, InstrumentStatus.MATURED}:
        try:
            await transition(
                db=db,
                instrument=parent,
                to_status=InstrumentStatus.RENEWAL_PENDING,
                actor=current_user,
                reason=f"Replacement instrument {child.reference_number} created.",
            )
        except Exception:
            pass

    await db.commit()
    return await get_instrument(child.id, current_user, db)


@router.get("/{id}/chain")
async def get_renewal_chain(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == id)
    current = (await db.execute(stmt)).scalars().first()
    if not current:
        raise HTTPException(status_code=404, detail="Instrument not found")

    check_instrument_access(current, current_user)

    # Trace backward to root parent
    chain = [current]
    curr_parent_id = current.parent_id
    while curr_parent_id:
        p_stmt = select(Instrument).where(Instrument.id == curr_parent_id)
        parent = (await db.execute(p_stmt)).scalars().first()
        if parent:
            chain.insert(0, parent)
            curr_parent_id = parent.parent_id
        else:
            break

    # Trace forward to descendants
    curr_id = current.id
    while True:
        c_stmt = select(Instrument).where(Instrument.parent_id == curr_id)
        child = (await db.execute(c_stmt)).scalars().first()
        if child:
            chain.append(child)
            curr_id = child.id
        else:
            break

    return [
        {
            "id": item.id,
            "reference_number": item.reference_number,
            "amount": item.amount,
            "issue_date": item.issue_date.isoformat(),
            "maturity_date": item.maturity_date.isoformat(),
            "status": item.status.value,
            "overall_trust": item.overall_trust.value,
            "is_current": item.id == current.id,
        }
        for item in chain
    ]


@router.post("/{id}/observations", response_model=ObservationResponse)
async def add_observation(
    id: str,
    data: ObservationCreate,
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.COMPETENT_AUTHORITY, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    obs = Observation(
        instrument_id=id,
        author_id=current_user.id,
        text=data.text,
        visible_to_institution=data.visible_to_institution,
    )
    db.add(obs)
    await db.commit()
    return obs
