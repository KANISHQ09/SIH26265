from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import InstrumentStatus, UserRole
from app.models.entities import Instrument, ReminderRule, Reminder, Notification, Escalation, User
from app.services.state_machine import transition


# Global simulated system date offset for interactive demos
SIMULATED_DATE_OFFSET_DAYS: int = 0


def get_current_system_date() -> date:
    """Returns today's date adjusted by any time-travel offset."""
    return date.today() + timedelta(days=SIMULATED_DATE_OFFSET_DAYS)


def set_time_travel_offset(days: int) -> date:
    global SIMULATED_DATE_OFFSET_DAYS
    SIMULATED_DATE_OFFSET_DAYS = days
    return get_current_system_date()


def reset_time_travel() -> date:
    global SIMULATED_DATE_OFFSET_DAYS
    SIMULATED_DATE_OFFSET_DAYS = 0
    return date.today()


async def refresh_instrument_statuses(db: AsyncSession) -> Dict[str, int]:
    """
    Automated job to refresh instrument lifecycle states based on current system date.
    - ACTIVE -> EXPIRING when within 90 days of maturity.
    - EXPIRING / ACTIVE -> MATURED when maturity date reached.
    - RENEWAL_PENDING -> OVERDUE when maturity date has passed without replacement.
    """
    current_date = get_current_system_date()
    stats = {"expiring": 0, "matured": 0, "overdue": 0}

    # 1. Check for matured instruments
    stmt_matured = select(Instrument).where(
        and_(
            Instrument.status.in_([InstrumentStatus.ACTIVE, InstrumentStatus.EXPIRING]),
            Instrument.maturity_date <= current_date,
        )
    )
    matured_list = (await db.execute(stmt_matured)).scalars().all()
    for inst in matured_list:
        await transition(
            db=db,
            instrument=inst,
            to_status=InstrumentStatus.MATURED,
            actor=None, # System actor
            reason=f"Automated status refresh: Maturity date ({inst.maturity_date}) reached on system date {current_date}.",
        )
        stats["matured"] += 1

    # 2. Check for expiring instruments (within 90 days)
    ninety_days_ahead = current_date + timedelta(days=90)
    stmt_expiring = select(Instrument).where(
        and_(
            Instrument.status == InstrumentStatus.ACTIVE,
            Instrument.maturity_date <= ninety_days_ahead,
            Instrument.maturity_date > current_date,
        )
    )
    expiring_list = (await db.execute(stmt_expiring)).scalars().all()
    for inst in expiring_list:
        await transition(
            db=db,
            instrument=inst,
            to_status=InstrumentStatus.EXPIRING,
            actor=None,
            reason=f"Automated status refresh: Entered 90-day maturity window ({inst.maturity_date}).",
        )
        stats["expiring"] += 1

    # 3. Check for overdue renewal pending cases
    stmt_overdue = select(Instrument).where(
        and_(
            Instrument.status == InstrumentStatus.RENEWAL_PENDING,
            Instrument.maturity_date < current_date,
        )
    )
    overdue_list = (await db.execute(stmt_overdue)).scalars().all()
    for inst in overdue_list:
        await transition(
            db=db,
            instrument=inst,
            to_status=InstrumentStatus.OVERDUE,
            actor=None,
            reason=f"Automated status refresh: Renewal pending deadline passed on {inst.maturity_date}.",
        )
        stats["overdue"] += 1

    await db.flush()
    return stats


async def generate_reminders(db: AsyncSession) -> int:
    """
    Evaluates all active reminder rules (e.g. 90, 60, 30, 15, 7, 1 days before)
    and dispatches notifications idempotently.
    """
    current_date = get_current_system_date()
    rules_stmt = select(ReminderRule).where(ReminderRule.is_active == True)
    rules = (await db.execute(rules_stmt)).scalars().all()

    reminders_created = 0

    for rule in rules:
        target_maturity = current_date + timedelta(days=rule.days_before)
        # Find instruments maturing on target_maturity
        instr_stmt = select(Instrument).where(
            and_(
                Instrument.status.in_([InstrumentStatus.ACTIVE, InstrumentStatus.EXPIRING, InstrumentStatus.RENEWAL_PENDING]),
                Instrument.maturity_date == target_maturity
            )
        )
        instruments = (await db.execute(instr_stmt)).scalars().all()

        for inst in instruments:
            # Idempotency check: has this rule already fired for this instrument on this due date?
            rem_stmt = select(Reminder).where(
                and_(
                    Reminder.instrument_id == inst.id,
                    Reminder.rule_id == rule.id,
                    Reminder.due_on == current_date
                )
            )
            existing = (await db.execute(rem_stmt)).scalars().first()
            if not existing:
                # Record reminder
                rem = Reminder(
                    instrument_id=inst.id,
                    rule_id=rule.id,
                    due_on=current_date,
                    sent_at=datetime.now(timezone.utc),
                )
                db.add(rem)
                reminders_created += 1

                # Create in-app notifications for institution users
                if rule.notify_institution:
                    user_stmt = select(User).where(User.institution_id == inst.institution_id)
                    inst_users = (await db.execute(user_stmt)).scalars().all()
                    for u in inst_users:
                        notif = Notification(
                            user_id=u.id,
                            instrument_id=inst.id,
                            channel="IN_APP",
                            title=f"FDR Maturity Alert: {rule.days_before} Days Remaining",
                            body=f"FDR #{inst.reference_number} of amount ₹ {inst.amount:,.2f} matures on {inst.maturity_date}. Please prepare renewal/release submission.",
                            status="PENDING",
                        )
                        db.add(notif)

    await db.flush()
    return reminders_created


async def escalation_scan(db: AsyncSession) -> int:
    """
    Scans for overdue cases and triggers escalation level 1, 2, or 3.
    """
    current_date = get_current_system_date()
    stmt = select(Instrument).where(
        or_(
            Instrument.status == InstrumentStatus.OVERDUE,
            and_(Instrument.status == InstrumentStatus.EXPIRING, Instrument.maturity_date <= current_date + timedelta(days=7))
        )
    )
    instruments = (await db.execute(stmt)).scalars().all()
    escalations_raised = 0

    for inst in instruments:
        # Determine escalation level based on days past maturity
        days_past = (current_date - inst.maturity_date).days
        level = 1
        if days_past >= 7:
            level = 3 # Competent Authority / Director
        elif days_past >= 0:
            level = 2 # Section Head
        else:
            level = 1 # Scrutiny Officer

        # Check if already escalated at this level
        esc_stmt = select(Escalation).where(
            and_(
                Escalation.instrument_id == inst.id,
                Escalation.level == level,
                Escalation.resolved_at.is_(None)
            )
        )
        existing = (await db.execute(esc_stmt)).scalars().first()
        if not existing:
            esc = Escalation(
                instrument_id=inst.id,
                level=level,
                reason="OVERDUE_RENEWAL" if days_past >= 0 else "APPROACHING_MATURITY_CRITICAL",
                raised_at=datetime.now(timezone.utc),
            )
            db.add(esc)
            escalations_raised += 1

    await db.flush()
    return escalations_raised
