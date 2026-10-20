import uuid
from datetime import datetime, date, timezone
from typing import Optional, List, Any
from sqlalchemy import (
    String, Boolean, Integer, Float, DateTime, Date, ForeignKey, 
    Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.models.enums import (
    UserRole, InstrumentStatus, TrustLevel, DocumentType, 
    DiscrepancySeverity, DiscrepancyStatus, VerificationMethod, 
    VerificationResult
)


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    aicte_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    users: Mapped[List["User"]] = relationship("User", back_populates="institution")
    instruments: Mapped[List["Instrument"]] = relationship("Instrument", back_populates="institution")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    institution_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("institutions.id"), nullable=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    failed_logins: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    institution: Mapped[Optional["Institution"]] = relationship("Institution", back_populates="users")


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    ifsc_prefix: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    verification_supported: Mapped[bool] = mapped_column(Boolean, default=True)

    instruments: Mapped[List["Instrument"]] = relationship("Instrument", back_populates="bank")


class Instrument(Base):
    __tablename__ = "instruments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    institution_id: Mapped[str] = mapped_column(String(36), ForeignKey("institutions.id"), nullable=False, index=True)
    parent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(30), default="FDR", nullable=False)
    reference_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    bank_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("banks.id"), nullable=True)
    branch_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    maturity_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    lien_marked: Mapped[bool] = mapped_column(Boolean, default=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[InstrumentStatus] = mapped_column(SAEnum(InstrumentStatus), default=InstrumentStatus.DRAFT, index=True, nullable=False)
    overall_trust: Mapped[TrustLevel] = mapped_column(SAEnum(TrustLevel), default=TrustLevel.SUBMITTED, nullable=False)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1) # optimistic locking
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    institution: Mapped["Institution"] = relationship("Institution", back_populates="instruments")
    bank: Mapped[Optional["Bank"]] = relationship("Bank", back_populates="instruments")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="instrument", cascade="all, delete-orphan")
    field_trusts: Mapped[List["FieldTrust"]] = relationship("FieldTrust", back_populates="instrument", cascade="all, delete-orphan")
    verifications: Mapped[List["Verification"]] = relationship("Verification", back_populates="instrument", cascade="all, delete-orphan")
    discrepancies: Mapped[List["Discrepancy"]] = relationship("Discrepancy", back_populates="instrument", cascade="all, delete-orphan")
    observations: Mapped[List["Observation"]] = relationship("Observation", back_populates="instrument", cascade="all, delete-orphan")
    status_history: Mapped[List["StatusHistory"]] = relationship("StatusHistory", back_populates="instrument", cascade="all, delete-orphan")
    release_requests: Mapped[List["ReleaseRequest"]] = relationship("ReleaseRequest", back_populates="instrument")
    reminders: Mapped[List["Reminder"]] = relationship("Reminder", back_populates="instrument", cascade="all, delete-orphan")
    escalations: Mapped[List["Escalation"]] = relationship("Escalation", back_populates="instrument", cascade="all, delete-orphan")


class FieldTrust(Base):
    __tablename__ = "field_trust"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(50), nullable=False)
    value_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trust: Mapped[TrustLevel] = mapped_column(SAEnum(TrustLevel), nullable=False)
    source_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="field_trusts")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    doc_type: Mapped[DocumentType] = mapped_column(SAEnum(DocumentType), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    version_no: Mapped[int] = mapped_column(Integer, default=1)
    ocr_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="documents")


class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    method: Mapped[VerificationMethod] = mapped_column(SAEnum(VerificationMethod), nullable=False)
    result: Mapped[VerificationResult] = mapped_column(SAEnum(VerificationResult), nullable=False)
    request_payload: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    performed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="verifications")


class Discrepancy(Base):
    __tablename__ = "discrepancies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    rule_code: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[DiscrepancySeverity] = mapped_column(SAEnum(DiscrepancySeverity), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    detected_by: Mapped[str] = mapped_column(String(20), default="SYSTEM")
    status: Mapped[DiscrepancyStatus] = mapped_column(SAEnum(DiscrepancyStatus), default=DiscrepancyStatus.OPEN, nullable=False)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="discrepancies")


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    visible_to_institution: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="observations")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    from_status: Mapped[Optional[InstrumentStatus]] = mapped_column(SAEnum(InstrumentStatus), nullable=True)
    to_status: Mapped[InstrumentStatus] = mapped_column(SAEnum(InstrumentStatus), nullable=False)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="status_history")


class ReleaseRequest(Base):
    __tablename__ = "release_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    request_type: Mapped[str] = mapped_column(String(30), default="RELEASE", nullable=False) # RELEASE, REFUND, DISCHARGE
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    requested_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", nullable=False)
    checklist_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    decided_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    decision_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="release_requests")
    approval_steps: Mapped[List["ApprovalStep"]] = relationship("ApprovalStep", back_populates="release_request", cascade="all, delete-orphan")


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    release_id: Mapped[str] = mapped_column(String(36), ForeignKey("release_requests.id"), nullable=False, index=True)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    required_role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    decision: Mapped[str] = mapped_column(String(20), default="PENDING") # PENDING, APPROVED, REJECTED
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    acted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    release_request: Mapped["ReleaseRequest"] = relationship("ReleaseRequest", back_populates="approval_steps")


class ReminderRule(Base):
    __tablename__ = "reminder_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    days_before: Mapped[int] = mapped_column(Integer, nullable=False)
    notify_roles: Mapped[Any] = mapped_column(JSON, nullable=False) # e.g. ["SCRUTINY_OFFICER", "SECTION_HEAD"]
    notify_institution: Mapped[bool] = mapped_column(Boolean, default=True)
    channel: Mapped[Any] = mapped_column(JSON, default=lambda: ["EMAIL", "IN_APP"])
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    rule_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("reminder_rules.id"), nullable=True)
    due_on: Mapped[date] = mapped_column(Date, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="reminders")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    instrument_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=True)
    channel: Mapped[str] = mapped_column(String(20), default="IN_APP")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING") # PENDING, SENT, READ
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    instrument_id: Mapped[str] = mapped_column(String(36), ForeignKey("instruments.id"), nullable=False, index=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False) # 1, 2, 3
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    raised_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    instrument: Mapped["Instrument"] = relationship("Instrument", back_populates="escalations")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    actor_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    before_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    after_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prev_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    row_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    rule_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "ENGINEERING_DEGREE", "MANAGEMENT_PGDM"
    required_amount: Mapped[float] = mapped_column(Float, nullable=False)
    min_validity_years: Mapped[int] = mapped_column(Integer, default=5)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
