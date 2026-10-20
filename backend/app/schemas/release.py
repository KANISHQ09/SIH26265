from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import UserRole


class ReleaseRequestCreate(BaseModel):
    request_type: str = "RELEASE" # RELEASE, REFUND, DISCHARGE
    reason: str


class ApprovalStepResponse(BaseModel):
    id: str
    release_id: str
    step_order: int
    required_role: UserRole
    actor_id: Optional[str] = None
    decision: str
    note: Optional[str] = None
    acted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApprovalActionRequest(BaseModel):
    decision: str # APPROVED or REJECTED
    note: str


class ReleaseRequestResponse(BaseModel):
    id: str
    instrument_id: str
    request_type: str
    reason: str
    requested_by: str
    status: str
    checklist_json: Optional[Any] = None
    decided_by: Optional[str] = None
    decision_note: Optional[str] = None
    created_at: datetime
    decided_at: Optional[datetime] = None
    approval_steps: List[ApprovalStepResponse] = []

    class Config:
        from_attributes = True
