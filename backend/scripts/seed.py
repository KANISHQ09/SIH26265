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


async def seed_data(reset: bool = True):
    sys.stdout.reconfigure(encoding='utf-8')
    print("[INIT] Initializing database schema...")
    
    if reset:
        print("[RESET] Dropping all existing tables for clean seed...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    else:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
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
            Institution(aicte_id="1-10055210", name="BITS Pilani (K.K. Birla Goa Campus)", state="Goa", district="South Goa", contact_email="admin@goa.bits-pilani.ac.in", contact_phone="0832-2580100"),
            Institution(aicte_id="1-10033119", name="Delhi Technological University", state="Delhi", district="North West Delhi", contact_email="registrar@dtu.ac.in", contact_phone="011-27871018"),
        ]
        db.add_all(institutions)
        await db.flush()

        print("[USERS] Seeding Users for all Roles...")
        hashed_password = get_password_hash("Zetsu@2026Pass")
        users = [
            User(email="institution@iitdelhi.ac.in", full_name="IIT Delhi Registrar Office", password_hash=hashed_password, role=UserRole.INSTITUTION_USER, institution_id=institutions[0].id),
            User(email="institution@coep.ac.in", full_name="COEP Tech Finance Head", password_hash=hashed_password, role=UserRole.INSTITUTION_USER, institution_id=institutions[1].id),
            User(email="institution@bmsce.ac.in", full_name="BMSCE Accounts Desk", password_hash=hashed_password, role=UserRole.INSTITUTION_USER, institution_id=institutions[2].id),
            User(email="scrutiny@aicte-india.org", full_name="Shri Rajesh Sharma (Scrutiny Officer)", password_hash=hashed_password, role=UserRole.SCRUTINY_OFFICER),
            User(email="sectionhead@aicte-india.org", full_name="Dr. Anita Nair (Section Head - Regulation)", password_hash=hashed_password, role=UserRole.SECTION_HEAD),
            User(email="finance@aicte-india.org", full_name="CA Vikram Verma (Finance Officer)", password_hash=hashed_password, role=UserRole.FINANCE_OFFICER),
            User(email="director@aicte-india.org", full_name="Prof. T. G. Sitaram (Competent Authority / Director)", password_hash=hashed_password, role=UserRole.COMPETENT_AUTHORITY),
            User(email="auditor@aicte-india.org", full_name="Shri K. Raman (External Vigilance Auditor)", password_hash=hashed_password, role=UserRole.AUDITOR),
            User(email="admin@aicte-india.org", full_name="Zetsu Portal Super Administrator", password_hash=hashed_password, role=UserRole.ADMIN),
        ]
        db.add_all(users)
        await db.flush()

        today = date.today()
        officer = users[3]
        sec_head = users[4]
        fin_officer = users[5]
        director = users[6]

        sbi, pnb, canara, bob, hdfc, icici, gramin = banks

        print("[INSTRUMENTS] Seeding 20+ diverse, role-tailored instruments...")

        # -------------------------------------------------------------
        # 1. IIT DELHI (Institution User #1) - 3 Instruments
        # -------------------------------------------------------------
        # 1.1 Active & Bank Confirmed
        i1 = Instrument(
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
        # 1.2 Under Scrutiny (Desk Review)
        i2 = Instrument(
            institution_id=institutions[0].id,
            type="FDR",
            reference_number="FDR-SBI-2025-44211",
            bank_id=sbi.id,
            branch_name="SBI Hauz Khas Branch",
            amount=3500000.0,
            issue_date=today - timedelta(days=15),
            maturity_date=today + timedelta(days=1810),
            lien_marked=True,
            purpose="PG Technical Program Expansion Deposit",
            status=InstrumentStatus.UNDER_SCRUTINY,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        # 1.3 Expiring Soon (42 days left)
        i3 = Instrument(
            institution_id=institutions[0].id,
            type="FDR",
            reference_number="FDR-PNB-2021-77123",
            bank_id=pnb.id,
            branch_name="PNB Green Park, New Delhi",
            amount=2000000.0,
            issue_date=today - timedelta(days=1780),
            maturity_date=today + timedelta(days=42),
            lien_marked=True,
            purpose="Management Studies Security Deposit",
            status=InstrumentStatus.EXPIRING,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add_all([i1, i2, i3])
        await db.flush()

        db.add_all([
            FieldTrust(instrument_id=i1.id, field_name="amount", value_text="3500000.0", trust=TrustLevel.BANK_CONFIRMED, source_ref="CBS-SBI-99881"),
            FieldTrust(instrument_id=i1.id, field_name="lien_marked", value_text="True", trust=TrustLevel.BANK_CONFIRMED, source_ref="CBS-SBI-99881"),
            Observation(instrument_id=i1.id, author_id=officer.id, text="Verified directly against SBI CBS gateway via SFMS. Perfect match.", visible_to_institution=True),
            StatusHistory(instrument_id=i1.id, from_status=InstrumentStatus.DRAFT, to_status=InstrumentStatus.SUBMITTED, actor_id=users[0].id),
            StatusHistory(instrument_id=i1.id, from_status=InstrumentStatus.SUBMITTED, to_status=InstrumentStatus.ACTIVE, actor_id=officer.id, reason="Bank confirmation received"),
            Observation(instrument_id=i2.id, author_id=officer.id, text="OCR parsed successfully. Awaiting branch manager SFMS endorsement callback.", visible_to_institution=True),
            StatusHistory(instrument_id=i3.id, from_status=InstrumentStatus.ACTIVE, to_status=InstrumentStatus.EXPIRING, reason="Automated 60-day renewal window entered"),
        ])

        # -------------------------------------------------------------
        # 2. COEP PUNE (Institution User #2) - 3 Instruments
        # -------------------------------------------------------------
        # 2.1 Active
        i4 = Instrument(
            institution_id=institutions[1].id,
            type="FDR",
            reference_number="FDR-BOB-2023-88121",
            bank_id=bob.id,
            branch_name="Bank of Baroda, FC Road Pune",
            amount=3500000.0,
            issue_date=today - timedelta(days=400),
            maturity_date=today + timedelta(days=1425),
            lien_marked=True,
            purpose="Autonomous Engineering Faculty Endowment",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[1].id,
            assigned_to=officer.id,
        )
        # 2.2 Release Under Review (Stage 2: Pending Finance Officer Sign-off)
        i5 = Instrument(
            institution_id=institutions[1].id,
            type="FDR",
            reference_number="FDR-CNRB-2019-22341",
            bank_id=canara.id,
            branch_name="Canara Bank, Shivajinagar Pune",
            amount=2500000.0,
            issue_date=today - timedelta(days=1830),
            maturity_date=today - timedelta(days=5), # Matured
            lien_marked=True,
            purpose="Pharmacy College Approval Security Deposit",
            status=InstrumentStatus.RELEASE_UNDER_REVIEW,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[1].id,
            assigned_to=fin_officer.id,
        )
        # 2.3 Draft
        i6 = Instrument(
            institution_id=institutions[1].id,
            type="FDR",
            reference_number="FDR-SBI-2026-00122",
            bank_id=sbi.id,
            branch_name="SBI COEP Campus Branch",
            amount=1500000.0,
            issue_date=today,
            maturity_date=today + timedelta(days=1825),
            lien_marked=True,
            purpose="Polytechnic Diploma Program Additional Division",
            status=InstrumentStatus.DRAFT,
            overall_trust=TrustLevel.SUBMITTED,
            created_by=users[1].id,
        )
        db.add_all([i4, i5, i6])
        await db.flush()

        # Add Stage 2 Release for COEP (Targeted for Finance Officer!)
        rel_coep = ReleaseRequest(
            instrument_id=i5.id,
            request_type="RELEASE",
            reason="5-year regulatory compliance period fulfilled. Requesting formal release of security deposit and lien clearance certificate.",
            requested_by=users[1].id,
            status="UNDER_REVIEW",
            checklist_json={
                "is_eligible": True,
                "trust_verified": {"passed": True, "current_trust": "BANK_CONFIRMED"},
                "no_high_discrepancies": {"passed": True, "open_count": 0},
                "lifecycle_status_eligible": {"passed": True, "current_status": "MATURED"}
            }
        )
        db.add(rel_coep)
        await db.flush()
        db.add_all([
            ApprovalStep(release_id=rel_coep.id, step_order=1, required_role=UserRole.SCRUTINY_OFFICER, actor_id=officer.id, decision="APPROVED", note="Scrutiny verified original deposit certificate and college compliance NOC.", acted_at=datetime.now(timezone.utc) - timedelta(days=2)),
            ApprovalStep(release_id=rel_coep.id, step_order=2, required_role=UserRole.FINANCE_OFFICER, decision="PENDING"),
            ApprovalStep(release_id=rel_coep.id, step_order=3, required_role=UserRole.COMPETENT_AUTHORITY, decision="PENDING"),
        ])

        # -------------------------------------------------------------
        # 3. BMS COLLEGE BENGALURU (Institution User #3) - 3 Instruments
        # -------------------------------------------------------------
        # 3.1 Overdue by 15 days (Targeted for Section Head Escalation!)
        i7 = Instrument(
            institution_id=institutions[2].id,
            type="FDR",
            reference_number="FDR-CNRB-2019-33445",
            bank_id=canara.id,
            branch_name="Canara Bank, Basavanagudi Bengaluru",
            amount=1500000.0,
            issue_date=today - timedelta(days=1840),
            maturity_date=today - timedelta(days=15), # Overdue!
            lien_marked=True,
            purpose="AICTE Security Deposit - Polytechnic Wing",
            status=InstrumentStatus.OVERDUE,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[2].id,
            assigned_to=sec_head.id,
        )
        # 3.2 Expiring in 12 days (Urgent Renewal Window)
        i8 = Instrument(
            institution_id=institutions[2].id,
            type="FDR",
            reference_number="FDR-PNB-2020-55112",
            bank_id=pnb.id,
            branch_name="PNB Gandhi Nagar Bengaluru",
            amount=2000000.0,
            issue_date=today - timedelta(days=1813),
            maturity_date=today + timedelta(days=12),
            lien_marked=True,
            purpose="MBA Department Mandatory Security",
            status=InstrumentStatus.EXPIRING,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[2].id,
            assigned_to=sec_head.id,
        )
        # 3.3 Active
        i9 = Instrument(
            institution_id=institutions[2].id,
            type="FDR",
            reference_number="FDR-ICIC-2023-77291",
            bank_id=icici.id,
            branch_name="ICICI Bank Jayanagar Bengaluru",
            amount=3500000.0,
            issue_date=today - timedelta(days=500),
            maturity_date=today + timedelta(days=1325),
            lien_marked=True,
            purpose="UG Engineering New Course Sanction",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[2].id,
            assigned_to=officer.id,
        )
        db.add_all([i7, i8, i9])
        await db.flush()

        db.add_all([
            Discrepancy(instrument_id=i7.id, rule_code="VALIDITY_TOO_SHORT", severity=DiscrepancySeverity.HIGH, message="Maturity date elapsed 15 days ago with no renewal receipt or replacement FDR.", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Observation(instrument_id=i7.id, author_id=sec_head.id, text="Show-cause notice served to institution management regarding non-renewal of mandatory endowment.", visible_to_institution=True),
            StatusHistory(instrument_id=i7.id, from_status=InstrumentStatus.EXPIRING, to_status=InstrumentStatus.OVERDUE, reason="Lapsed past maturity without renewal"),
        ])

        # -------------------------------------------------------------
        # 4. PSG COLLEGE OF TECHNOLOGY (Coimbatore) - 3 Instruments
        # -------------------------------------------------------------
        # 4.1 Discrepancy Flagged (Amount too low + Lien missing)
        i10 = Instrument(
            institution_id=institutions[3].id,
            type="FDR",
            reference_number="FDR-MISMATCH-44556",
            bank_id=sbi.id,
            branch_name="Peelamedu Coimbatore",
            amount=800000.0, # Below regulatory minimum 10L
            issue_date=today - timedelta(days=30),
            maturity_date=today + timedelta(days=700),
            lien_marked=False, # Missing lien
            purpose="AICTE New Institution Application Security",
            status=InstrumentStatus.DISCREPANCY_FLAGGED,
            overall_trust=TrustLevel.SUBMITTED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        # 4.2 Submitted (Fresh intake awaiting scrutiny officer)
        i11 = Instrument(
            institution_id=institutions[3].id,
            type="FDR",
            reference_number="FDR-PSG-2026-11002",
            bank_id=canara.id,
            branch_name="Canara Bank Peelamedu Coimbatore",
            amount=3500000.0,
            issue_date=today - timedelta(days=2),
            maturity_date=today + timedelta(days=1823),
            lien_marked=True,
            purpose="Mechatronics Department Security Deposit",
            status=InstrumentStatus.SUBMITTED,
            overall_trust=TrustLevel.SUBMITTED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        # 4.3 Active
        i12 = Instrument(
            institution_id=institutions[3].id,
            type="FDR",
            reference_number="FDR-HDFC-2022-99011",
            bank_id=hdfc.id,
            branch_name="HDFC Bank Avinashi Road Coimbatore",
            amount=2500000.0,
            issue_date=today - timedelta(days=750),
            maturity_date=today + timedelta(days=1075),
            lien_marked=True,
            purpose="MCA Post Graduate Program Security",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add_all([i10, i11, i12])
        await db.flush()

        db.add_all([
            Discrepancy(instrument_id=i10.id, rule_code="AMOUNT_BELOW_REQUIRED", severity=DiscrepancySeverity.HIGH, message="Deposited amount (₹ 8,00,000.00) is below minimum regulatory requirement (₹ 10,00,000.00).", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Discrepancy(instrument_id=i10.id, rule_code="LIEN_NOT_MARKED", severity=DiscrepancySeverity.HIGH, message="Lien in favour of AICTE is not marked on this FDR instrument.", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Observation(instrument_id=i10.id, author_id=officer.id, text="Institution must rectify the lien endorsement and top-up the security amount.", visible_to_institution=True),
        ])

        # -------------------------------------------------------------
        # 5. HBTU KANPUR - 3 Instruments
        # -------------------------------------------------------------
        # 5.1 Release Under Review (Stage 3: Pending Competent Authority / Director Sign-off!)
        i13 = Instrument(
            institution_id=institutions[4].id,
            type="FDR",
            reference_number="FDR-HBTU-2019-77119",
            bank_id=pnb.id,
            branch_name="PNB Mall Road Kanpur",
            amount=3500000.0,
            issue_date=today - timedelta(days=1830),
            maturity_date=today - timedelta(days=2),
            lien_marked=True,
            purpose="AICTE Engineering Campus Security Deposit",
            status=InstrumentStatus.RELEASE_UNDER_REVIEW,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=director.id,
        )
        # 5.2 Active
        i14 = Instrument(
            institution_id=institutions[4].id,
            type="FDR",
            reference_number="FDR-SBI-2023-33441",
            bank_id=sbi.id,
            branch_name="SBI HBTU Campus Kanpur",
            amount=3500000.0,
            issue_date=today - timedelta(days=360),
            maturity_date=today + timedelta(days=1465),
            lien_marked=True,
            purpose="Chemical Technology Department Guarantee",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        # 5.3 Renewed Historical Parent
        i15 = Instrument(
            institution_id=institutions[4].id,
            type="FDR",
            reference_number="FDR-PNB-2014-00192",
            bank_id=pnb.id,
            branch_name="PNB Mall Road Kanpur",
            amount=3500000.0,
            issue_date=today - timedelta(days=3650),
            maturity_date=today - timedelta(days=1825),
            lien_marked=True,
            purpose="Initial Engineering Approval 2014",
            status=InstrumentStatus.RENEWED,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[0].id,
        )
        db.add_all([i13, i14, i15])
        await db.flush()

        # Add Stage 3 Release for HBTU (Targeted for Competent Authority!)
        rel_hbtu = ReleaseRequest(
            instrument_id=i13.id,
            request_type="RELEASE",
            reason="10-year flawless statutory compliance reached. Formal AICTE council release and discharge sanction requested.",
            requested_by=users[0].id,
            status="UNDER_REVIEW",
            checklist_json={
                "is_eligible": True,
                "trust_verified": {"passed": True, "current_trust": "BANK_CONFIRMED"},
                "no_high_discrepancies": {"passed": True, "open_count": 0},
                "lifecycle_status_eligible": {"passed": True, "current_status": "MATURED"}
            }
        )
        db.add(rel_hbtu)
        await db.flush()
        db.add_all([
            ApprovalStep(release_id=rel_hbtu.id, step_order=1, required_role=UserRole.SCRUTINY_OFFICER, actor_id=officer.id, decision="APPROVED", note="Stage 1 Scrutiny desk verified original certificate.", acted_at=datetime.now(timezone.utc) - timedelta(days=5)),
            ApprovalStep(release_id=rel_hbtu.id, step_order=2, required_role=UserRole.FINANCE_OFFICER, actor_id=fin_officer.id, decision="APPROVED", note="Stage 2 Finance cleared unencumbered interest payment and bank details.", acted_at=datetime.now(timezone.utc) - timedelta(days=1)),
            ApprovalStep(release_id=rel_hbtu.id, step_order=3, required_role=UserRole.COMPETENT_AUTHORITY, decision="PENDING"),
        ])

        # -------------------------------------------------------------
        # 6. BITS PILANI GOA - 2 Instruments
        # -------------------------------------------------------------
        # 6.1 Released / Discharged
        i16 = Instrument(
            institution_id=institutions[5].id,
            type="FDR",
            reference_number="FDR-BITS-2018-90112",
            bank_id=icici.id,
            branch_name="ICICI Bank, Zuarinagar Goa",
            amount=3500000.0,
            issue_date=today - timedelta(days=2200),
            maturity_date=today - timedelta(days=375),
            lien_marked=True,
            purpose="BITS Goa Campus Phase 1 Endowment",
            status=InstrumentStatus.RELEASED,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
        )
        # 6.2 Active
        i17 = Instrument(
            institution_id=institutions[5].id,
            type="FDR",
            reference_number="FDR-SBI-2023-99110",
            bank_id=sbi.id,
            branch_name="SBI Vasco da Gama Goa",
            amount=5000000.0,
            issue_date=today - timedelta(days=400),
            maturity_date=today + timedelta(days=1425),
            lien_marked=True,
            purpose="Autonomous University Research Cluster Security",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add_all([i16, i17])
        await db.flush()

        # -------------------------------------------------------------
        # 7. DTU DELHI - 3 Instruments
        # -------------------------------------------------------------
        # 7.1 Active
        i18 = Instrument(
            institution_id=institutions[6].id,
            type="FDR",
            reference_number="FDR-SBI-2024-55443",
            bank_id=sbi.id,
            branch_name="SBI Bawana Delhi",
            amount=3500000.0,
            issue_date=today - timedelta(days=180),
            maturity_date=today + timedelta(days=1645),
            lien_marked=True,
            purpose="DTU East Campus Artificial Intelligence Wing",
            status=InstrumentStatus.ACTIVE,
            overall_trust=TrustLevel.BANK_CONFIRMED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        # 7.2 Discrepancy Flagged (IFSC Branch Mismatch)
        i19 = Instrument(
            institution_id=institutions[6].id,
            type="FDR",
            reference_number="FDR-DTU-2025-99012",
            bank_id=pnb.id,
            branch_name="PNB Rohini Sector 16 Delhi",
            amount=2000000.0,
            issue_date=today - timedelta(days=20),
            maturity_date=today + timedelta(days=1805),
            lien_marked=True,
            purpose="Executive MBA Security Deposit",
            status=InstrumentStatus.DISCREPANCY_FLAGGED,
            overall_trust=TrustLevel.SUBMITTED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        # 7.3 Expiring in 70 Days
        i20 = Instrument(
            institution_id=institutions[6].id,
            type="FDR",
            reference_number="FDR-BOB-2021-33128",
            bank_id=bob.id,
            branch_name="Bank of Baroda Rohini Delhi",
            amount=2000000.0,
            issue_date=today - timedelta(days=1755),
            maturity_date=today + timedelta(days=70),
            lien_marked=True,
            purpose="Polytechnic Additional Shift Deposit",
            status=InstrumentStatus.EXPIRING,
            overall_trust=TrustLevel.OFFICER_VERIFIED,
            created_by=users[0].id,
            assigned_to=officer.id,
        )
        db.add_all([i18, i19, i20])
        await db.flush()

        db.add_all([
            Discrepancy(instrument_id=i19.id, rule_code="IFSC_BRANCH_MISMATCH", severity=DiscrepancySeverity.MEDIUM, message="Provided IFSC code PUNB0123400 resolves to New Friends Colony branch, differing from stated Rohini Sector 16 branch.", detected_by="SYSTEM", status=DiscrepancyStatus.OPEN),
            Observation(instrument_id=i19.id, author_id=officer.id, text="Requested branch code verification certificate from PNB nodal officer.", visible_to_institution=True),
        ])

        print("[AUDIT] Initializing Tamper-Evident Audit Trail...")
        await create_audit_log(
            db=db,
            action="SYSTEM_INIT_SEED",
            entity_type="SYSTEM",
            entity_id="ROOT",
            actor_role="ADMIN",
            after_json={"message": "Zetsu AICTE FDR Portal system genesis with 20 role-tailored instruments completed."},
        )

        await db.commit()
        print("[SUCCESS] Database successfully seeded with 20 realistic, role-tailored instruments and multi-stage release workflows!")


if __name__ == "__main__":
    asyncio.run(seed_data(reset=True))
