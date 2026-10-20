const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    // Check content type
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
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

  // Reports
  getReportDownloadUrl(reportType: string) {
    return `${API_BASE}/reports/${reportType}?format=csv`;
  }
}

export const api = new ApiClient();
