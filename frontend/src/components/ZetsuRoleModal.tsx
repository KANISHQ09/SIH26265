"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, ShieldCheck, Building2, UserCheck, CheckCircle2, 
  Search, ArrowRight, Lock, KeyRound, Sparkles, AlertCircle 
} from "lucide-react";
import { Emblem } from "./Emblem";
import { UserRole } from "@/types";

interface ZetsuRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZetsuRoleModal: React.FC<ZetsuRoleModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"roles" | "lookup">("roles");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<null | {
    id: string;
    aicteId: string;
    college: string;
    bank: string;
    amount: string;
    lienStatus: string;
    trustLevel: "BANK_CONFIRMED" | "OFFICER_VERIFIED" | "SUBMITTED";
    maturity: string;
  }>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const roles: {
    role: UserRole;
    title: string;
    dept: string;
    badge: string;
    desc: string;
  }[] = [
    {
      role: "SCRUTINY_OFFICER",
      title: "Scrutiny Officer (Desk 1)",
      dept: "AICTE Regulation Bureau",
      badge: "High Priority Desk",
      desc: "Performs OCR document extraction, validates lien clauses, and dispatches direct Bank Adapter verification.",
    },
    {
      role: "INSTITUTION_USER",
      title: "Technical Institution (IIT Delhi)",
      dept: "Applicant College",
      badge: "Pledgor",
      desc: "Submits new FDRs, uploads branch certificates, monitors automated renewal countdowns, and files release claims.",
    },
    {
      role: "SECTION_HEAD",
      title: "Section Head (Regulation)",
      dept: "Bureau Oversight",
      badge: "Supervisory",
      desc: "Reviews flagged discrepancies, approves reassignments, and manages regulatory compliance escalations.",
    },
    {
      role: "FINANCE_OFFICER",
      title: "Finance Officer (Accounts)",
      dept: "Finance & Budget Cell",
      badge: "4-Eye Segregation",
      desc: "Verifies financial claims, bank encashment clauses, and executes secondary release authorizations.",
    },
    {
      role: "COMPETENT_AUTHORITY",
      title: "Competent Authority (Director)",
      dept: "Executive Secretariat",
      badge: "Statutory Sign-off",
      desc: "Grants final statutory discharge and triggers automated lien cancellation notifications to issuing banks.",
    },
    {
      role: "AUDITOR",
      title: "Vigilance & External Auditor",
      dept: "Independent Oversight",
      badge: "SHA-256 Ledger",
      desc: "Inspects tamper-evident cryptographic hash chains and verifies end-to-end provenance integrity.",
    },
  ];

  const handleSelectRole = (role: UserRole) => {
    // Store selected role in localStorage for portal
    if (typeof window !== "undefined") {
      localStorage.setItem("zetsu_active_role", role);
    }
    onClose();
    router.push("/portal");
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setLookupResult({
        id: lookupQuery.toUpperCase(),
        aicteId: "AICTE-DEL-ENG-2024-9182",
        college: "Indian Institute of Technology Delhi (Campus Extension)",
        bank: "State Bank of India (SBI New Delhi Main)",
        amount: "₹ 50,00,000",
        lienStatus: "JOINT_LIEN_CONFIRMED_TO_AICTE",
        trustLevel: "BANK_CONFIRMED",
        maturity: "2029-06-30",
      });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#FAF9F5] border border-stone-200/90 rounded-2xl shadow-2xl z-10 overflow-hidden my-6">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-stone-200/70">
          <div className="flex items-center space-x-3">
            <Emblem size={28} className="text-stone-800" />
            <div>
              <p className="font-script text-xl text-stone-700 leading-none">regulation bureau · aicte</p>
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold mt-0.5">
                Zetsu Regulatory Access & Provenance Desk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200/70 bg-stone-100/50 px-6 sm:px-8 text-xs font-medium uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === "roles"
                ? "border-amber-600 text-stone-900 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            1. Select Demonstration Role
          </button>
          <button
            onClick={() => setActiveTab("lookup")}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === "lookup"
                ? "border-amber-600 text-stone-900 font-semibold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            2. Public FDR Provenance Lookup
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
          {activeTab === "roles" ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-2xl text-stone-900 font-normal">
                  Launch Portal Workspace
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Experience segregation of duties across regulatory scrutiny, institutional filing, financial audit, and statutory approval:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {roles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSelectRole(item.role)}
                    className="text-left p-4 rounded-xl border border-stone-200/90 bg-white/80 hover:border-amber-400 hover:bg-white hover:shadow-xs transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          {item.badge}
                        </span>
                        <ArrowRight size={14} className="text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="font-medium text-stone-900 text-sm">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-stone-500 mb-2">
                        {item.dept}
                      </div>
                      <div className="text-xs text-stone-600 leading-relaxed font-sans line-clamp-2">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-stone-200/60 text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-600" /> Tamper-evident 3-tier provenance simulation
                </span>
                <span className="text-[11px] text-stone-400">SIH 26265</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-stone-900 font-normal">
                  Verify FDR Provenance
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Query any institutional FDR reference number, UTR, or AICTE Institution ID against the cryptographic registry:
                </p>
              </div>

              <form onSubmit={handleLookup} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="Enter FDR No. (e.g. FDR-SBI-2024-8841 or AICTE-1-928)"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 font-medium px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Search size={16} /> Verify
                </button>
              </form>

              {isSearching && (
                <div className="py-8 text-center text-xs text-stone-500 space-y-2">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Interrogating Bank Adapter API & SHA-256 Ledger...</p>
                </div>
              )}

              {lookupResult && !isSearching && (
                <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div>
                      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Instrument Verification Result
                      </div>
                      <div className="font-mono text-base font-semibold text-stone-900">
                        {lookupResult.id}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      🟢 BANK_CONFIRMED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block">Institution</span>
                      <strong className="text-stone-800 font-medium">{lookupResult.college}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Issuing Bank</span>
                      <strong className="text-stone-800 font-medium">{lookupResult.bank}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Pledged Amount</span>
                      <strong className="text-stone-800 font-medium">{lookupResult.amount}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Maturity Date</span>
                      <strong className="text-stone-800 font-medium">{lookupResult.maturity}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 border border-stone-200/60 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      Lien marked jointly in favor of AICTE
                    </span>
                    <button
                      onClick={() => handleSelectRole("SCRUTINY_OFFICER")}
                      className="text-amber-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Inspect in Scrutiny Desk <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
