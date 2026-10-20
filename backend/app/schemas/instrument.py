from typing import Optional, List, Any
from datetime import date, datetime
from pydantic import BaseModel, Field
from app.models.enums import InstrumentStatus, TrustLevel


class FieldTrustResponse(BaseModel):
    id: str
    field_name: str
    value_text: Optional[str] = None
    trust: TrustLevel
    source_ref: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class InstrumentBase(BaseModel):
    type: str = "FDR"
    reference_number: str
    bank_id: Optional[str] = None
    branch_name: Optional[str] = None
    amount: float = Field(..., gt=0, description="Amount in INR")
    issue_date: date
    maturity_date: date
    lien_marked: bool = True
    purpose: Optional[str] = None


class InstrumentCreate(InstrumentBase):
    institution_id: Optional[str] = None # Inferred from current user if institution role


class InstrumentUpdate(BaseModel):
    reference_number: Optional[str] = None
    bank_id: Optional[str] = None
    branch_name: Optional[str] = None
    amount: Optional[float] = None
    issue_date: Optional[date] = None
    maturity_date: Optional[date] = None
    lien_marked: Optional[bool] = None
    purpose: Optional[str] = None


class StatusTransitionRequest(BaseModel):
    to_status: InstrumentStatus
    reason: Optional[str] = None


class RenewalRequest(BaseModel):
    reference_number: str
    bank_id: Optional[str] = None
    branch_name: Optional[str] = None
    amount: float
    issue_date: date
    maturity_date: date
    lien_marked: bool = True
    purpose: Optional[str] = "RENEWAL"


class ObservationCreate(BaseModel):
    text: str
    visible_to_institution: bool = False


class ObservationResponse(BaseModel):
    id: str
    instrument_id: str
    author_id: str
    text: str
    visible_to_institution: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StatusHistoryResponse(BaseModel):
    id: int
    from_status: Optional[InstrumentStatus] = None
    to_status: InstrumentStatus
    actor_id: Optional[str] = None
    reason: Optional[str] = None
    at: datetime

    class Config:
        from_attributes = True


class BankResponse(BaseModel):
    id: str
    name: str
    ifsc_prefix: Optional[str] = None
    verification_supported: bool

    class Config:
        from_attributes = True


class InstitutionBriefResponse(BaseModel):
    id: str
    aicte_id: str
    name: str
    state: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True


class InstrumentResponse(InstrumentBase):
    id: str
    institution_id: str
    parent_id: Optional[str] = None
    status: InstrumentStatus
    overall_trust: TrustLevel
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    institution: Optional[InstitutionBriefResponse] = None
    bank: Optional[BankResponse] = None
    field_trusts: List[FieldTrustResponse] = []
    observations: List[ObservationResponse] = []

    class Config:
        from_attributes = True


class InstrumentDetailResponse(InstrumentResponse):
    status_history: List[StatusHistoryResponse] = []
