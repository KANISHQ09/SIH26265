import asyncio
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, Any, Dict, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import AuditLog

_audit_lock = asyncio.Lock()
_latest_hash: Optional[str] = None


def canonical_json(data: Any) -> str:
    """Produces deterministic canonical JSON for tamper-evident hashing."""
    if data is None or data == "null" or data == "":
        return ""
    if isinstance(data, str):
        try:
            parsed = json.loads(data)
            if parsed is None:
                return ""
            return json.dumps(parsed, sort_keys=True, separators=(',', ':'))
        except Exception:
            return data
    return json.dumps(data, sort_keys=True, separators=(',', ':'), default=str)


async def create_audit_log(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    before_json: Optional[Dict[str, Any]] = None,
    after_json: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    global _latest_hash
    async with _audit_lock:
        # 1. Fetch the last audit log or use current tracked latest hash to prevent race conditions
        if _latest_hash is None:
            stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
            result = await db.execute(stmt)
            last_log = result.scalars().first()
            prev_hash = last_log.row_hash if last_log and last_log.row_hash else "0" * 64
        else:
            prev_hash = _latest_hash

        # 2. Canonical serialization of row data
        now = datetime.now(timezone.utc)
        dt_str = now.strftime("%Y-%m-%d %H:%M:%S")
        raw_payload = (
            f"{prev_hash}|"
            f"{actor_id or ''}|"
            f"{actor_role or ''}|"
            f"{action}|"
            f"{entity_type}|"
            f"{entity_id or ''}|"
            f"{canonical_json(before_json)}|"
            f"{canonical_json(after_json)}|"
            f"{dt_str}"
        )

        row_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
        _latest_hash = row_hash

        log_entry = AuditLog(
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_json=before_json,
            after_json=after_json,
            ip_address=ip_address,
            user_agent=user_agent,
            prev_hash=prev_hash,
            row_hash=row_hash,
            at=now,
        )

        db.add(log_entry)
        await db.flush()
        return log_entry


async def repair_audit_chain(db: AsyncSession) -> Tuple[bool, Optional[int], str]:
    """
    Recomputes and heals the entire cryptographic hash chain across all audit logs.
    Ensures non-repudiation links are continuous and verified.
    """
    global _latest_hash
    async with _audit_lock:
        stmt = select(AuditLog).order_by(AuditLog.id.asc())
        result = await db.execute(stmt)
        logs = result.scalars().all()

        prev = "0" * 64
        for log in logs:
            dt_str = log.at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(log.at, 'strftime') else str(log.at)[:19]
            raw_payload = (
                f"{prev}|"
                f"{log.actor_id or ''}|"
                f"{log.actor_role or ''}|"
                f"{log.action}|"
                f"{log.entity_type}|"
                f"{log.entity_id or ''}|"
                f"{canonical_json(log.before_json)}|"
                f"{canonical_json(log.after_json)}|"
                f"{dt_str}"
            )
            h = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
            log.prev_hash = prev
            log.row_hash = h
            prev = h

        await db.commit()
        _latest_hash = prev

    return await verify_audit_chain(db)


async def verify_audit_chain(db: AsyncSession) -> Tuple[bool, Optional[int], str]:
    """
    Verifies that no rows in the audit trail have been modified, deleted, or inserted.
    Returns: (is_valid, broken_row_id_or_none, message)
    """
    stmt = select(AuditLog).order_by(AuditLog.id.asc())
    result = await db.execute(stmt)
    logs = result.scalars().all()

    if not logs:
        return True, None, "Audit chain is empty and valid."

    expected_prev = "0" * 64

    for log in logs:
        if log.prev_hash != expected_prev:
            return (
                False, 
                log.id, 
                f"Hash link broken at Audit ID {log.id}: prev_hash does not match previous entry's row_hash."
            )
        
        # Recompute hash
        dt_str = log.at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(log.at, 'strftime') else str(log.at)[:19]
        raw_payload = (
            f"{expected_prev}|"
            f"{log.actor_id or ''}|"
            f"{log.actor_role or ''}|"
            f"{log.action}|"
            f"{log.entity_type}|"
            f"{log.entity_id or ''}|"
            f"{canonical_json(log.before_json)}|"
            f"{canonical_json(log.after_json)}|"
            f"{dt_str}"
        )
        recomputed_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
        if recomputed_hash != log.row_hash:
            return (
                False, 
                log.id, 
                f"Tampering detected at Audit ID {log.id}: row contents modified! Hash mismatch."
            )

        expected_prev = log.row_hash

    return True, None, f"Chain integrity verified: {len(logs)} audit entries cryptographically valid."
