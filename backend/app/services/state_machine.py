from typing import Dict, Set, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.enums import InstrumentStatus, UserRole
from app.models.entities import Instrument, StatusHistory, User
from app.services.audit_service import create_audit_log

# Strict definition of all valid transitions across the instrument lifecycle
TRANSITIONS: Dict[InstrumentStatus, Set[InstrumentStatus]] = {
    InstrumentStatus.DRAFT: {
        InstrumentStatus.SUBMITTED
    },
    InstrumentStatus.SUBMITTED: {
        InstrumentStatus.UNDER_SCRUTINY
    },
    InstrumentStatus.UNDER_SCRUTINY: {
        InstrumentStatus.DISCREPANCY_FLAGGED,
        InstrumentStatus.RESUBMISSION_REQUIRED,
        InstrumentStatus.VERIFIED,
    },
    InstrumentStatus.DISCREPANCY_FLAGGED: {
        InstrumentStatus.RESUBMISSION_REQUIRED,
        InstrumentStatus.UNDER_SCRUTINY,
        InstrumentStatus.VERIFIED,
    },
    InstrumentStatus.RESUBMISSION_REQUIRED: {
        InstrumentStatus.SUBMITTED,
    },
    InstrumentStatus.VERIFIED: {
        InstrumentStatus.ACTIVE,
    },
    InstrumentStatus.ACTIVE: {
        InstrumentStatus.EXPIRING,
        InstrumentStatus.MATURED,
        InstrumentStatus.RELEASE_REQUESTED,
    },
    InstrumentStatus.EXPIRING: {
        InstrumentStatus.RENEWAL_PENDING,
        InstrumentStatus.MATURED,
        InstrumentStatus.RELEASE_REQUESTED,
    },
    InstrumentStatus.RENEWAL_PENDING: {
        InstrumentStatus.RENEWED,
        InstrumentStatus.OVERDUE,
    },
    InstrumentStatus.OVERDUE: {
        InstrumentStatus.RENEWED,
        InstrumentStatus.RELEASE_REQUESTED,
    },
    InstrumentStatus.MATURED: {
        InstrumentStatus.RELEASE_REQUESTED,
        InstrumentStatus.RENEWAL_PENDING,
    },
    InstrumentStatus.RELEASE_REQUESTED: {
        InstrumentStatus.RELEASE_UNDER_REVIEW,
    },
    InstrumentStatus.RELEASE_UNDER_REVIEW: {
        InstrumentStatus.RELEASE_APPROVED,
        InstrumentStatus.RELEASE_REJECTED,
    },
    InstrumentStatus.RELEASE_APPROVED: {
        InstrumentStatus.RELEASED,
    },
    InstrumentStatus.RELEASE_REJECTED: {
        InstrumentStatus.ACTIVE,
        InstrumentStatus.MATURED,
    },
    InstrumentStatus.RENEWED: set(),
    InstrumentStatus.RELEASED: set(),
}

# Role constraints for specific transitions
ROLE_ALLOWED_TRANSITIONS = {
    UserRole.INSTITUTION_USER: {
        (InstrumentStatus.DRAFT, InstrumentStatus.SUBMITTED),
        (InstrumentStatus.RESUBMISSION_REQUIRED, InstrumentStatus.SUBMITTED),
        (InstrumentStatus.ACTIVE, InstrumentStatus.RELEASE_REQUESTED),
        (InstrumentStatus.MATURED, InstrumentStatus.RELEASE_REQUESTED),
        (InstrumentStatus.EXPIRING, InstrumentStatus.RELEASE_REQUESTED),
    },
    UserRole.SCRUTINY_OFFICER: {
        (InstrumentStatus.SUBMITTED, InstrumentStatus.UNDER_SCRUTINY),
        (InstrumentStatus.UNDER_SCRUTINY, InstrumentStatus.DISCREPANCY_FLAGGED),
        (InstrumentStatus.UNDER_SCRUTINY, InstrumentStatus.RESUBMISSION_REQUIRED),
        (InstrumentStatus.UNDER_SCRUTINY, InstrumentStatus.VERIFIED),
        (InstrumentStatus.DISCREPANCY_FLAGGED, InstrumentStatus.RESUBMISSION_REQUIRED),
        (InstrumentStatus.DISCREPANCY_FLAGGED, InstrumentStatus.UNDER_SCRUTINY),
        (InstrumentStatus.DISCREPANCY_FLAGGED, InstrumentStatus.VERIFIED),
        (InstrumentStatus.VERIFIED, InstrumentStatus.ACTIVE),
        (InstrumentStatus.RELEASE_REQUESTED, InstrumentStatus.RELEASE_UNDER_REVIEW),
    },
}


def can_transition(
    from_status: InstrumentStatus, 
    to_status: InstrumentStatus, 
    actor_role: Optional[UserRole] = None
) -> Tuple[bool, str]:
    if from_status == to_status:
        return False, f"Instrument is already in status {to_status.value}"

    allowed_targets = TRANSITIONS.get(from_status, set())
    if to_status not in allowed_targets:
        return (
            False, 
            f"Invalid transition from {from_status.value} to {to_status.value}. Allowed: {[s.value for s in allowed_targets]}"
        )

    # If actor is system or admin, allow state transition if topologically valid
    if actor_role is None or actor_role == UserRole.ADMIN:
        return True, "Valid"

    # Section head has scrutiny officer permissions plus approval
    if actor_role in {UserRole.SECTION_HEAD, UserRole.COMPETENT_AUTHORITY, UserRole.FINANCE_OFFICER}:
        return True, "Valid"

    # Specific institution user checks
    if actor_role == UserRole.INSTITUTION_USER:
        if (from_status, to_status) not in ROLE_ALLOWED_TRANSITIONS[UserRole.INSTITUTION_USER]:
            return False, f"Institution users cannot transition instruments from {from_status.value} to {to_status.value}"

    return True, "Valid"


async def transition(
    db: AsyncSession,
    instrument: Instrument,
    to_status: InstrumentStatus,
    actor: Optional[User] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Instrument:
    """
    The ONLY approved single-gateway function to update instrument status.
    Enforces transitions, records immutable status history, and generates tamper-evident audit logs.
    """
    from_status = instrument.status
    actor_role = actor.role if actor else None
    actor_id = actor.id if actor else None

    valid, err_msg = can_transition(from_status, to_status, actor_role)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )

    # Mutate instrument status
    instrument.status = to_status
    instrument.version += 1

    # Record in status history
    history_entry = StatusHistory(
        instrument_id=instrument.id,
        from_status=from_status,
        to_status=to_status,
        actor_id=actor_id,
        reason=reason,
    )
    db.add(history_entry)

    # Record in tamper-evident audit trail
    await create_audit_log(
        db=db,
        action=f"TRANSITION_{from_status.value}_TO_{to_status.value}",
        entity_type="INSTRUMENT",
        entity_id=instrument.id,
        actor_id=actor_id,
        actor_role=actor_role.value if actor_role else "SYSTEM",
        before_json={"status": from_status.value, "version": instrument.version - 1},
        after_json={"status": to_status.value, "version": instrument.version, "reason": reason},
        ip_address=ip_address,
        user_agent=user_agent,
    )

    await db.flush()
    return instrument
