from typing import Dict, List, Optional
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int
    total_amount: float


class TrustLevelCount(BaseModel):
    trust_level: str
    count: int
    total_amount: float


class DashboardSummaryResponse(BaseModel):
    total_instruments: int
    total_value_inr: float
    status_breakdown: List[StatusCount]
    trust_breakdown: List[TrustLevelCount]
    expiring_soon_count: int
    overdue_count: int
    pending_scrutiny_count: int
    active_discrepancies_count: int


class KPIMetricsResponse(BaseModel):
    record_accuracy_pct: float
    verification_turnaround_median_hrs: float
    timely_renewal_pct: float
    automated_actions_count: int
    pending_case_visibility_pct: float
    simulated_baseline_comparison: Dict[str, Dict[str, str]]
