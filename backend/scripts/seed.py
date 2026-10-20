import asyncio
import os
import sys
from datetime import date, datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.db.session import engine, Base, AsyncSessionLocal
from app.models.enums import (
    UserRole, InstrumentStatus, TrustLevel, DocumentType, 
    DiscrepancySeverity, DiscrepancyStatus, VerificationMethod, VerificationResult
)
from app.models.entities import (
    Institution, User, Bank, Instrument, FieldTrust, Document, 
    Verification, Discrepancy, Observation, StatusHistory, 
    ReleaseRequest, ApprovalStep, ReminderRule, ComplianceRule, AuditLog
)
from app.core.security import get_password_hash
from app.services.audit_service import create_audit_log


async def seed_data():
    sys.stdout.reconfigure(encoding='utf-8')
    print("[INIT] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing_users = await db.execute(select(User))
        if existing_users.scalars().first():
            print("✅ Database already seeded. Skipping initial seed.")
            return

        print("[BANKS] Seeding Banks...")
        banks = [
            Bank(name="State Bank of India", ifsc_prefix="SBIN", verification_supported=True),
            Bank(name="Punjab National Bank", ifsc_prefix="PUNB", verification_supported=True),
            Bank(name="Canara Bank", ifsc_prefix="CNRB", verification_supported=True),
            Bank(name="Bank of Baroda", ifsc_prefix="BARB", verification_supported=True),
            Bank(name="HDFC Bank", ifsc_prefix="HDFC", verification_supported=True),
            Bank(name="ICICI Bank", ifsc_prefix="ICIC", verification_supported=True),
            Bank(name="Gramin Regional Co-op Bank", ifsc_prefix="GCOB", verification_supported=False),
        ]
        db.add_all(banks)
        await db.flush()

        print("[RULES] Seeding Reminder & Escalation Rules...")
        rules = [
            ReminderRule(name="90-Day Early Advisory", days_before=90, notify_roles=["SCRUTINY_OFFICER"], notify_institution=True, channel=["EMAIL", "IN_APP"]),
            ReminderRule(name="60-Day Renewal Reminder", days_before=60, notify_roles=["SCRUTINY_OFFICER"], notify_institution=True, channel=["EMAIL", "IN_APP"]),
            ReminderRule(name="30-Day Critical Notice", days_before=30, notify_roles=["SCRUTINY_OFFICER", "SECTION_HEAD"], notify_institution=True, channel=["EMAIL", "IN_APP"]),
            ReminderRule(name="15-Day Urgent Escalation", days_before=15, notify_roles=["SECTION_HEAD"], notify_institution=True, channel=["EMAIL", "IN_APP"]),
            ReminderRule(name="7-Day Final Warning", days_before=7, notify_roles=["SECTION_HEAD", "COMPETENT_AUTHORITY"], notify_institution=True, channel=["EMAIL", "IN_APP"]),
            ReminderRule(name="1-Day Maturity Eve Alert", days_before=1, notify_roles=["COMPETENT_AUTHORITY"], notify_institution=True, channel=["EMAIL", "IN_APP"]),
        ]
        db.add_all(rules)

        print("[COMPLIANCE] Seeding AICTE Compliance Rules...")
        compliance = [
            ComplianceRule(rule_code="COMP-ENGG-DEG", category="Engineering & Tech (Degree)", required_amount=3500000.0, min_validity_years=5, description="AICTE APH Clause 4.1: Security deposit for technical degree colleges"),
            ComplianceRule(rule_code="COMP-MGMT-PGDM", category="Management (MBA/PGDM)", required_amount=2000000.0, min_validity_years=5, description="AICTE APH Clause 4.2: Security deposit for stand-alone management institutes"),
            ComplianceRule(rule_code="COMP-PHARM-DEG", category="Pharmacy (Degree)", required_amount=2500000.0, min_validity_years=5, description="AICTE APH Clause 4.3: Security deposit for pharmacy colleges"),
            ComplianceRule(rule_code="COMP-POLY-DIP", category="Polytechnic (Diploma)", required_amount=1500000.0, min_validity_years=5, description="AICTE APH Clause 4.4: Security deposit for diploma polytechnic institutes"),
        ]
        db.add_all(compliance)

        print("[INSTITUTIONS] Seeding Institutions...")
        institutions = [
            Institution(aicte_id="1-10023456", name="Indian Institute of Technology Delhi (Campus Ext)", state="Delhi", district="New Delhi", contact_email="contact@iitdelhi.ac.in", contact_phone="011-26591000"),
            Institution(aicte_id="1-10045678", name="COEP Technological University", state="Maharashtra", district="Pune", contact_email="dean@coep.ac.in", contact_phone="020-25507000"),
            Institution(aicte_id="1-10098765", name="BMS College of Engineering", state="Karnataka", district="Bengaluru Urban", contact_email="principal@bmsce.ac.in", contact_phone="080-26622130"),
            Institution(aicte_id="1-10065432", name="PSG College of Technology", state="Tamil Nadu", district="Coimbatore", contact_email="info@psgtech.edu", contact_phone="0422-2572177"),
            Institution(aicte_id="1-10077889", name="Harcourt Butler Technical University", state="Uttar Pradesh", district="Kanpur", contact_email="registrar@hbtu.ac.in", contact_phone="0512-2534001"),
        ]
        db.add_all(institutions)
        await db.flush()

        print("[USERS] Seeding Users for all Roles...")
        hashed_password = get_password_hash("Zetsu@2026Pass")
        users = [
            User(email="institution@iitdelhi.ac.in", full_name="IIT Delhi Registrar", password_hash=hashed_password, role=UserRole.INSTITUTION_USER, institution_id=institutions[0].id),
            User(email="institution@coep.ac.in", full_name="COEP Tech Finance Head", password_hash=hashed_password, role=UserRole.INSTITUTION_USER, institution_id=institutions[1].id),
            User(email="scrutiny@aicte-india.org", full_name="Shri Rajesh Sharma (Scrutiny Officer)", password_hash=hashed_password, role=UserRole.SCRUTINY_OFFICER),
            User(email="sectionhead@aicte-india.org", full_name="Dr. Anita Nair (Section Head - Regulation)", password_hash=hashed_password, role=UserRole.SECTION_HEAD),
            User(email="finance@aicte-india.org", full_name="CA Vikram Verma (Finance Officer)", password_hash=hashed_password, role=UserRole.FINANCE_OFFICER),
            User(email="director@aicte-india.org", full_name="Prof. T. G. Sitaram (Competent Authority / Director)", password_hash=hashed_password, role=UserRole.COMPETENT_AUTHORITY),
            User(email="auditor@aicte-india.org", full_name="Shri K. Raman (External Vigilance Auditor)", password_hash=hashed_password, role=UserRole.AUDITOR),
            User(email="admin@aicte-india.org", full_name="Zetsu Portal Super Administrator", password_hash=hashed_password, role=UserRole.ADMIN),
        ]
        db.add_all(users)
        await db.flush()

        print("[INSTRUMENTS] Seeding Instruments covering all lifecycle states...")
        today = date.today()
        officer = users[2]
        sbi = banks[0]
        pnb = banks[1]
        canara = banks[2]

        # 1. ACTIVE & BANK_CONFIRMED instrument
        inst1 = Instrument(
            institution_id=institutions[0].id,
            type="FDR",
            reference_number="FDR-SBI-2024-99881",
            bank_id=sbi.id,
            branch_name="IIT Delhi Hauz Khas Branch",
            amount=3500000.0,
            issue_date=today - timedelta(days=365),
            maturity_date=today + timedelta(days=1460), # 4 years remaining
            lien_marked=True,
            purpose="AICTE Approval Security Deposit - UG Engineering",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add(inst1)
        await db.flush()

        db.add_all([
            FieldTrust(instrument_id=inst1.id, field_name="amount", value_text="3500000.0", trust=TrustLevel.BANK_CONFIRMED, source_ref="CBS-SBI-99881"),
            FieldTrust(instrument_id=inst1.id, field_name="reference_number", value_text="FDR-SBI-2024-99881", trust=TrustLevel.BANK_CONFIRMED, source_ref="CBS-SBI-99881"),
            FieldTrust(instrument_id=inst1.id, field_name="maturity_date", value_text=inst1.maturity_date.isoformat(), trust=TrustLevel.BANK_CONFIRMED, source_ref="CBS-SBI-99881"),
            FieldTrust(instrument_id=inst1.id, field_name="lien_marked", value_text="True", trust=TrustLevel.BANK_CONFIRMED, source_ref="CBS-SBI-99881"),
            StatusHistory(instrument_id=inst1.id, from_status=InstrumentStatus.DRAFT, to_status=InstrumentStatus.SUBMITTED, actor_id=users[0].id, reason="Submitted with FDR scan"),
            StatusHistory(instrument_id=inst1.id, from_status=InstrumentStatus.SUBMITTED, to_status=InstrumentStatus.VERIFIED, actor_id=officer.id, reason="Bank confirmation received via SFMS"),
            StatusHistory(instrument_id=inst1.id, from_status=InstrumentStatus.VERIFIED, to_status=InstrumentStatus.ACTIVE, actor_id=officer.id, reason="Active security pledge accepted"),
        ])

        # 2. EXPIRING instrument (maturing in 42 days)
        inst2 = Instrument(
            institution_id=institutions[1].id,
            type="FDR",
            reference_number="FDR-PNB-2021-77123",
            bank_id=pnb.id,
            branch_name="Shivajinagar Pune",
            amount=2000000.0,
            issue_date=today - timedelta(days=1780),
            maturity_date=today + timedelta(days=42), # 42 days remaining
            lien_marked=True,
            purpose="AICTE Security Deposit - Management Wing",
            status=InstrumentStatus.EXPIRING,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[1].id,
            assigned_to=officer.id,
        )
        db.add(inst2)
        await db.flush()

        db.add_all([
            FieldTrust(instrument_id=inst2.id, field_name="amount", value_text="2000000.0", trust=TrustLevel.OFFICER_VERIFIED, source_ref=officer.id),
            FieldTrust(instrument_id=inst2.id, field_name="reference_number", value_text="FDR-PNB-2021-77123", trust=TrustLevel.OFFICER_VERIFIED, source_ref=officer.id),
            StatusHistory(instrument_id=inst2.id, from_status=InstrumentStatus.ACTIVE, to_status=InstrumentStatus.EXPIRING, actor_id=None, reason="Entered 60-day renewal advisory window"),
        ])

        # 3. OVERDUE instrument (matured 15 days ago without renewal)
        inst3 = Instrument(
            institution_id=institutions[2].id,
            type="FDR",
            reference_number="FDR-CNRB-2019-33445",
            bank_id=canara.id,
            branch_name="Basavanagudi Bengaluru",
            amount=1500000.0,
            issue_date=today - timedelta(days=1840),
            maturity_date=today - timedelta(days=15), # Overdue!
            lien_marked=True,
            purpose="AICTE Security Deposit - Polytechnic Wing",
            status=InstrumentStatus.OVERDUE,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add(inst3)
        await db.flush()

        db.add_all([
            StatusHistory(instrument_id=inst3.id, from_status=InstrumentStatus.EXPIRING, to_status=InstrumentStatus.OVERDUE, actor_id=None, reason="Maturity date passed with no renewal submitted"),
            Discrepancy(instrument_id=inst3.id, rule_code="VALIDITY_TOO_SHORT", severity=DiscrepancySeverity.HIGH, message="Instrument has reached and exceeded maturity without renewal receipt.", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
        ])

        # 4. DISCREPANCY_FLAGGED instrument (wrong amount & bank mismatch sample)
        inst4 = Instrument(
            institution_id=institutions[3].id,
            type="FDR",
            reference_number="FDR-MISMATCH-44556",
            bank_id=sbi.id,
            branch_name="Peelamedu Coimbatore",
            amount=800000.0, # Below regulatory minimum
            issue_date=today - timedelta(days=30),
            maturity_date=today + timedelta(days=700), # Less than 3 years
            lien_marked=False, # Lien missing
            purpose="AICTE New Institution Application Security",
            status=InstrumentStatus.DISCREPANCY_FLAGGED,
            overall_trust=TrustLevel.SUBMITTED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add(inst4)
        await db.flush()

        db.add_all([
            Discrepancy(instrument_id=inst4.id, rule_code="AMOUNT_BELOW_REQUIRED", severity=DiscrepancySeverity.HIGH, message="Deposited amount (₹ 8,00,000.00) is below minimum regulatory requirement (₹ 10,00,000.00).", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Discrepancy(instrument_id=inst4.id, rule_code="LIEN_NOT_MARKED", severity=DiscrepancySeverity.HIGH, message="Lien in favour of AICTE is not marked on this FDR instrument.", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Discrepancy(instrument_id=inst4.id, rule_code="VALIDITY_TOO_SHORT", severity=DiscrepancySeverity.MEDIUM, message="Validity duration (1.9 years) is less than the AICTE mandated 3-year minimum.", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Observation(instrument_id=inst4.id, author_id=officer.id, text="Institution must rectify the lien endorsement and top-up the security amount to meet Section 4 norms.", visible_to_institution=True),
        ])

        # 5. RELEASE_REQUESTED instrument with approval steps
        inst5 = Instrument(
            institution_id=institutions[4].id,
            type="FDR",
            reference_number="FDR-HDFC-2019-11223",
            bank_id=banks[4].id,
            branch_name="Civil Lines Kanpur",
            amount=2500000.0,
            issue_date=today - timedelta(days=1825),
            maturity_date=today - timedelta(days=2), # Matured
            lien_marked=True,
            purpose="AICTE Pharmacy Approval Security Deposit",
            status=InstrumentStatus.RELEASE_UNDER_REVIEW,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add(inst5)
        await db.flush()

        rel_req = ReleaseRequest(
            instrument_id=inst5.id,
            request_type="RELEASE",
            reason="Institution has completed 5 continuous years of unblemished regulatory compliance. Formal discharge requested.",
            requested_by=users[0].id,
            status="UNDER_REVIEW",
            checklist_json={
                "is_eligible": True,
                "trust_verified": {"passed": True, "current_trust": "BANK_CONFIRMED"},
                "no_high_discrepancies": {"passed": True, "open_count": 0},
                "lifecycle_status_eligible": {"passed": True, "current_status": "MATURED"}
            }
        )
        db.add(rel_req)
        await db.flush()

        step1 = ApprovalStep(release_id=rel_req.id, step_order=1, required_role=UserRole.SCRUTINY_OFFICER, actor_id=officer.id, decision="APPROVED", note="Verified original physical FDR receipt and clean regulatory record.", acted_at=datetime.now(timezone.utc))
        step2 = ApprovalStep(release_id=rel_req.id, step_order=2, required_role=UserRole.FINANCE_OFFICER, decision="PENDING")
        step3 = ApprovalStep(release_id=rel_req.id, step_order=3, required_role=UserRole.COMPETENT_AUTHORITY, decision="PENDING")
        db.add_all([step1, step2, step3])

        print("[AUDIT] Initializing Tamper-Evident Audit Trail...")
        await create_audit_log(
            db=db,
            action="SYSTEM_INIT_SEED",
            entity_type="SYSTEM",
            entity_id="ROOT",
            actor_role="ADMIN",
            after_json={"message": "Zetsu AICTE FDR Portal system genesis and master seed completed."},
        )

        await db.commit()
        print("[SUCCESS] Database successfully seeded with synthetic institutions, instruments, users, and audit trail!")


if __name__ == "__main__":
    asyncio.run(seed_data())
