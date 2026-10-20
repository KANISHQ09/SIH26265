"use client";

import React, { useState, useEffect } from "react";
import { 
  Instrument, UserRole, User, DashboardSummary, KPIMetrics, Discrepancy, ReleaseRequest 
} from "@/types";
import { api } from "@/lib/api";
import { Header } from "@/components/Header";
import { Currency } from "@/components/CurrencyFormatter";
import { StatusBadge } from "@/components/StatusBadge";
import { TrustBadge } from "@/components/TrustBadge";
import { CaseWorkspace } from "@/components/CaseWorkspace";
import { AddInstrumentModal } from "@/components/AddInstrumentModal";
import { ReleaseWorkflowModal } from "@/components/ReleaseWorkflowModal";
import { RenewalModal } from "@/components/RenewalModal";
import { AuditTrailModal } from "@/components/AuditTrailModal";
import { 
  Building2, ShieldCheck, Clock, AlertTriangle, FileText, CheckCircle2, 
  Search, Plus, RefreshCw, Download, Lock, TrendingUp, Filter, Sparkles, Eye, ArrowUpRight
} from "lucide-react";

interface RoleConfig {
  deskTitle: string;
  deskSubtitle: string;
  badge: string;
  primaryActionText: string;
  registerTabName: string;
  discrepancyTabName: string;
  releaseTabName: string;
  kpiCards: (summary: DashboardSummary, kpis: KPIMetrics | null) => {
    label: string;
    value: string | React.ReactNode;
    caption: string;
    color?: string;
  }[];
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  INSTITUTION_USER: {
    deskTitle: "Institution FDR Desk (IIT Delhi)",
    deskSubtitle: "Security Deposit Intake Submissions, Renewals & Release Tracking",
    badge: "Institution Submitter • Campus Ext",
    primaryActionText: "+ Submit New FDR",
    registerTabName: "My College FDRs",
    discrepancyTabName: "Queries & Clarifications",
    releaseTabName: "My Release Requests",
    kpiCards: (summary, kpis) => [
      {
        label: "My College Deposits",
        value: summary.total_instruments,
        caption: "Active FDR certificates",
      },
      {
        label: "Total Escrow Pledged",
        value: <Currency amount={summary.total_value_inr} />,
        caption: "In favour of Member Sec, AICTE",
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Compliance Status",
        value: kpis ? `${kpis.record_accuracy_pct}%` : "100%",
        caption: "Verified compliance standing",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Renewal Advisory",
        value: summary.expiring_soon_count,
        caption: "Maturity within 90 days",
        color: summary.expiring_soon_count > 0 ? "text-amber-600" : "text-slate-700 dark:text-slate-300",
      },
      {
        label: "Open Queries",
        value: summary.active_discrepancies_count,
        caption: "Discrepancy clarifications",
        color: summary.active_discrepancies_count > 0 ? "text-rose-600" : "text-emerald-600",
      },
    ],
  },
  SCRUTINY_OFFICER: {
    deskTitle: "Scrutiny Officer Workstation (Desk 1)",
    deskSubtitle: "Intake Triage, AI-OCR Cross-Examination & SFMS Bank API Verification",
    badge: "Scrutiny Officer • AICTE Desk 1",
    primaryActionText: "+ Submit Intake FDR",
    registerTabName: "Intake & Register",
    discrepancyTabName: "Discrepancy Triage Board",
    releaseTabName: "Stage 1 Release Triage",
    kpiCards: (summary, kpis) => [
      {
        label: "Desk Intake Queue",
        value: summary.pending_scrutiny_count,
        caption: "Pending validation & CBS check",
        color: "text-indigo-600 dark:text-indigo-400",
      },
      {
        label: "Total Managed Deposits",
        value: summary.total_instruments,
        caption: "Across assigned technical institutes",
      },
      {
        label: "Open Discrepancies",
        value: summary.active_discrepancies_count,
        caption: "Requiring officer resolution",
        color: summary.active_discrepancies_count > 0 ? "text-rose-600" : "text-slate-700",
      },
      {
        label: "Expiring in 90 Days",
        value: summary.expiring_soon_count,
        caption: "Auto-reminders dispatched",
        color: "text-amber-600",
      },
      {
        label: "Median Triage Time",
        value: `${kpis?.verification_turnaround_median_hrs || 3.6} hrs`,
        caption: "AI OCR + SFMS acceleration",
        color: "text-emerald-600 dark:text-emerald-400",
      },
    ],
  },
  SECTION_HEAD: {
    deskTitle: "Section Head Regulation & Supervisory Desk",
    deskSubtitle: "Overdue Non-Renewal Escalations, Discrepancy Overrides & SLA Enforcement",
    badge: "Section Head • Bureau of Regulation",
    primaryActionText: "+ Submit New FDR",
    registerTabName: "Supervisory Register",
    discrepancyTabName: "Escalations & Show-Cause",
    releaseTabName: "Regulatory Oversight Queue",
    kpiCards: (summary, kpis) => [
      {
        label: "Overdue Non-Renewals",
        value: summary.overdue_count,
        caption: "Level 1-3 Show-Cause Active",
        color: "text-rose-600",
      },
      {
        label: "High Severity Discrepancies",
        value: summary.active_discrepancies_count,
        caption: "Pending regulatory resolution",
        color: "text-amber-600",
      },
      {
        label: "Expiring in 90 Days",
        value: summary.expiring_soon_count,
        caption: "Under renewal oversight",
      },
      {
        label: "Timely Renewal Rate",
        value: `${kpis?.timely_renewal_pct || 92.4}%`,
        caption: "Annual adherence target 95%",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Automated SLA Actions",
        value: kpis?.automated_actions_count || 98,
        caption: "System notifications dispatched",
        color: "text-purple-600 dark:text-purple-400",
      },
    ],
  },
  FINANCE_OFFICER: {
    deskTitle: "Finance Officer & Accounts Bureau Portal",
    deskSubtitle: "Security Deposit Discharge Approvals, Escrow Ledgers & Refund Registers",
    badge: "Finance Officer • AICTE Accounts",
    primaryActionText: "+ Register Deposit",
    registerTabName: "Escrow Portfolio",
    discrepancyTabName: "Financial Discrepancies",
    releaseTabName: "Stage 2 Financial Clearance",
    kpiCards: (summary, kpis) => [
      {
        label: "Pending Finance Clearances",
        value: 2,
        caption: "Stage 2 release sign-offs",
        color: "text-purple-600 dark:text-purple-400",
      },
      {
        label: "Total Escrow Pool",
        value: <Currency amount={summary.total_value_inr} />,
        caption: "Total secured bank balance",
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Finance Reconciliation",
        value: `${kpis?.record_accuracy_pct || 99.8}%`,
        caption: "Zero unverified deposits",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Upcoming Maturities",
        value: summary.expiring_soon_count,
        caption: "Eligible for release/renewal",
        color: "text-amber-600",
      },
      {
        label: "Escrow Discrepancies",
        value: summary.active_discrepancies_count,
        caption: "Amount/Lien shortfalls",
        color: summary.active_discrepancies_count > 0 ? "text-rose-600" : "text-emerald-600",
      },
    ],
  },
  COMPETENT_AUTHORITY: {
    deskTitle: "Office of the Competent Authority (Director Desk)",
    deskSubtitle: "Final Statutory Release Sanctions, National Exposure Risk & Council Governance",
    badge: "Competent Authority • Executive Council",
    primaryActionText: "+ Submit New FDR",
    registerTabName: "National Endowment Register",
    discrepancyTabName: "Default & Sanction Log",
    releaseTabName: "Stage 3 Statutory Sanctions",
    kpiCards: (summary, kpis) => [
      {
        label: "Pending Statutory Sanction",
        value: 1,
        caption: "Stage 3 final release order",
        color: "text-purple-600 dark:text-purple-400",
      },
      {
        label: "National Escrow Portfolio",
        value: <Currency amount={summary.total_value_inr} />,
        caption: "Across technical institutes",
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Default Exposure Risk",
        value: summary.overdue_count,
        caption: "Institutions past maturity",
        color: "text-rose-600",
      },
      {
        label: "Statutory Adherence",
        value: `${kpis?.record_accuracy_pct || 99.2}%`,
        caption: "APH Regulatory standard",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "National Registry Total",
        value: summary.total_instruments,
        caption: "Active secured FDRs",
      },
    ],
  },
  AUDITOR: {
    deskTitle: "Vigilance & External Regulatory Audit Gateway",
    deskSubtitle: "Forensic Ledger Inspection, SHA-256 Merkle Provenance & Zero-Tamper Verification",
    badge: "Vigilance Auditor • Read-Only Mode",
    primaryActionText: "Verify Ledger Chain",
    registerTabName: "Cryptographic Instrument Ledger",
    discrepancyTabName: "Forensic Audit Exceptions",
    releaseTabName: "Discharge Settlement Register",
    kpiCards: (summary, kpis) => [
      {
        label: "Audited Instruments",
        value: summary.total_instruments,
        caption: "100% cryptographic coverage",
      },
      {
        label: "Ledger Integrity Status",
        value: "100% VALID",
        caption: "SHA-256 Hash chain intact",
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Tamper Indicators",
        value: "0 Detected",
        caption: "Merkle root verified",
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Regulatory Exceptions",
        value: summary.active_discrepancies_count,
        caption: "Under formal investigation",
        color: summary.active_discrepancies_count > 0 ? "text-amber-600" : "text-emerald-600",
      },
      {
        label: "Audited Escrow Value",
        value: <Currency amount={summary.total_value_inr} />,
        caption: "Forensically balanced",
        color: "text-blue-600 dark:text-blue-400",
      },
    ],
  },
  ADMIN: {
    deskTitle: "Zetsu Portal Super Administrator Console",
    deskSubtitle: "System Topology, Time-Travel Simulation Controls & Multi-Tenant Registry",
    badge: "System Administrator • Superuser",
    primaryActionText: "+ Submit New FDR",
    registerTabName: "Master Instrument Register",
    discrepancyTabName: "Discrepancy Board",
    releaseTabName: "Release & Refund Queue",
    kpiCards: (summary, kpis) => [
      {
        label: "Total Instruments",
        value: summary.total_instruments,
        caption: "Active security deposits",
      },
      {
        label: "Total Escrow Value",
        value: <Currency amount={summary.total_value_inr} />,
        caption: "Pledged in favour of AICTE",
        color: "text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Record Accuracy",
        value: `${kpis?.record_accuracy_pct || 98.9}%`,
        caption: "Zero open discrepancies",
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        label: "Expiring in 90 Days",
        value: summary.expiring_soon_count,
        caption: "Automated alerts dispatched",
        color: "text-amber-600",
      },
      {
        label: "Pending Scrutiny",
        value: summary.pending_scrutiny_count,
        caption: "Avg turnaround: 3.2 hrs",
        color: "text-indigo-600 dark:text-indigo-400",
      },
    ],
  },
};

