from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.enums import UserRole, DiscrepancyStatus
from app.models.entities import Discrepancy, User
from app.schemas.discrepancy import DiscrepancyResponse, DiscrepancyResolveRequest

router = APIRouter(prefix="/discrepancies", tags=["Discrepancies"])


@router.get("/instrument/{instrument_id}", response_model=List[DiscrepancyResponse])
async def list_instrument_discrepancies(
    instrument_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Discrepancy).where(Discrepancy.instrument_id == instrument_id).order_by(Discrepancy.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("", response_model=List[DiscrepancyResponse])
async def list_all_open_discrepancies(
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Discrepancy).where(Discrepancy.status == DiscrepancyStatus.OPEN).order_by(Discrepancy.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/{id}/resolve", response_model=DiscrepancyResponse)
async def resolve_discrepancy(
    id: str,
    data: DiscrepancyResolveRequest,
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Discrepancy).where(Discrepancy.id == id)
    disc = (await db.execute(stmt)).scalars().first()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy not found")

    disc.status = data.status
    disc.resolution_note = data.resolution_note
    disc.resolved_by = current_user.id
    disc.resolved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(disc)
    return disc
