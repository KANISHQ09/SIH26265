export type UserRole =
  | "INSTITUTION_USER"
  | "SCRUTINY_OFFICER"
  | "SECTION_HEAD"
  | "FINANCE_OFFICER"
  | "COMPETENT_AUTHORITY"
  | "AUDITOR"
  | "ADMIN";

export type InstrumentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_SCRUTINY"
  | "DISCREPANCY_FLAGGED"
  | "RESUBMISSION_REQUIRED"
  | "VERIFIED"
  | "ACTIVE"
  | "EXPIRING"
  | "RENEWAL_PENDING"
  | "OVERDUE"
  | "MATURED"
  | "RENEWED"
  | "RELEASE_REQUESTED"
  | "RELEASE_UNDER_REVIEW"
  | "RELEASE_APPROVED"
  | "RELEASE_REJECTED"
  | "RELEASED";

export type TrustLevel = "SUBMITTED" | "OFFICER_VERIFIED" | "BANK_CONFIRMED";

export type DiscrepancySeverity = "LOW" | "MEDIUM" | "HIGH";
export type DiscrepancyStatus = "OPEN" | "RESOLVED" | "WAIVED";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  institution_id?: string | null;
  mfa_enabled: boolean;
  is_active: boolean;
}

export interface Bank {
  id: string;
  name: string;
  ifsc_prefix?: string;
  verification_supported: boolean;
}

export interface Institution {
  id: string;
  aicte_id: string;
  name: string;
  state?: string;
  district?: string;
}

export interface FieldTrust {
  id: string;
  field_name: string;
  value_text?: string;
  trust: TrustLevel;
  source_ref?: string;
  recorded_at: string;
}

export interface Observation {
  id: string;
  instrument_id: string;
  author_id: string;
  text: string;
  visible_to_institution: boolean;
  created_at: string;
}

export interface StatusHistory {
  id: number;
  from_status?: InstrumentStatus;
  to_status: InstrumentStatus;
  actor_id?: string;
  reason?: string;
  at: string;
}

export interface Instrument {
  id: string;
  institution_id: string;
  parent_id?: string | null;
  type: string;
  reference_number: string;
  bank_id?: string;
  branch_name?: string;
  amount: number;
  issue_date: string;
  maturity_date: string;
  lien_marked: boolean;
  purpose?: string;
  status: InstrumentStatus;
  overall_trust: TrustLevel;
  assigned_to?: string;
  created_by?: string;
  version: number;
  created_at: string;
  updated_at: string;
  institution?: Institution;
  bank?: Bank;
  field_trusts: FieldTrust[];
  observations: Observation[];
  status_history?: StatusHistory[];
}

export interface DocumentItem {
  id: string;
  instrument_id: string;
  doc_type: string;
  file_name: string;
  storage_key: string;
  sha256: string;
  mime_type?: string;
  size_bytes?: number;
  version_no: number;
  ocr_json?: any;
  uploaded_at: string;
  is_current: boolean;
}

export interface Discrepancy {
  id: string;
  instrument_id: string;
  rule_code: string;
  severity: DiscrepancySeverity;
  message: string;
  detected_by: string;
  status: DiscrepancyStatus;
  resolution_note?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ApprovalStep {
  id: string;
  release_id: string;
  step_order: number;
  required_role: UserRole;
  actor_id?: string;
  decision: string;
  note?: string;
  acted_at?: string;
}

export interface ReleaseRequest {
  id: string;
  instrument_id: string;
  request_type: string;
  reason: string;
  requested_by: string;
  status: string;
  checklist_json?: any;
  decided_by?: string;
  decision_note?: string;
  created_at: string;
  decided_at?: string;
  approval_steps: ApprovalStep[];
}

export interface DashboardSummary {
  total_instruments: number;
  total_value_inr: number;
  status_breakdown: { status: string; count: number; total_amount: number }[];
  trust_breakdown: { trust_level: string; count: number; total_amount: number }[];
  expiring_soon_count: number;
  overdue_count: number;
  pending_scrutiny_count: number;
  active_discrepancies_count: number;
}

export interface KPIMetrics {
  record_accuracy_pct: number;
  verification_turnaround_median_hrs: number;
  timely_renewal_pct: number;
  automated_actions_count: number;
  pending_case_visibility_pct: number;
  simulated_baseline_comparison: Record<string, { manual: string; zetsu: string; delta: string }>;
}