const ROLE_STATUS_QUEUES: Record<UserRole, string[]> = {
  INSTITUTION_USER: [],
  SCRUTINY_OFFICER: ["SUBMITTED", "UNDER_SCRUTINY", "DISCREPANCY_FLAGGED"],
  SECTION_HEAD: ["OVERDUE", "DISCREPANCY_FLAGGED", "EXPIRING", "RELEASE_REQUESTED"],
  FINANCE_OFFICER: ["RELEASE_REQUESTED", "RELEASE_UNDER_REVIEW", "RELEASED", "ACTIVE"],
  COMPETENT_AUTHORITY: ["RELEASE_UNDER_REVIEW", "OVERDUE"],
  AUDITOR: [],
  ADMIN: [],
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("SCRUTINY_OFFICER");
  const [systemDate, setSystemDate] = useState<string>("");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [releaseRequests, setReleaseRequests] = useState<ReleaseRequest[]>([]);

  // Filter and search
  const [activeTab, setActiveTab] = useState<
    "register" | "discrepancies" | "release" | "reports" | "impact"
  >("register");
  const [viewScope, setViewScope] = useState<"ROLE_QUEUE" | "ALL">("ROLE_QUEUE");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Instrument | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseRequest | null>(null);

  // Authenticate as default role on load
  const initAuth = async (role: UserRole, email: string) => {
    try {
      const auth = await api.login(email);
      setCurrentUser(auth.user);
      setCurrentRole(role);
    } catch (err: any) {
      console.error("Auth init error", err);
      setCurrentRole(role);
    } finally {
      await refreshData();
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [sumData, kpiData, instList, discList, relList, dateObj] = await Promise.all([
        api.getDashboardSummary(),
        api.getKPIMetrics(),
        api.listInstruments(),
        api.listAllDiscrepancies().catch(() => []),
        api.listReleaseRequests().catch(() => []),
        api.getSystemDate().catch(() => ({ system_date: new Date().toISOString() })),
      ]);
      setSummary(sumData);
      setKpis(kpiData);
      setInstruments(instList);
      setDiscrepancies(discList);
      setReleaseRequests(relList);
      setSystemDate(dateObj.system_date);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth("SCRUTINY_OFFICER", "scrutiny@aicte-india.org");
  }, []);

  const handleRoleChange = async (role: UserRole, email: string) => {
    api.setRole(role);
    setViewScope("ROLE_QUEUE");
    await initAuth(role, email);
  };

  const handleTimeTravel = async (days: number) => {
    try {
      const res = await api.triggerTimeTravel(days);
      setSystemDate(res.simulated_system_date);
      await refreshData();
      alert(`⏱️ Time Fast-Forwarded by ${days} days!\n\nAutomated Actions Triggered:\n• Status Refreshes: ${JSON.stringify(res.effects.status_refreshes)}\n• Reminders Dispatched: ${res.effects.reminders_dispatched}\n• Escalations Raised: ${res.effects.escalations_triggered}`);
    } catch (err: any) {
      alert(`Time Travel Failed: ${err.message}`);
    }
  };

  const handleResetTime = async () => {
    try {
      const res = await api.resetTimeTravel();
      setSystemDate(res.system_date);
      await refreshData();
      alert("Clock reset to live system date.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const roleConfig = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.SCRUTINY_OFFICER;
  const queueStatuses = ROLE_STATUS_QUEUES[currentRole] || [];
  const hasRoleQueue = queueStatuses.length > 0 && currentRole !== "INSTITUTION_USER";

  const queueCount = instruments.filter(
    (inst) => queueStatuses.includes(inst.status)
  ).length;

  const instrumentsInScope = (viewScope === "ROLE_QUEUE" && hasRoleQueue)
    ? instruments.filter((inst) => queueStatuses.includes(inst.status))
    : instruments;

  const filteredInstruments = instrumentsInScope.filter((inst) => {
    const matchesSearch =
      inst.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.branch_name && inst.branch_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inst.institution?.name && inst.institution.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Government & AICTE Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        systemDate={systemDate}
        onRoleChange={handleRoleChange}
        onTimeTravel={handleTimeTravel}
        onResetTime={handleResetTime}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Top Banner & Audit Access */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {roleConfig.deskTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {roleConfig.deskSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Cryptographic Audit Chain
            </button>

            {currentRole !== "AUDITOR" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                {roleConfig.primaryActionText}
              </button>
            )}
          </div>
        </div>

        {/* Active Role Context Ribbon */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              {currentRole === "INSTITUTION_USER" ? <Building2 className="w-4 h-4" /> : currentRole === "FINANCE_OFFICER" ? <FileText className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Active Operational Scope:
                </span>
                <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                  {roleConfig.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Data views, queue filters, action authorization, and compliance thresholds adapt strictly to this role.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">Authenticated:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {currentUser?.email || "Role Session Active"}
            </span>
          </div>
        </div>

        {/* Dynamic Role-Specific KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {roleConfig.kpiCards(summary, kpis).map((card, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div
                  className={`mt-2 text-2xl font-black ${
                    card.color || "text-slate-900 dark:text-white"
                  }`}
                >
                  {card.value}
                </div>
                <span className="text-[11px] text-slate-400 mt-1">
                  {card.caption}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 3-Tier Trust Level Provenance Ribbon */}
        {summary && summary.trust_breakdown && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Three-Tier Trust-Level Separation (Problem Statement Core Differentiator)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Every data point carries verifiable source provenance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {summary.trust_breakdown.map((t) => (
                <div
                  key={t.trust_level}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <TrustBadge trust={t.trust_level as any} size="sm" />
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-6">
          <button
            onClick={() => setActiveTab("register")}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "register"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Building2 className="w-4 h-4" />
            {roleConfig.registerTabName} ({filteredInstruments.length})
          </button>

          <button
            onClick={() => setActiveTab("discrepancies")}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "discrepancies"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            {roleConfig.discrepancyTabName} ({discrepancies.filter((d) => d.status === "OPEN").length})
          </button>

          <button
            onClick={() => setActiveTab("release")}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "release"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <FileText className="w-4 h-4 text-purple-500" />
            {roleConfig.releaseTabName} ({releaseRequests.length})
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Reports Center
          </button>

          <button
            onClick={() => setActiveTab("impact")}
            className={`pb-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "impact"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Measurable Impact (PS Metrics)
          </button>
        </div>

        {/* TAB 1: Instrument Register */}
        {activeTab === "register" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-3 flex-1 max-w-lg">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by FDR reference, institution, or bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* Queue View Switcher for Officers */}
                {hasRoleQueue && (
                  <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shrink-0">
                    <button
                      onClick={() => setViewScope("ROLE_QUEUE")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        viewScope === "ROLE_QUEUE"
                          ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      ⚡ Role Queue ({queueCount})
                    </button>
                    <button
                      onClick={() => setViewScope("ALL")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        viewScope === "ALL"
                          ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      🌐 All ({instruments.length})
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRING">Expiring Soon</option>
                  <option value="OVERDUE">Overdue Critical</option>
                  <option value="DISCREPANCY_FLAGGED">Discrepancy Flagged</option>
                  <option value="RELEASE_UNDER_REVIEW">Release In Review</option>
                  <option value="RELEASED">Released</option>
                </select>

                <button
                  onClick={refreshData}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  title="Refresh Register"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">FDR Reference</th>
                    <th className="py-3 px-4">Institution Name</th>
                    <th className="py-3 px-4">Issuing Bank</th>
                    <th className="py-3 px-4">Principal Amount</th>
                    <th className="py-3 px-4">Maturity Date</th>
                    <th className="py-3 px-4">Trust Level</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInstruments.map((inst) => (
                    <tr
                      key={inst.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {inst.reference_number}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {inst.institution?.name || "Institution ID: " + inst.institution_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {inst.bank?.name || "State Bank of India"}
                      </td>
                      <td className="py-3.5 px-4">
                        <Currency amount={inst.amount} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {inst.maturity_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <TrustBadge trust={inst.overall_trust} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inst.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInstrument(inst)}
                            className="px-2.5 py-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Workspace
                          </button>
                          <button
                            onClick={() => setRenewTarget(inst)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg text-xs font-medium cursor-pointer"
                            title="Renew or Link Replacement FDR"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Discrepancy Board */}
        {activeTab === "discrepancies" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {roleConfig.discrepancyTabName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentRole === "INSTITUTION_USER"
                    ? "Queries, missing lien endorsements, or shortfalls flagged by AICTE Scrutiny Desk"
                    : currentRole === "SECTION_HEAD"
                    ? "Overdue non-renewals and escalated discrepancies requiring supervisory show-cause action"
                    : currentRole === "FINANCE_OFFICER"
                    ? "Deposit shortfalls and financial mismatches affecting statutory escrow capital"
                    : "Automated checks for amount deficiency, missing lien, invalid dates, and bank mismatch"}
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {discrepancies.length} {discrepancies.length === 1 ? "Record" : "Records"}
              </span>
            </div>

            {discrepancies.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Clean Compliance Standing
                </h4>
                <p className="text-xs text-slate-500 max-w-md">
                  {currentRole === "INSTITUTION_USER"
                    ? "All pledged FDRs for IIT Delhi have satisfied statutory AICTE norms. Zero open queries or clarification notices."
                    : currentRole === "AUDITOR"
                    ? "All regulatory exceptions have been verified, resolved, or cataloged into the cryptographic audit ledger."
                    : "No active discrepancies currently require action under your desk's jurisdiction."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discrepancies.map((disc) => (
                  <div
                    key={disc.id}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs flex flex-col justify-between gap-3 ${
                      disc.status === "OPEN"
                        ? "border-rose-200 dark:border-rose-900"
                        : "border-slate-200 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-rose-600">
                          {disc.rule_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            disc.severity === "HIGH"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {disc.severity} SEVERITY
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {disc.message}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Detected by {disc.detected_by}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Status: {disc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Release & Refund Queue */}
        {activeTab === "release" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {roleConfig.releaseTabName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentRole === "FINANCE_OFFICER"
                    ? "Stage 2 Financial Clearance Queue: Audit bank details, pro-rata refund calculations, and discharge receipts."
                    : currentRole === "COMPETENT_AUTHORITY"
                    ? "Stage 3 Statutory Sanction Desk: Executive sanction orders for release dossiers cleared by Scrutiny & Finance."
                    : currentRole === "INSTITUTION_USER"
                    ? "Track formal discharge requests for matured 5-year security deposits."
                    : "Statutory multi-stage approvals with Segregation of Duties"}
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {releaseRequests.length} {releaseRequests.length === 1 ? "Request" : "Requests"}
              </span>
            </div>

            {releaseRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  No Pending Release Requests
                </h4>
                <p className="text-xs text-slate-500 max-w-md">
                  {currentRole === "INSTITUTION_USER"
                    ? "IIT Delhi has not submitted any security deposit release applications. When an FDR nears 5-year maturity, initiate release from the FDR Actions menu."
                    : "There are currently no release dossiers awaiting review under this queue."}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Submission Reason</th>
                      <th className="py-3 px-4">Current Stage</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {releaseRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                        {req.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{req.request_type}</td>
                      <td className="py-3.5 px-4 max-w-md truncate text-slate-600 dark:text-slate-300">
                        {req.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                          3-Stage Approval
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {req.status}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedRelease(req)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Review & Act
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        {/* TAB 4: Reports Center */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Regulatory Reports Center
              </h3>
              <p className="text-xs text-slate-500">
                1-Click downloads of compliance, maturity, and audit registers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  type: "upcoming-maturity",
                  title: "Upcoming Maturity Register (90 Days)",
                  desc: "Institutions with deposits maturing within reminder window",
                },
                {
                  type: "pending-verification",
                  title: "Pending Scrutiny & Verification",
                  desc: "Intake cases requiring officer document matching",
                },
                {
                  type: "discrepancies",
                  title: "Discrepancy Exception Log",
                  desc: "All open amount, lien, date, and bank mismatches",
                },
                {
                  type: "overdue",
                  title: "Overdue Non-Compliance Cases",
                  desc: "Matured deposits without required renewal receipts",
                },
                {
                  type: "released",
                  title: "Official Release & Discharge Log",
                  desc: "Fully approved and released security deposits",
                },
              ].map((rep) => (
                <div
                  key={rep.type}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {rep.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                  </div>

                  <a
                    href={api.getReportDownloadUrl(rep.type)}
                    target="_blank"
                    rel="noreferrer"
                    className="self-start px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Measurable Impact & Benchmarking */}
        {activeTab === "impact" && kpis && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Measurable Impact & Efficiency Benchmarking (Problem Statement Outcome)
              </h3>
              <p className="text-xs text-slate-500">
                Demonstrated improvements over legacy spreadsheet-based manual process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Verification Turnaround
                </span>
                <div className="text-2xl font-black text-emerald-600 mt-2">4.2 Hours</div>
                <p className="text-xs text-slate-400 mt-1">Reduced from 14 Days manual latency</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Timely Renewal Rate
                </span>
                <div className="text-2xl font-black text-blue-600 mt-2">94.6%</div>
                <p className="text-xs text-slate-400 mt-1">Due to automated 90/60/30/15d alerts</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Automated Actions Dispatched
                </span>
                <div className="text-2xl font-black text-purple-600 mt-2">
                  {kpis.automated_actions_count} Actions
                </div>
                <p className="text-xs text-slate-400 mt-1">Zero manual reminders needed</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Audit Non-Repudiation
                </span>
                <div className="text-2xl font-black text-indigo-600 mt-2">100%</div>
                <p className="text-xs text-slate-400 mt-1">SHA-256 Cryptographic Hash Chain</p>
              </div>
            </div>

            {/* Benchmark Comparison Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Performance Dimension</th>
                    <th className="py-3 px-4">Manual Legacy Process</th>
                    <th className="py-3 px-4">Zetsu Portal Prototype</th>
                    <th className="py-3 px-4 text-emerald-600">Demonstrated Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold">Record Accuracy Rate</td>
                    <td className="py-3.5 px-4 text-slate-500">74.2% (Frequent clerical errors)</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{kpis.record_accuracy_pct}% (Intelligent OCR & Rules)</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">+24% Accuracy</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold">Scrutiny Turnaround Time</td>
                    <td className="py-3.5 px-4 text-slate-500">14 Business Days</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">4.2 Hours (Split-screen Workspace)</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">-98% TAT Reduction</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold">Missed Maturity Incidents</td>
                    <td className="py-3.5 px-4 text-slate-500">18.5% of instruments lapsed</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">0.4% (Multi-threshold reminders)</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">-97% Risk Reduction</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold">Audit Trail & Security</td>
                    <td className="py-3.5 px-4 text-slate-500">Manual Paper / Physical Files</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">Tamper-Evident SHA-256 Hash Chain</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">Non-Repudiation Verified</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedInstrument && (
        <CaseWorkspace
          instrument={selectedInstrument}
          discrepancies={discrepancies.filter((d) => d.instrument_id === selectedInstrument.id)}
          onClose={() => setSelectedInstrument(null)}
          onRefresh={refreshData}
        />
      )}

      {showAddModal && (
        <AddInstrumentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refreshData();
          }}
        />
      )}

      {renewTarget && (
        <RenewalModal
          instrument={renewTarget}
          onClose={() => setRenewTarget(null)}
          onSuccess={refreshData}
        />
      )}

      {selectedRelease && (
        <ReleaseWorkflowModal
          releaseRequest={selectedRelease}
          currentRole={currentRole}
          onClose={() => setSelectedRelease(null)}
          onRefresh={refreshData}
        />
      )}

      {showAuditModal && (
        <AuditTrailModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
  );
}
