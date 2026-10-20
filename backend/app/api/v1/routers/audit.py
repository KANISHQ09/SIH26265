from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import require_roles
from app.models.enums import UserRole
from app.models.entities import AuditLog, User
from app.services.audit_service import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("")
async def list_audit_logs(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_roles(UserRole.AUDITOR, UserRole.ADMIN, UserRole.SECTION_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog).order_by(desc(AuditLog.id))
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if action:
        stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "actor_id": l.actor_id,
            "actor_role": l.actor_role,
            "before_json": l.before_json,
            "after_json": l.after_json,
            "ip_address": l.ip_address,
            "prev_hash": l.prev_hash,
            "row_hash": l.row_hash,
            "at": l.at.isoformat(),
        }
        for l in logs
    ]


@router.get("/verify-chain")
async def verify_chain(
    current_user: User = Depends(require_roles(UserRole.AUDITOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Recomputes SHA-256 hash chains across the entire audit trail to guarantee
    non-repudiation and detect any illicit database modifications.
    """
    is_valid, broken_id, message = await verify_audit_chain(db)
    return {
        "is_valid": is_valid,
        "broken_at_audit_id": broken_id,
        "message": message,
    }


@router.post("/tamper-demo")
async def deliberate_tamper_demo(
    audit_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Deliberately modifies an audit entry's contents without re-hashing
    to demonstrate instant cryptographic tamper detection during audit reviews.
    """
    stmt = select(AuditLog).where(AuditLog.id == audit_id)
    log_entry = (await db.execute(stmt)).scalars().first()
    if not log_entry:
        raise HTTPException(status_code=404, detail="Audit log entry not found")

    log_entry.action = "TAMPERED_ACTION_UNAUTHORIZED"
    await db.commit()

    # Re-verify immediately
    is_valid, broken_id, message = await verify_audit_chain(db)
    return {
        "tamper_executed": True,
        "tampered_audit_id": audit_id,
        "chain_verification_result": {
            "is_valid": is_valid,
            "broken_at_audit_id": broken_id,
            "message": message,
        }
    }
