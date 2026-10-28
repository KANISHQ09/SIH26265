import { 
  MOCK_USERS, ROLE_SUMMARIES, MOCK_KPIS, ROLE_KPIS, ALL_INSTRUMENTS, 
  MOCK_DISCREPANCIES, ROLE_DISCREPANCIES, MOCK_RELEASES, ROLE_RELEASES 
} from "./mockData";
import { UserRole } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;
  private currentRole: UserRole = "SCRUTINY_OFFICER";
  private memoryInstruments = [...ALL_INSTRUMENTS];
  private memoryDiscrepancies = [...MOCK_DISCREPANCIES];
  private memoryReleases = [...MOCK_RELEASES];
  private simulatedDate = new Date().toISOString().split("T")[0];
  private isAuditTampered = false;
  private tamperedAuditId: number | null = null;
  private memoryAuditLogs = [
    {
      id: 1,
      entity_type: "Instrument",
      entity_id: "inst-fdr-001",
      action: "INSTRUMENT_CREATED",
      actor_id: "usr-inst-01",
      actor_email: "institution@iitdelhi.ac.in",
      actor_role: "INSTITUTION_USER",
      prev_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      row_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      current_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      at: "2026-10-24T09:15:30.000Z",
      created_at: "2026-10-24T09:15:30.000Z",
      ip_address: "103.27.8.42",
      before_json: null,
      after_json: { status: "DRAFT", amount: 1500000, reference_number: "FDR-PNB-2026-8812" },
    },
    {
      id: 2,
      entity_type: "Verification",
      entity_id: "inst-fdr-001",
      action: "BANK_SFMS_MATCHED",
      actor_id: "usr-scrutiny-01",
      actor_email: "scrutiny@aicte-india.org",
      actor_role: "SCRUTINY_OFFICER",
      prev_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      row_hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      current_hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      at: "2026-10-25T11:42:15.000Z",
      created_at: "2026-10-25T11:42:15.000Z",
      ip_address: "14.139.58.11",
      before_json: { trust_level: "SUBMITTED" },
      after_json: { trust_level: "BANK_CONFIRMED", sfms_code: "SFMS-MATCH-ACK-902" },
    },
    {
      id: 3,
      entity_type: "Discrepancy",
      entity_id: "inst-fdr-003",
      action: "DISCREPANCY_FLAGGED",
      actor_id: "usr-scrutiny-01",
      actor_email: "scrutiny@aicte-india.org",
      actor_role: "SCRUTINY_OFFICER",
      prev_hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      row_hash: "c23f11a876bcde09a34e52d7da7dabfac484efe37a5380ee9088f7ace2efcd01",
      current_hash: "c23f11a876bcde09a34e52d7da7dabfac484efe37a5380ee9088f7ace2efcd01",
      at: "2026-10-26T14:05:08.000Z",
      created_at: "2026-10-26T14:05:08.000Z",
      ip_address: "14.139.58.11",
      before_json: { discrepancies: 0 },
      after_json: { rule_code: "R-02", severity: "HIGH", message: "Maturity date less than mandatory 3-year AICTE threshold" },
    },
  ];

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("zetsu_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("zetsu_token", token);
      } else {
        localStorage.removeItem("zetsu_token");
      }
    }
  }

  getToken() {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("zetsu_token");
    }
    return this.token;
  }

  setRole(role: UserRole) {
    this.currentRole = role;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return (await res.json()) as T;
      }
      return (await res.text()) as unknown as T;
    } catch (err) {
      console.warn(`[Zetsu API] Live endpoint ${endpoint} unavailable, serving resilient data:`, err);
      return this.handleFallback<T>(endpoint, options);
    }
  }

  private handleFallback<T>(endpoint: string, options: RequestInit = {}): T {
    // Auth login
    if (endpoint === "/auth/login") {
      let role: UserRole = "SCRUTINY_OFFICER";
      try {
        if (options.body && typeof options.body === "string") {
          const body = JSON.parse(options.body);
          if (body.email.includes("institution")) role = "INSTITUTION_USER";
          else if (body.email.includes("section")) role = "SECTION_HEAD";
          else if (body.email.includes("finance")) role = "FINANCE_OFFICER";
          else if (body.email.includes("director")) role = "COMPETENT_AUTHORITY";
          else if (body.email.includes("auditor")) role = "AUDITOR";
          else if (body.email.includes("admin")) role = "ADMIN";
        }
      } catch (e) {}

      this.currentRole = role;
      return {
        access_token: "mock-zetsu-demo-token",
        token_type: "bearer",
        user: MOCK_USERS[role] || MOCK_USERS["SCRUTINY_OFFICER"],
      } as unknown as T;
    }

    if (endpoint === "/auth/me") {
      return (MOCK_USERS[this.currentRole] || MOCK_USERS["SCRUTINY_OFFICER"]) as unknown as T;
    }

    // Dashboard
    if (endpoint === "/dashboard/summary") {
      return (ROLE_SUMMARIES[this.currentRole] || ROLE_SUMMARIES["SCRUTINY_OFFICER"]) as unknown as T;
    }

    if (endpoint === "/dashboard/kpis") {
      return (ROLE_KPIS[this.currentRole] || MOCK_KPIS) as unknown as T;
    }

    // Instruments
    if (endpoint.startsWith("/instruments")) {
      if (endpoint.includes("/chain")) {
        const parentId = endpoint.split("/")[2];
        return [
          {
            id: parentId || "parent-1",
            reference_number: "FDR-ORIG-2018-0012",
            amount: 2000000,
            issue_date: "2018-05-15",
            maturity_date: "2023-05-14",
            status: "RENEWED",
            is_current: false,
          },
          {
            id: "current-child",
            reference_number: "FDR-REN-2023-9914",
            amount: 2000000,
            issue_date: "2023-05-15",
            maturity_date: "2028-05-14",
            status: "ACTIVE",
            is_current: true,
          },
        ] as unknown as T;
      }

      if (endpoint === "/instruments" && options.method === "POST") {
        try {
          const body = JSON.parse(options.body as string);
          const newInst = {
            id: `inst-new-${Date.now()}`,
            institution_id: "inst-001",
            type: body.type || "FDR",
            reference_number: body.reference_number || `FDR-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: Number(body.amount) || 1000000,
            issue_date: body.issue_date || this.simulatedDate,
            maturity_date: body.maturity_date || "2031-03-31",
            branch_name: body.branch_name || "State Bank of India, Main Branch",
            lien_marked: true,
            purpose: body.purpose || "AICTE Mandatory Security Deposit",
            status: "SUBMITTED" as any,
            overall_trust: "SUBMITTED" as any,
            version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            institution: {
              id: "inst-001",
              aicte_id: "1-10023456",
              name: "Indian Institute of Technology Delhi (Campus Ext)",
            },
            field_trusts: [],
            observations: [],
          };
          this.memoryInstruments.unshift(newInst as any);
          return newInst as unknown as T;
        } catch (e) {}
      }

      const matchId = endpoint.match(/\/instruments\/([a-zA-Z0-9_-]+)$/);
      if (matchId) {
        const found = this.memoryInstruments.find((i) => i.id === matchId[1]);
        return (found || this.memoryInstruments[0]) as unknown as T;
      }

      // Filter instruments based on current active role
      if (this.currentRole === "INSTITUTION_USER") {
        return this.memoryInstruments.filter((i) => i.institution_id === "inst-001") as unknown as T;
      }
      if (this.currentRole === "SECTION_HEAD") {
        // Section Head prioritizes items needing immediate review / escalation
        return this.memoryInstruments.filter((i) => 
          ["OVERDUE", "EXPIRING", "DISCREPANCY_FLAGGED", "UNDER_SCRUTINY", "RELEASE_REQUESTED"].includes(i.status)
        ) as unknown as T;
      }
      if (this.currentRole === "FINANCE_OFFICER") {
        // Finance Officer monitors active escrow values and release settlements
        return this.memoryInstruments.filter((i) => 
          ["ACTIVE", "RELEASE_REQUESTED", "RELEASED", "EXPIRING"].includes(i.status)
        ) as unknown as T;
      }
      if (this.currentRole === "COMPETENT_AUTHORITY") {
        // Director / Competent Authority handles releases, high-value overdues, and approvals
        return this.memoryInstruments.filter((i) => 
          ["RELEASE_REQUESTED", "OVERDUE", "ACTIVE"].includes(i.status)
        ) as unknown as T;
      }

      // Scrutiny Officer, Auditor, Admin see all instruments
      return this.memoryInstruments as unknown as T;
    }

    // Discrepancies
    if (endpoint.startsWith("/discrepancies")) {
      return (ROLE_DISCREPANCIES[this.currentRole] || this.memoryDiscrepancies) as unknown as T;
    }

    // Release
    if (endpoint.startsWith("/release")) {
      return (ROLE_RELEASES[this.currentRole] || this.memoryReleases) as unknown as T;
    }

    // Admin & System Date
    if (endpoint === "/admin/system-date") {
      return { system_date: this.simulatedDate } as unknown as T;
    }

    if (endpoint === "/admin/time-travel") {
      let days = 30;
      try {
        if (options.body) days = JSON.parse(options.body as string).days || 30;
      } catch (e) {}
      const d = new Date(this.simulatedDate);
      d.setDate(d.getDate() + days);
      this.simulatedDate = d.toISOString().split("T")[0];
      return {
        simulated_system_date: this.simulatedDate,
        effects: {
          status_refreshes: { moved_to_expiring: 2, moved_to_overdue: 1 },
          reminders_dispatched: 4,
          escalations_triggered: 1,
        },
      } as unknown as T;
    }

    if (endpoint === "/admin/time-travel/reset") {
      this.simulatedDate = new Date().toISOString().split("T")[0];
      return { system_date: this.simulatedDate } as unknown as T;
    }

    // Audit
    if (endpoint.startsWith("/audit")) {
      if (endpoint === "/audit/verify-chain") {
        if (this.isAuditTampered) {
          const targetId = this.tamperedAuditId || 1;
          return {
            is_valid: false,
            broken_at_audit_id: targetId,
            message: `Tampering detected at Audit ID #${targetId}: payload contents modified! SHA-256 hash mismatch.`,
            total_records: this.memoryAuditLogs.length,
            genesis_hash: "0000000000000000000000000000000000000000000000000000000000000000",
            latest_hash: this.memoryAuditLogs[this.memoryAuditLogs.length - 1]?.row_hash,
            tamper_detected: true,
          } as unknown as T;
        }
        return {
          is_valid: true,
          broken_at_audit_id: null,
          message: `Chain integrity verified: ${this.memoryAuditLogs.length} audit entries cryptographically valid (SHA-256 intact).`,
          total_records: this.memoryAuditLogs.length,
          genesis_hash: "0000000000000000000000000000000000000000000000000000000000000000",
          latest_hash: this.memoryAuditLogs[this.memoryAuditLogs.length - 1]?.row_hash,
          tamper_detected: false,
        } as unknown as T;
      }

      if (endpoint.startsWith("/audit/tamper-demo")) {
        const parts = endpoint.split("audit_id=");
        const targetId = parts[1] ? Number(parts[1]) : 1;
        this.isAuditTampered = true;
        this.tamperedAuditId = targetId;
        const target = this.memoryAuditLogs.find((l) => l.id === targetId);
        if (target) {
          target.action = "TAMPERED_ACTION_UNAUTHORIZED";
        }
        return {
          tamper_executed: true,
          tampered_audit_id: targetId,
          chain_verification_result: {
            is_valid: false,
            broken_at_audit_id: targetId,
            message: `Tampering detected at Audit ID #${targetId}: payload contents modified! SHA-256 hash mismatch.`,
          },
        } as unknown as T;
      }

      if (endpoint.startsWith("/audit/tamper-reset")) {
        this.isAuditTampered = false;
        this.tamperedAuditId = null;
        const target = this.memoryAuditLogs.find((l) => l.id === 1);
        if (target) {
          target.action = "INSTRUMENT_CREATED";
        }
        return {
          reset_executed: true,
          chain_verification_result: {
            is_valid: true,
            broken_at_audit_id: null,
            message: `Chain integrity verified: ${this.memoryAuditLogs.length} audit entries cryptographically valid (SHA-256 intact).`,
          },
        } as unknown as T;
      }

      return [...this.memoryAuditLogs] as unknown as T;
    }

    return {} as unknown as T;
  }

  // Auth
  async login(email: string, password: string = "Zetsu@2026Pass") {
    const data = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<any>("/auth/me");
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request<any>("/dashboard/summary");
  }

  async getKPIMetrics() {
    return this.request<any>("/dashboard/kpis");
  }

  // Instruments
  async listInstruments(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/instruments${query ? `?${query}` : ""}`);
  }

  async getInstrument(id: string) {
    return this.request<any>(`/instruments/${id}`);
  }

  async createInstrument(data: any) {
    return this.request<any>("/instruments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async submitInstrument(id: string) {
    return this.request<any>(`/instruments/${id}/submit`, { method: "POST" });
  }

  async transitionInstrument(id: string, toStatus: string, reason?: string) {
    return this.request<any>(`/instruments/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ to_status: toStatus, reason }),
    });
  }

  async renewInstrument(id: string, data: any) {
    return this.request<any>(`/instruments/${id}/renew`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addObservation(id: string, text: string, visibleToInstitution: boolean = false) {
    return this.request<any>(`/instruments/${id}/observations`, {
      method: "POST",
      body: JSON.stringify({ text, visible_to_institution: visibleToInstitution }),
    });
  }

  async getRenewalChain(id: string) {
    return this.request<any[]>(`/instruments/${id}/chain`);
  }

  // Documents
  async uploadDocument(instrumentId: string, file: File, docType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    return this.request<any>(`/documents/${instrumentId}/upload`, {
      method: "POST",
      body: formData,
    });
  }

  async getInstrumentDocuments(instrumentId: string) {
    return this.request<any[]>(`/documents/instrument/${instrumentId}`);
  }

  // Verifications
  async triggerBankVerification(instrumentId: string, simulateScenario?: string) {
    return this.request<any>(`/verifications/${instrumentId}/bank`, {
      method: "POST",
      body: JSON.stringify({ simulate_scenario: simulateScenario }),
    });
  }

  async submitOfficerVerification(instrumentId: string, fields: any[], observation?: string) {
    return this.request<any>(`/verifications/${instrumentId}/officer`, {
      method: "POST",
      body: JSON.stringify({ fields, overall_observation: observation }),
    });
  }

  // Discrepancies
  async listAllDiscrepancies() {
    return this.request<any[]>("/discrepancies");
  }

  async listInstrumentDiscrepancies(instrumentId: string) {
    return this.request<any[]>(`/discrepancies/instrument/${instrumentId}`);
  }

  async resolveDiscrepancy(id: string, status: "RESOLVED" | "WAIVED", note: string) {
    return this.request<any>(`/discrepancies/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status, resolution_note: note }),
    });
  }

  // Release Workflow
  async submitReleaseRequest(instrumentId: string, reason: string, requestType: string = "RELEASE") {
    return this.request<any>(`/release/${instrumentId}/request`, {
      method: "POST",
      body: JSON.stringify({ reason, request_type: requestType }),
    });
  }

  async listReleaseRequests() {
    return this.request<any[]>("/release");
  }

  async getReleaseRequest(id: string) {
    return this.request<any>(`/release/${id}`);
  }

  async takeApprovalAction(releaseId: string, decision: "APPROVED" | "REJECTED", note: string) {
    return this.request<any>(`/release/${releaseId}/action`, {
      method: "POST",
      body: JSON.stringify({ decision, note }),
    });
  }

  // Admin & Time-Travel
  async triggerTimeTravel(days: number) {
    return this.request<any>("/admin/time-travel", {
      method: "POST",
      body: JSON.stringify({ days }),
    });
  }

  async resetTimeTravel() {
    return this.request<any>("/admin/time-travel/reset", { method: "POST" });
  }

  async getSystemDate() {
    return this.request<any>("/admin/system-date");
  }

  // Audit
  async listAuditLogs() {
    return this.request<any[]>("/audit");
  }

  async verifyAuditChain() {
    return this.request<any>("/audit/verify-chain");
  }

  async triggerTamperDemo(auditId: number) {
    return this.request<any>(`/audit/tamper-demo?audit_id=${auditId}`, {
      method: "POST",
    });
  }

  async resetTamperDemo() {
    return this.request<any>("/audit/tamper-reset", {
      method: "POST",
    });
  }

  // Reports
  getReportDownloadUrl(reportType: string) {
    return `${API_BASE}/reports/${reportType}?format=csv`;
  }
}

export const api = new ApiClient();
