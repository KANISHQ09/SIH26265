import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.entities import AuditLog
from app.services.audit_service import canonical_json, verify_audit_chain
import hashlib

async def rechain():
    async with AsyncSessionLocal() as db:
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
        is_valid, broken_id, message = await verify_audit_chain(db)
        print(f"Rechained {len(logs)} entries. Verification result: is_valid={is_valid}, msg={message}")

if __name__ == "__main__":
    asyncio.run(rechain())
