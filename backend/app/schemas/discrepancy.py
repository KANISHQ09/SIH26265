from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.enums import DiscrepancySeverity, DiscrepancyStatus


class DiscrepancyCreate(BaseModel):
    rule_code: str
    severity: DiscrepancySeverity
    message: str


class DiscrepancyResolveRequest(BaseModel):
    status: DiscrepancyStatus # RESOLVED or WAIVED
    resolution_note: str


class DiscrepancyResponse(BaseModel):
    id: str
    instrument_id: str
    rule_code: str
    severity: DiscrepancySeverity
    message: str
    detected_by: str
    status: DiscrepancyStatus
    resolved_by: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
