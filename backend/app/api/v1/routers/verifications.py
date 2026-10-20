from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.enums import UserRole, TrustLevel, VerificationMethod, VerificationResult, InstrumentStatus, DiscrepancySeverity, DiscrepancyStatus
from app.models.entities import Instrument, Bank, Verification, FieldTrust, Discrepancy, User
from app.schemas.verification import (
    VerificationResponse, BankVerificationTriggerRequest, OfficerVerificationSubmit
)
from app.adapters.bank.registry import get_bank_verifier
from app.services.state_machine import transition
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/verifications", tags=["Verifications"])


@router.post("/{instrument_id}/bank", response_model=VerificationResponse)
async def verify_with_bank(
    instrument_id: str,
    data: BankVerificationTriggerRequest,
    request: Request,
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == instrument_id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    bank_name = "State Bank of India"
    if instrument.bank_id:
        bank_stmt = select(Bank).where(Bank.id == instrument.bank_id)
        bank = (await db.execute(bank_stmt)).scalars().first()
        if bank:
            bank_name = bank.name

    verifier = get_bank_verifier(instrument.bank_id or "")

    # Execute bank check
    result = await verifier.verify(
        bank_name=bank_name,
        reference_number=instrument.reference_number,
        amount=instrument.amount,
        issue_date=instrument.issue_date,
        maturity_date=instrument.maturity_date,
        simulation_scenario=data.simulate_scenario,
    )

    verif_record = Verification(
        instrument_id=instrument.id,
        method=VerificationMethod.BANK_ADAPTER,
        result=VerificationResult(result.status),
        request_payload={
            "bank_name": bank_name,
            "reference_number": instrument.reference_number,
            "amount": instrument.amount,
            "simulated_scenario": data.simulate_scenario,
        },
        response_payload=result.raw,
        performed_by=current_user.id,
        performed_at=datetime.now(timezone.utc),
    )
    db.add(verif_record)

    if result.status == "MATCH":
        # Upgrade field trust to BANK_CONFIRMED
        for field in ["amount", "maturity_date", "reference_number", "lien_marked"]:
            ft_stmt = select(FieldTrust).where(
                and_(
                    FieldTrust.instrument_id == instrument.id,
                    FieldTrust.field_name == field,
                    FieldTrust.trust == TrustLevel.BANK_CONFIRMED
                )
            )
            existing_ft = (await db.execute(ft_stmt)).scalars().first()
            if not existing_ft:
                db.add(FieldTrust(
                    instrument_id=instrument.id,
                    field_name=field,
                    value_text=str(getattr(instrument, field, "")),
                    trust=TrustLevel.BANK_CONFIRMED,
                    source_ref=result.bank_reference,
                ))

        instrument.overall_trust = TrustLevel.BANK_CONFIRMED

    elif result.status == "MISMATCH":
        # Raise HIGH severity discrepancy
        disc = Discrepancy(
            instrument_id=instrument.id,
            rule_code="BANK_MISMATCH",
            severity=DiscrepancySeverity.HIGH,
            message=f"Core Banking System reported discrepancy: Confirmed amount is ₹ {result.confirmed_amount:,.2f} vs entered ₹ {instrument.amount:,.2f}. Lien: {result.lien_in_favour_of_aicte}.",
            detected_by="SYSTEM",
            status=DiscrepancyStatus.OPEN,
        )
        db.add(disc)

    await create_audit_log(
        db=db,
        action=f"BANK_VERIFICATION_{result.status}",
        entity_type="INSTRUMENT",
        entity_id=instrument.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        after_json={"status": result.status, "bank_ref": result.bank_reference},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
    await db.refresh(verif_record)
    return verif_record


@router.post("/{instrument_id}/officer", response_model=VerificationResponse)
async def verify_by_officer(
    instrument_id: str,
    data: OfficerVerificationSubmit,
    request: Request,
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Instrument).where(Instrument.id == instrument_id)
    instrument = (await db.execute(stmt)).scalars().first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")

    all_matched = all(f.matches_document for f in data.fields)
    result_val = VerificationResult.MATCH if all_matched else VerificationResult.MISMATCH

    verif_record = Verification(
        instrument_id=instrument.id,
        method=VerificationMethod.MANUAL_OFFICER,
        result=result_val,
        request_payload={"fields_checked": [f.model_dump() for f in data.fields]},
        response_payload={"observation": data.overall_observation},
        performed_by=current_user.id,
        performed_at=datetime.now(timezone.utc),
    )
    db.add(verif_record)

    if all_matched:
        # Upgrade field trust to OFFICER_VERIFIED
        for field in data.fields:
            ft_stmt = select(FieldTrust).where(
                and_(
                    FieldTrust.instrument_id == instrument.id,
                    FieldTrust.field_name == field.field_name,
                    FieldTrust.trust == TrustLevel.OFFICER_VERIFIED
                )
            )
            existing_ft = (await db.execute(ft_stmt)).scalars().first()
            if not existing_ft:
                db.add(FieldTrust(
                    instrument_id=instrument.id,
                    field_name=field.field_name,
                    value_text=field.confirmed_value,
                    trust=TrustLevel.OFFICER_VERIFIED,
                    source_ref=current_user.id,
                ))

        if instrument.overall_trust == TrustLevel.SUBMITTED:
            instrument.overall_trust = TrustLevel.OFFICER_VERIFIED

        # Transition to VERIFIED and then ACTIVE if valid
        if instrument.status in {InstrumentStatus.SUBMITTED, InstrumentStatus.UNDER_SCRUTINY}:
            try:
                if instrument.status == InstrumentStatus.SUBMITTED:
                    await transition(db, instrument, InstrumentStatus.UNDER_SCRUTINY, current_user, "Scrutiny started.")
                await transition(db, instrument, InstrumentStatus.VERIFIED, current_user, "All documents verified against FDR copy.")
                await transition(db, instrument, InstrumentStatus.ACTIVE, current_user, "Accepted as valid security deposit.")
            except Exception:
                pass

    await create_audit_log(
        db=db,
        action="OFFICER_VERIFICATION_COMPLETE",
        entity_type="INSTRUMENT",
        entity_id=instrument.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        after_json={"matched": all_matched, "notes": data.overall_observation},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.commit()
    await db.refresh(verif_record)
    return verif_record
