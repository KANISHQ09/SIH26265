from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import VerificationMethod, VerificationResult


class BankVerificationTriggerRequest(BaseModel):
    simulate_scenario: Optional[str] = None # None (auto), "MATCH", "MISMATCH", "NOT_FOUND", "TIMEOUT"


class OfficerVerificationFieldConfirm(BaseModel):
    field_name: str
    confirmed_value: str
    matches_document: bool
    notes: Optional[str] = None


class OfficerVerificationSubmit(BaseModel):
    fields: list[OfficerVerificationFieldConfirm]
    overall_observation: Optional[str] = None


class VerificationResponse(BaseModel):
    id: str
    instrument_id: str
    method: VerificationMethod
    result: VerificationResult
    request_payload: Optional[Any] = None
    response_payload: Optional[Any] = None
    performed_by: Optional[str] = None
    performed_at: datetime

    class Config:
        from_attributes = True
