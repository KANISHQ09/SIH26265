from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import require_roles
from app.models.enums import UserRole
from app.models.entities import ReminderRule, ComplianceRule, User
from app.services.reminder_service import (
    set_time_travel_offset, reset_time_travel, get_current_system_date,
    refresh_instrument_statuses, generate_reminders, escalation_scan
)

router = APIRouter(prefix="/admin", tags=["Admin & Simulation"])


class TimeTravelRequest(BaseModel):
    days: int


class ReminderRuleUpdate(BaseModel):
    days_before: int
    is_active: bool


@router.post("/time-travel")
async def trigger_time_travel(
    data: TimeTravelRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECTION_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """
    Fast-forwards system date for interactive demonstrations,
    automatically firing lifecycle transitions, reminders, and escalations.
    """
    new_system_date = set_time_travel_offset(data.days)
    status_stats = await refresh_instrument_statuses(db)
    reminders_sent = await generate_reminders(db)
    escalations_raised = await escalation_scan(db)
    await db.commit()

    return {
        "success": True,
        "simulated_system_date": new_system_date.isoformat(),
        "days_advanced": data.days,
        "effects": {
            "status_refreshes": status_stats,
            "reminders_dispatched": reminders_sent,
            "escalations_triggered": escalations_raised,
        }
    }


@router.post("/time-travel/reset")
async def reset_time(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECTION_HEAD)),
):
    current_date = reset_time_travel()
    return {"success": True, "system_date": current_date.isoformat(), "message": "Time travel reset to today."}


@router.get("/system-date")
async def get_system_date():
    current_date = get_current_system_date()
    return {"system_date": current_date.isoformat()}


@router.get("/reminder-rules")
async def list_reminder_rules(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECTION_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ReminderRule).order_by(ReminderRule.days_before.desc())
    rules = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "days_before": r.days_before,
            "notify_roles": r.notify_roles,
            "notify_institution": r.notify_institution,
            "is_active": r.is_active,
        }
        for r in rules
    ]


@router.put("/reminder-rules/{id}")
async def update_reminder_rule(
    id: str,
    data: ReminderRuleUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ReminderRule).where(ReminderRule.id == id)
    rule = (await db.execute(stmt)).scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.days_before = data.days_before
    rule.is_active = data.is_active
    await db.commit()
    return {"success": True, "rule": rule.name, "days_before": rule.days_before}


@router.post("/run-scheduler")
async def run_scheduler_manually(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    status_stats = await refresh_instrument_statuses(db)
    reminders = await generate_reminders(db)
    escalations = await escalation_scan(db)
    await db.commit()
    return {
        "status_refreshes": status_stats,
        "reminders_dispatched": reminders,
        "escalations_triggered": escalations,
    }
