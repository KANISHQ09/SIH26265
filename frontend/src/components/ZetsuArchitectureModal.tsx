"use client";

import React, { useState } from "react";
import { 
  X, ShieldCheck, Database, Layers, GitBranch, Clock, 
  CheckCircle2, AlertTriangle, ArrowRight, Lock, Eye, Building2 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ZetsuArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZetsuArchitectureModal: React.FC<ZetsuArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"provenance" | "release" | "discrepancy" | "simulation">("provenance");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#1c1917] text-stone-100 rounded-2xl shadow-2xl z-10 overflow-hidden my-6 border border-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-stone-900/80">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="font-serif text-lg text-stone-200">
              Zetsu Architecture & Regulatory Engine Walkthrough
            </h4>
            <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono">
              SIH 26265
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visual preview hero */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          <Image
            src="/zetsu_platform_preview.jpg"
            alt="Zetsu Regulatory Trust Dashboard"
            fill
            className="object-cover opacity-85 hover:scale-[1.01] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-stone-950/40" />

          {/* Quick interactive action over preview */}
          <div className="absolute bottom-6 inset-x-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold block">
                Live Regulatory Demonstration
              </span>
              <p className="font-serif text-lg sm:text-xl text-stone-100">
                Tamper-evident verification, automated lien checking & time-travel alerts
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                router.push("/portal");
              }}
              className="bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 font-semibold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all shadow-lg shrink-0"
            >
              Open Live Desk <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="p-6 bg-stone-900 border-t border-stone-800">
          <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-stone-800 pb-3 text-xs uppercase tracking-wider font-medium text-stone-400">
            <button
              onClick={() => setActiveTab("provenance")}
              className={`pb-1 ${activeTab === "provenance" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              1. Three-Tier Trust Provenance
            </button>
            <button
              onClick={() => setActiveTab("release")}
              className={`pb-1 ${activeTab === "release" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              2. 4-Eye Segregated Release
            </button>
            <button
              onClick={() => setActiveTab("discrepancy")}
              className={`pb-1 ${activeTab === "discrepancy" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              3. Intelligent Discrepancy Engine
            </button>
            <button
              onClick={() => setActiveTab("simulation")}
              className={`pb-1 ${activeTab === "simulation" ? "text-amber-400 border-b-2 border-amber-400 font-semibold" : "hover:text-stone-200"}`}
            >
              4. Time-Travel Simulation
            </button>
          </div>

          <div className="pt-4 text-xs sm:text-sm text-stone-300">
            {activeTab === "provenance" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-stone-800/80 border border-stone-700/60">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-700 text-stone-200 mb-2">
                      ⚪ SUBMITTED
                    </span>
                    <h5 className="font-semibold text-stone-200 text-xs mb-1">Applicant College Intake</h5>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Initial instrument values entered by institution or extracted via OCR from raw scans. Non-authoritative until verified.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/60">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
                      🟡 OFFICER_VERIFIED
                    </span>
                    <h5 className="font-semibold text-amber-200 text-xs mb-1">Regulation Scrutiny</h5>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Checked against physical or signed branch certificates by AICTE scrutiny officers. Every decision hash-linked.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2">
                      🟢 BANK_CONFIRMED
                    </span>
                    <h5 className="font-semibold text-emerald-200 text-xs mb-1">Direct Bank API Adapter</h5>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Direct machine-to-machine validation against scheduled banks (SBI, PNB, HDFC, Canara) verifying joint lien.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "release" && (
              <div className="space-y-3 text-xs text-stone-300">
                <div className="p-3 rounded-lg bg-stone-800/60 border border-stone-700/50 leading-relaxed">
                  <strong className="text-amber-400">Statutory 4-Stage Segregation of Duties:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-stone-700">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-semibold">Stage 1</span>
                      <strong className="text-stone-200">Institution Claim</strong>
                      <p className="text-[11px] text-stone-400 mt-0.5">Automated eligibility checklist validation</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-semibold">Stage 2</span>
                      <strong className="text-stone-200">Scrutiny Review</strong>
                      <p className="text-[11px] text-stone-400 mt-0.5">No encumbrance / closure confirmation</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-semibold">Stage 3</span>
                      <strong className="text-stone-200">Finance Audit</strong>
                      <p className="text-[11px] text-stone-400 mt-0.5">Account claims & dues reconciliation</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase block font-semibold">Stage 4</span>
                      <strong className="text-stone-200">Competent Authority</strong>
                      <p className="text-[11px] text-stone-400 mt-0.5">Final discharge & automated bank lien release</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "discrepancy" && (
              <div className="space-y-2 text-xs text-stone-300">
                <p className="text-stone-400">
                  The automated validation engine inspects 7 critical regulatory vectors upon upload and scrutiny:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="p-2.5 rounded bg-stone-800/80 border border-stone-700/50 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-200">Missing Joint Lien Clause</strong>
                      <p className="text-[11px] text-stone-400">Flags when the deposit does not explicitly pledge exclusive lien to AICTE.</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-stone-800/80 border border-stone-700/50 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-200">OCR vs Input Mismatch</strong>
                      <p className="text-[11px] text-stone-400">Detects discrepancies between scanned certificate amount and form entry.</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-stone-800/80 border border-stone-700/50 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-200">Insufficient Validity Period</strong>
                      <p className="text-[11px] text-stone-400">Flags FDRs created with less than the statutory 5 or 8-year lock-in requirement.</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-stone-800/80 border border-stone-700/50 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-200">Duplicate Hash / Certificate</strong>
                      <p className="text-[11px] text-stone-400">Prevents the same FDR document scan from being submitted across multiple campuses.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "simulation" && (
              <div className="space-y-3 text-xs text-stone-300">
                <p className="text-stone-400">
                  Built-in time acceleration controls allow evaluators and officers to jump system dates forward:
                </p>
                <div className="p-3 bg-stone-800/70 rounded-lg border border-stone-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-amber-400" />
                    <div>
                      <strong className="text-stone-200">Automated Notification Cadence</strong>
                      <p className="text-[11px] text-stone-400">Triggers multi-channel reminders at 90, 60, 30, 15, 7, and 1 days prior to maturity.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-stone-900 px-2.5 py-1 rounded text-amber-300 border border-stone-700">
                    Fast-forward +30d / +90d
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
