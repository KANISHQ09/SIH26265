from datetime import date, datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import DiscrepancySeverity, DiscrepancyStatus, DocumentType
from app.models.entities import Instrument, Document, Discrepancy, ComplianceRule, Bank, Verification


class DiscrepancyRule:
    code: str
    severity: DiscrepancySeverity

    async def check(
        self, 
        db: AsyncSession, 
        instrument: Instrument, 
        documents: List[Document]
    ) -> Optional[str]:
        """Returns discrepancy message if violated, or None if passed."""
        raise NotImplementedError


class MissingDocumentRule(DiscrepancyRule):
    code = "MISSING_DOCUMENT"
    severity = DiscrepancySeverity.MEDIUM

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        has_fdr_copy = any(doc.doc_type == DocumentType.FDR_COPY for doc in documents)
        if not has_fdr_copy:
            return "Mandatory document 'FDR_COPY' has not been uploaded."
        return None


class MissingFieldRule(DiscrepancyRule):
    code = "MISSING_FIELD"
    severity = DiscrepancySeverity.MEDIUM

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        missing = []
        if not instrument.reference_number:
            missing.append("FDR Reference Number")
        if not instrument.bank_id:
            missing.append("Issuing Bank")
        if not instrument.amount or instrument.amount <= 0:
            missing.append("Valid Amount")
        if not instrument.issue_date:
            missing.append("Issue Date")
        if not instrument.maturity_date:
            missing.append("Maturity Date")

        if missing:
            return f"Missing mandatory field(s): {', '.join(missing)}"
        return None


class InvalidDatesRule(DiscrepancyRule):
    code = "INVALID_DATES"
    severity = DiscrepancySeverity.HIGH

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        if instrument.maturity_date <= instrument.issue_date:
            return f"Invalid dates: Maturity date ({instrument.maturity_date}) cannot be on or before issue date ({instrument.issue_date})."
        return None


class LienNotMarkedRule(DiscrepancyRule):
    code = "LIEN_NOT_MARKED"
    severity = DiscrepancySeverity.HIGH

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        if not instrument.lien_marked:
            return "Lien in favour of AICTE is not marked on this FDR instrument."
        return None


class ValidityTooShortRule(DiscrepancyRule):
    code = "VALIDITY_TOO_SHORT"
    severity = DiscrepancySeverity.MEDIUM

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        total_days = (instrument.maturity_date - instrument.issue_date).days
        # Minimum AICTE FDR validity standard is typically at least 3 years (approx 1095 days)
        if total_days < 1095:
            years = round(total_days / 365, 1)
            return f"Validity duration ({years} years / {total_days} days) is less than the AICTE mandated 3-year minimum."
        return None


class DuplicateReferenceRule(DiscrepancyRule):
    code = "DUPLICATE_REFERENCE"
    severity = DiscrepancySeverity.HIGH

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        if not instrument.bank_id or not instrument.reference_number:
            return None

        stmt = select(Instrument).where(
            and_(
                Instrument.bank_id == instrument.bank_id,
                Instrument.reference_number == instrument.reference_number,
                Instrument.id != instrument.id
            )
        )
        result = await db.execute(stmt)
        duplicate = result.scalars().first()
        if duplicate:
            return f"Duplicate FDR Reference Number '{instrument.reference_number}' already registered in system under Instrument {duplicate.id}."
        return None


class DuplicateDocumentRule(DiscrepancyRule):
    code = "DUPLICATE_DOCUMENT"
    severity = DiscrepancySeverity.HIGH

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        for doc in documents:
            stmt = select(Document).where(
                and_(
                    Document.sha256 == doc.sha256,
                    Document.instrument_id != instrument.id
                )
            )
            result = await db.execute(stmt)
            match = result.scalars().first()
            if match:
                return f"Duplicate Document detected! File '{doc.file_name}' matches cryptographic hash of an existing file in instrument {match.instrument_id}."
        return None


class AmountBelowRequiredRule(DiscrepancyRule):
    code = "AMOUNT_BELOW_REQUIRED"
    severity = DiscrepancySeverity.HIGH

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        # Query compliance rules
        stmt = select(ComplianceRule).where(ComplianceRule.is_active == True)
        result = await db.execute(stmt)
        rules = result.scalars().all()
        if not rules:
            min_req = 1000000.0 # Default fallback minimum: 10 Lakhs INR
        else:
            min_req = min(r.required_amount for r in rules)

        if instrument.amount < min_req:
            return f"Deposited amount (₹ {instrument.amount:,.2f}) is below minimum AICTE regulatory requirement (₹ {min_req:,.2f})."
        return None


class OCRMismatchRule(DiscrepancyRule):
    code = "OCR_MISMATCH"
    severity = DiscrepancySeverity.MEDIUM

    async def check(self, db: AsyncSession, instrument: Instrument, documents: List[Document]) -> Optional[str]:
        for doc in documents:
            if doc.ocr_json and isinstance(doc.ocr_json, dict):
                extracted = doc.ocr_json.get("extracted_fields", {})
                ocr_amount = extracted.get("amount")
                if ocr_amount is not None:
                    try:
                        parsed_amount = float(ocr_amount)
                        if abs(parsed_amount - instrument.amount) > 1.0:
                            return f"OCR amount (₹ {parsed_amount:,.2f}) differs from entered amount (₹ {instrument.amount:,.2f})."
                    except (ValueError, TypeError):
                        pass
        return None


class DiscrepancyEngine:
    def __init__(self):
        self.rules: List[DiscrepancyRule] = [
            MissingDocumentRule(),
            MissingFieldRule(),
            InvalidDatesRule(),
            LienNotMarkedRule(),
            ValidityTooShortRule(),
            DuplicateReferenceRule(),
            DuplicateDocumentRule(),
            AmountBelowRequiredRule(),
            OCRMismatchRule(),
        ]

    async def scan_instrument(self, db: AsyncSession, instrument_id: str) -> List[Discrepancy]:
        """
        Executes all validation rules against an instrument, inserts new discrepancies,
        and returns the list of open discrepancies.
        """
        stmt = select(Instrument).where(Instrument.id == instrument_id)
        result = await db.execute(stmt)
        instrument = result.scalars().first()
        if not instrument:
            return []

        doc_stmt = select(Document).where(and_(Document.instrument_id == instrument_id, Document.is_current == True))
        doc_result = await db.execute(doc_stmt)
        documents = list(doc_result.scalars().all())

        new_discrepancies: List[Discrepancy] = []

        for rule in self.rules:
            msg = await rule.check(db, instrument, documents)
            if msg:
                # Check if discrepancy already open
                check_stmt = select(Discrepancy).where(
                    and_(
                        Discrepancy.instrument_id == instrument_id,
                        Discrepancy.rule_code == rule.code,
                        Discrepancy.status == DiscrepancyStatus.OPEN
                    )
                )
                existing = (await db.execute(check_stmt)).scalars().first()
                if not existing:
                    disc = Discrepancy(
                        instrument_id=instrument_id,
                        rule_code=rule.code,
                        severity=rule.severity,
                        message=msg,
                        detected_by="SYSTEM",
                        status=DiscrepancyStatus.OPEN,
                    )
                    db.add(disc)
                    new_discrepancies.append(disc)

        if new_discrepancies:
            await db.flush()

        # Return all open discrepancies
        all_open_stmt = select(Discrepancy).where(
            and_(
                Discrepancy.instrument_id == instrument_id,
                Discrepancy.status == DiscrepancyStatus.OPEN
            )
        )
        return list((await db.execute(all_open_stmt)).scalars().all())


engine = DiscrepancyEngine()
