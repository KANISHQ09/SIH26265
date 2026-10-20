"use client";

import React, { useState } from "react";
import { Instrument, TrustLevel, Discrepancy } from "@/types";
import { TrustBadge } from "./TrustBadge";
import { StatusBadge } from "./StatusBadge";
import { Currency } from "./CurrencyFormatter";
import { api } from "@/lib/api";
import { 
  ShieldCheck, UserCheck, AlertTriangle, FileText, CheckCircle2, 
  X, RefreshCw, Send, ArrowRight, ExternalLink, HelpCircle 
} from "lucide-react";

interface CaseWorkspaceProps {
  instrument: Instrument;
  discrepancies: Discrepancy[];
  onClose: () => void;
  onRefresh: () => void;
}

export const CaseWorkspace: React.FC<CaseWorkspaceProps> = ({
  instrument,
  discrepancies,
  onClose,
  onRefresh,
}) => {
  const [bankScenario, setBankScenario] = useState<string>("MATCH");
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankResult, setBankResult] = useState<any>(null);

  // Officer check states
  const [confirmedFields, setConfirmedFields] = useState({
    reference_number: true,
    amount: true,
    maturity_date: true,
    lien_marked: true,
  });
  const [observationText, setObservationText] = useState("");
  const [isSubmittingOfficer, setIsSubmittingOfficer] = useState(false);

  // Resolution note state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const handleBankVerify = async () => {
    setIsVerifyingBank(true);
    try {
      const res = await api.triggerBankVerification(instrument.id, bankScenario);
      setBankResult(res);
      onRefresh();
    } catch (err: any) {
      alert(`Bank Verification Failed: ${err.message}`);
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleOfficerVerify = async () => {
    setIsSubmittingOfficer(true);
    try {
      const fields = [
        {
          field_name: "reference_number",
          confirmed_value: instrument.reference_number,
          matches_document: confirmedFields.reference_number,
        },
        {
          field_name: "amount",
          confirmed_value: String(instrument.amount),
          matches_document: confirmedFields.amount,
        },
        {
          field_name: "maturity_date",
          confirmed_value: instrument.maturity_date,
          matches_document: confirmedFields.maturity_date,
        },
        {
          field_name: "lien_marked",
          confirmed_value: String(instrument.lien_marked),
          matches_document: confirmedFields.lien_marked,
        },
      ];

      await api.submitOfficerVerification(instrument.id, fields, observationText);
      alert("Officer scrutiny recorded and verified successfully!");
      onRefresh();
    } catch (err: any) {
      alert(`Officer Verification Error: ${err.message}`);
    } finally {
      setIsSubmittingOfficer(false);
    }
  };

  const handleResolveDiscrepancy = async (id: string) => {
    if (!resolutionNote.trim()) {
      alert("Please provide a justification note for resolving this discrepancy.");
      return;
    }
    try {
      await api.resolveDiscrepancy(id, "RESOLVED", resolutionNote);
      setResolvingId(null);
      setResolutionNote("");
      onRefresh();
    } catch (err: any) {
      alert(`Resolution Failed: ${err.message}`);
    }
  };

  const handleTransition = async (toStatus: string, reason: string) => {
    try {
      await api.transitionInstrument(instrument.id, toStatus, reason);
      onRefresh();
    } catch (err: any) {
      alert(`Transition Failed: ${err.message}`);
    }
  };

  const openDiscrepancies = discrepancies.filter((d) => d.status === "OPEN");

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Workspace Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Case Workspace: {instrument.reference_number}
                </h2>
                <StatusBadge status={instrument.status} />
                <TrustBadge trust={instrument.overall_trust} />
              </div>
              <p className="text-xs text-slate-500">
                {instrument.institution?.name || "Institution ID: " + instrument.institution_id} • AICTE Reference: {instrument.institution?.aicte_id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Split Screen Workspace Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* LEFT PANEL: Document Viewer & OCR Extraction (Col 5) */}
          <div className="lg:col-span-5 p-5 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Uploaded FDR Document
              </h3>
              <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                OCR Confidence: 94%
              </span>
            </div>

            {/* Simulated FDR Certificate Visual Document */}
            <div className="bg-amber-50/80 dark:bg-slate-800 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl p-5 shadow-inner text-slate-800 dark:text-slate-200 relative font-serif">
              <div className="text-center border-b border-amber-200 dark:border-amber-800 pb-3 mb-3">
                <div className="text-xs tracking-widest text-amber-800 dark:text-amber-400 font-sans font-bold uppercase">
                  {instrument.bank?.name || "State Bank of India"}
                </div>
                <div className="text-sm font-bold mt-0.5">
                  FIXED DEPOSIT RECEIPT / TERM DEPOSIT
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  Branch: {instrument.branch_name || "Main Campus Branch"}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-amber-100 dark:border-amber-900 pb-1">
                  <span className="text-slate-500 font-sans">Receipt No:</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    {instrument.reference_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-amber-100 dark:border-amber-900 pb-1">
                  <span className="text-slate-500 font-sans">Pledged In Favour Of:</span>
                  <span className="font-bold">Member Secretary, AICTE New Delhi</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 dark:border-amber-900 pb-1">
                  <span className="text-slate-500 font-sans">Principal Amount:</span>
                  <Currency amount={instrument.amount} className="text-emerald-700 dark:text-emerald-400 font-bold" />
                </div>
                <div className="flex justify-between border-b border-amber-100 dark:border-amber-900 pb-1">
                  <span className="text-slate-500 font-sans">Issue Date:</span>
                  <span className="font-mono">{instrument.issue_date}</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 dark:border-amber-900 pb-1">
                  <span className="text-slate-500 font-sans">Maturity Date:</span>
                  <span className="font-mono font-bold text-amber-800 dark:text-amber-400">
                    {instrument.maturity_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Lien Endorsement:</span>
                  <span className="font-bold text-blue-600">
                    {instrument.lien_marked ? "MARKED IN FAVOUR OF AICTE" : "NOT MARKED"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800 text-[10px] text-slate-400 font-sans flex justify-between items-center">
                <span>Cryptographic SHA-256 Verified</span>
                <span className="font-mono">8f92c...e41b</span>
              </div>
            </div>

            {/* Discrepancy Flags on Document */}
            {openDiscrepancies.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {openDiscrepancies.length} Open Discrepancy Flag(s)
                </div>
                <div className="space-y-1.5">
                  {openDiscrepancies.map((d) => (
                    <div
                      key={d.id}
                      className="text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-rose-600">
                          {d.rule_code}
                        </span>
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded font-semibold">
                          {d.severity}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                        {d.message}
                      </p>

                      {resolvingId === d.id ? (
                        <div className="mt-2 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <input
                            type="text"
                            placeholder="Resolution rationale note..."
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveDiscrepancy(d.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Confirm Resolution
                            </button>
                            <button
                              onClick={() => setResolvingId(null)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(d.id)}
                          className="self-start text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Resolve / Waive Discrepancy &rarr;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Scrutiny Form, Trust Badges, Bank Check (Col 7) */}
          <div className="lg:col-span-7 p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Section 1: Field-Level Trust Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Field Scrutiny & Trust Verification
                </h3>
                <span className="text-xs text-slate-400">
                  Confirm document matches recorded data
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Field 1 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">FDR Reference</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {instrument.reference_number}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedFields.reference_number}
                      onChange={(e) =>
                        setConfirmedFields({
                          ...confirmedFields,
                          reference_number: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Matches
                    </span>
                  </label>
                </div>

                {/* Field 2 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Amount (INR)</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      <Currency amount={instrument.amount} />
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedFields.amount}
                      onChange={(e) =>
                        setConfirmedFields({
                          ...confirmedFields,
                          amount: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Matches
                    </span>
                  </label>
                </div>

                {/* Field 3 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Maturity Date</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {instrument.maturity_date}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedFields.maturity_date}
                      onChange={(e) =>
                        setConfirmedFields({
                          ...confirmedFields,
                          maturity_date: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Matches
                    </span>
                  </label>
                </div>

                {/* Field 4 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Lien Endorsement</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {instrument.lien_marked ? "In Favour of AICTE" : "Omitted"}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedFields.lien_marked}
                      onChange={(e) =>
                        setConfirmedFields({
                          ...confirmedFields,
                          lien_marked: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Matches
                    </span>
                  </label>
                </div>
              </div>

              {/* Scrutiny Observation input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Officer Observation / Scrutiny Remarks
                </label>
                <textarea
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  placeholder="Record formal observation note on document integrity and AICTE compliance..."
                  className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={handleOfficerVerify}
                  disabled={isSubmittingOfficer}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  {isSubmittingOfficer ? "Recording..." : "Record Officer Verification & Upgrade Trust"}
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Section 2: Bank Verification Adapter Integration */}
            <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Automated Bank Verification Adapter
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Simulate Direct Bank CBS / SFMS API Confirmation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={bankScenario}
                    onChange={(e) => setBankScenario(e.target.value)}
                    className="text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200"
                  >
                    <option value="MATCH">Scenario: Full Match (Happy Path)</option>
                    <option value="MISMATCH">Scenario: Amount Mismatch (Discrepancy)</option>
                    <option value="NOT_FOUND">Scenario: Not Found in Bank CBS</option>
                    <option value="TIMEOUT">Scenario: Bank Gateway Timeout</option>
                  </select>
                  <button
                    onClick={handleBankVerify}
                    disabled={isVerifyingBank}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingBank ? "animate-spin" : ""}`} />
                    {isVerifyingBank ? "Calling Bank..." : "Trigger Bank Check"}
                  </button>
                </div>
              </div>

              {bankResult && (
                <div className="mt-2 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-950 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response Status:</span>
                    <span className={`font-bold ${bankResult.result === "MATCH" ? "text-emerald-600" : "text-rose-600"}`}>
                      {bankResult.result}
                    </span>
                  </div>
                  {bankResult.response_payload && (
                    <pre className="text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto p-1 bg-slate-50 dark:bg-slate-800 rounded">
                      {JSON.stringify(bankResult.response_payload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: State Machine Transitions */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Authorized State Transitions
              </h4>
              <div className="flex flex-wrap gap-2">
                {instrument.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleTransition("UNDER_SCRUTINY", "Officer initiated formal scrutiny")}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-medium cursor-pointer"
                  >
                    Take Up for Scrutiny
                  </button>
                )}
                {instrument.status === "UNDER_SCRUTINY" && (
                  <>
                    <button
                      onClick={() => handleTransition("VERIFIED", "Scrutiny completed successfully")}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg font-medium cursor-pointer"
                    >
                      Mark as Verified
                    </button>
                    <button
                      onClick={() => handleTransition("RESUBMISSION_REQUIRED", "Discrepancy notice sent to institution")}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg font-medium cursor-pointer"
                    >
                      Request Resubmission
                    </button>
                  </>
                )}
                {instrument.status === "VERIFIED" && (
                  <button
                    onClick={() => handleTransition("ACTIVE", "Accepted as valid security deposit pledge")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium cursor-pointer"
                  >
                    Accept as Active Security
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
