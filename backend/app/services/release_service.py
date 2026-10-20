from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.enums import InstrumentStatus, TrustLevel, UserRole, DiscrepancySeverity, DiscrepancyStatus
from app.models.entities import Instrument, ReleaseRequest, ApprovalStep, User, Discrepancy
from app.services.state_machine import transition
from app.services.audit_service import create_audit_log


async def compute_eligibility_checklist(db: AsyncSession, instrument: Instrument) -> Dict[str, Any]:
    """Computes automated eligibility checklist for release/refund request."""
    # 1. Trust check
    trust_verified = instrument.overall_trust in {TrustLevel.OFFICER_VERIFIED, TrustLevel.BANK_CONFIRMED}

    # 2. Open high-severity discrepancies
    disc_stmt = select(Discrepancy).where(
        and_(
            Discrepancy.instrument_id == instrument.id,
            Discrepancy.severity == DiscrepancySeverity.HIGH,
            Discrepancy.status == DiscrepancyStatus.OPEN
        )
    )
    high_disc = (await db.execute(disc_stmt)).scalars().all()
    no_high_discrepancies = len(high_disc) == 0

    # 3. Status eligibility
    status_eligible = instrument.status in {InstrumentStatus.ACTIVE, InstrumentStatus.MATURED, InstrumentStatus.EXPIRING}

    all_passed = trust_verified and no_high_discrepancies and status_eligible

    return {
        "is_eligible": all_passed,
        "trust_verified": {
            "passed": trust_verified,
            "current_trust": instrument.overall_trust.value,
            "message": "Instrument verified by AICTE Officer or Confirmed by Bank" if trust_verified else "Must be Officer-Verified or Bank-Confirmed before release."
        },
        "no_high_discrepancies": {
            "passed": no_high_discrepancies,
            "open_count": len(high_disc),
            "message": "Zero open high severity discrepancies" if no_high_discrepancies else f"{len(high_disc)} unresolved high-severity discrepancy found."
        },
        "lifecycle_status_eligible": {
            "passed": status_eligible,
            "current_status": instrument.status.value,
            "message": "Instrument is in eligible status for release processing"
        }
    }


async def create_release_request(
    db: AsyncSession,
    instrument: Instrument,
    request_type: str,
    reason: str,
    requested_by: User,
) -> ReleaseRequest:
    # Validate instrument state
    if instrument.status not in {InstrumentStatus.ACTIVE, InstrumentStatus.MATURED, InstrumentStatus.EXPIRING}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request release for instrument in status {instrument.status.value}"
        )

    checklist = await compute_eligibility_checklist(db, instrument)

    # Transition instrument to RELEASE_REQUESTED
    await transition(
        db=db,
        instrument=instrument,
        to_status=InstrumentStatus.RELEASE_REQUESTED,
        actor=requested_by,
        reason=f"Release request submitted: {reason}",
    )

    release_req = ReleaseRequest(
        instrument_id=instrument.id,
        request_type=request_type,
        reason=reason,
        requested_by=requested_by.id,
        status="SUBMITTED",
        checklist_json=checklist,
    )
    db.add(release_req)
    await db.flush()

    # Create 3 sequential approval steps (Segregation of Duties)
    step1 = ApprovalStep(
        release_id=release_req.id,
        step_order=1,
        required_role=UserRole.SCRUTINY_OFFICER,
        decision="PENDING",
    )
    step2 = ApprovalStep(
        release_id=release_req.id,
        step_order=2,
        required_role=UserRole.FINANCE_OFFICER,
        decision="PENDING",
    )
    step3 = ApprovalStep(
        release_id=release_req.id,
        step_order=3,
        required_role=UserRole.COMPETENT_AUTHORITY,
        decision="PENDING",
    )
    db.add_all([step1, step2, step3])
    await db.flush()

    return release_req


async def process_approval_action(
    db: AsyncSession,
    release_id: str,
    actor: User,
    decision: str, # "APPROVED" or "REJECTED"
    note: str,
) -> ReleaseRequest:
    stmt = select(ReleaseRequest).where(ReleaseRequest.id == release_id)
    release_req = (await db.execute(stmt)).scalars().first()
    if not release_req:
        raise HTTPException(status_code=404, detail="Release request not found")

    instr_stmt = select(Instrument).where(Instrument.id == release_req.instrument_id)
    instrument = (await db.execute(instr_stmt)).scalars().first()

    # Segregation of duties: preparer cannot approve own step
    if release_req.requested_by == actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Segregation of Duties Violation: You cannot review or approve your own release request."
        )

    # Find pending steps
    steps_stmt = select(ApprovalStep).where(ApprovalStep.release_id == release_id).order_by(ApprovalStep.step_order.asc())
    steps = (await db.execute(steps_stmt)).scalars().all()

    current_step = None
    for step in steps:
        if step.decision == "PENDING":
            current_step = step
            break

    if not current_step:
        raise HTTPException(status_code=400, detail="All approval steps have already been resolved.")

    # Role validation for the current step (Admin can override)
    if actor.role != current_step.required_role and actor.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Current step #{current_step.step_order} requires role {current_step.required_role.value}, user is {actor.role.value}"
        )

    current_step.decision = decision.upper()
    current_step.actor_id = actor.id
    current_step.note = note
    current_step.acted_at = datetime.now(timezone.utc)

    now = datetime.now(timezone.utc)

    if decision.upper() == "REJECTED":
        release_req.status = "REJECTED"
        release_req.decided_by = actor.id
        release_req.decision_note = f"Rejected at Step {current_step.step_order}: {note}"
        release_req.decided_at = now
        await transition(
            db=db,
            instrument=instrument,
            to_status=InstrumentStatus.RELEASE_REJECTED,
            actor=actor,
            reason=f"Release rejected at Step {current_step.step_order}: {note}",
        )
    else:
        # Check if all steps approved
        all_approved = all(s.decision == "APPROVED" for s in steps)
        if all_approved:
            release_req.status = "APPROVED"
            release_req.decided_by = actor.id
            release_req.decision_note = note
            release_req.decided_at = now
            # Transition to RELEASE_APPROVED then RELEASED
            await transition(
                db=db,
                instrument=instrument,
                to_status=InstrumentStatus.RELEASE_APPROVED,
                actor=actor,
                reason="All 3 approval steps successfully completed.",
            )
            await transition(
                db=db,
                instrument=instrument,
                to_status=InstrumentStatus.RELEASED,
                actor=actor,
                reason="Discharge recorded and security deposit officially released.",
            )
        else:
            if instrument.status == InstrumentStatus.RELEASE_REQUESTED:
                await transition(
                    db=db,
                    instrument=instrument,
                    to_status=InstrumentStatus.RELEASE_UNDER_REVIEW,
                    actor=actor,
                    reason=f"Step #{current_step.step_order} approved by {actor.role.value}.",
                )

    await db.flush()
    return release_req
