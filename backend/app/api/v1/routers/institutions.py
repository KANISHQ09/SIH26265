from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.enums import UserRole
from app.models.entities import Institution, Instrument, User
from app.schemas.instrument import InstitutionBriefResponse

router = APIRouter(prefix="/institutions", tags=["Institutions"])


@router.get("", response_model=List[InstitutionBriefResponse])
async def list_institutions(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Institution).where(Institution.is_active == True)
    if search:
        stmt = stmt.where(
            Institution.name.ilike(f"%{search}%") | 
            Institution.aicte_id.ilike(f"%{search}%")
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{id}")
async def get_institution_360(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Institution).where(Institution.id == id)
    inst = (await db.execute(stmt)).scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    # Fetch all instruments for this institution
    instr_stmt = (
        select(Instrument)
        .options(selectinload(Instrument.bank))
        .where(Instrument.institution_id == id)
        .order_by(desc(Instrument.created_at))
    )
    instruments = (await db.execute(instr_stmt)).scalars().all()

    total_exposure = sum(i.amount for i in instruments)
    active_count = sum(1 for i in instruments if i.status.value in ["ACTIVE", "EXPIRING", "VERIFIED"])

    return {
        "institution": {
            "id": inst.id,
            "aicte_id": inst.aicte_id,
            "name": inst.name,
            "state": inst.state,
            "district": inst.district,
            "contact_email": inst.contact_email,
            "contact_phone": inst.contact_phone,
        },
        "metrics": {
            "total_instruments": len(instruments),
            "active_instruments": active_count,
            "total_exposure_inr": total_exposure,
        },
        "instruments": [
            {
                "id": i.id,
                "reference_number": i.reference_number,
                "bank_name": i.bank.name if i.bank else "Unknown Bank",
                "amount": i.amount,
                "issue_date": i.issue_date.isoformat(),
                "maturity_date": i.maturity_date.isoformat(),
                "status": i.status.value,
                "overall_trust": i.overall_trust.value,
            }
            for i in instruments
        ]
    }
