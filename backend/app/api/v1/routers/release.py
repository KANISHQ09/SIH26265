from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, check_instrument_access, require_roles
from app.models.enums import UserRole
from app.models.entities import ReleaseRequest, Instrument, User
from app.schemas.release import (
    ReleaseRequestResponse, ReleaseRequestCreate, ApprovalActionRequest
)
from app.services.release_service import (
    create_release_request, process_approval_action, compute_eligibility_checklist
)

router = APIRouter(prefix="/release", tags=["Release Workflow"])


@router.post("/{instrument_id}/request", response_model=ReleaseRequestResponse)
async def submit_release_request(
    instrument_id: str,
    data: ReleaseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == instrument_id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    check_instrument_access(instrument, current_user)

    release_req = await create_release_request(
        db=db,
        instrument=instrument,
        request_type=data.request_type,
        reason=data.reason,
        requested_by=current_user,
    )
    await db.commit()

    # Load approval steps
    stmt_full = (
        select(ReleaseRequest)
        .options(selectinload(ReleaseRequest.approval_steps))
        .where(ReleaseRequest.id == release_req.id)
    )
    return (await db.execute(stmt_full)).scalars().first()


@router.get("", response_model=List[ReleaseRequestResponse])
async def list_release_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ReleaseRequest)
        .options(selectinload(ReleaseRequest.approval_steps))
        .order_by(desc(ReleaseRequest.created_at))
    )
    if current_user.role == UserRole.INSTITUTION_USER:
        stmt = stmt.where(ReleaseRequest.requested_by == current_user.id)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{id}", response_model=ReleaseRequestResponse)
async def get_release_request(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ReleaseRequest)
        .options(selectinload(ReleaseRequest.approval_steps))
        .where(ReleaseRequest.id == id)
    )
    release_req = (await db.execute(stmt)).scalars().first()
    if not release_req:
        raise HTTPException(status_code=404, detail="Release request not found")
    return release_req


@router.post("/{id}/action", response_model=ReleaseRequestResponse)
async def take_approval_action(
    id: str,
    data: ApprovalActionRequest,
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.FINANCE_OFFICER, 
        UserRole.COMPETENT_AUTHORITY, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    release_req = await process_approval_action(
        db=db,
        release_id=id,
        actor=current_user,
        decision=data.decision,
        note=data.note,
    )
    await db.commit()

    stmt_full = (
        select(ReleaseRequest)
        .options(selectinload(ReleaseRequest.approval_steps))
        .where(ReleaseRequest.id == release_req.id)
    )
    return (await db.execute(stmt_full)).scalars().first()
