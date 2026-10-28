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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl w-full max-w-6xl max-h-[92vh] h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Workspace Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200/80 flex items-start sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  Case Workspace: {instrument.reference_number}
                </h2>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={instrument.status} />
                  <TrustBadge trust={instrument.overall_trust} />
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {instrument.institution?.name || "Institution ID: " + instrument.institution_id} • AICTE Reference: {instrument.institution?.aicte_id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Split Screen Workspace Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 overflow-y-auto lg:overflow-hidden">
          {/* LEFT PANEL: Document Viewer & OCR Extraction (Col 5) */}
          <div className="lg:col-span-5 p-5 bg-stone-100/60 flex flex-col gap-4 overflow-y-auto min-h-0 h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Uploaded FDR Document
              </h3>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                OCR Confidence: 94%
              </span>
            </div>

            {/* Simulated FDR Certificate Visual Document */}
            <div className="bg-[#FAF9F5] border-2 border-dashed border-amber-300/80 rounded-2xl p-5 shadow-xs text-stone-900 relative font-serif">
              <div className="text-center border-b border-amber-200 pb-3 mb-3">
                <div className="text-xs tracking-widest text-amber-800 font-sans font-bold uppercase">
                  {instrument.bank?.name || "State Bank of India"}
                </div>
                <div className="text-sm font-bold mt-0.5">
                  FIXED DEPOSIT RECEIPT / TERM DEPOSIT
                </div>
                <div className="text-[10px] text-stone-500 font-sans">
                  Branch: {instrument.branch_name || "Main Campus Branch"}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-stone-500 font-sans">Receipt No:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {instrument.reference_number}
                  </span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-stone-500 font-sans">Pledged In Favour Of:</span>
                  <span className="font-bold">Member Secretary, AICTE New Delhi</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-stone-500 font-sans">Principal Amount:</span>
                  <Currency amount={instrument.amount} className="text-emerald-700 font-bold" />
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-stone-500 font-sans">Issue Date:</span>
                  <span className="font-mono">{instrument.issue_date}</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-stone-500 font-sans">Maturity Date:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {instrument.maturity_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-sans">Lien Endorsement:</span>
                  <span className="font-bold text-blue-700 font-sans">
                    {instrument.lien_marked ? "MARKED IN FAVOUR OF AICTE" : "NOT MARKED"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200 text-[10px] text-stone-500 font-sans flex justify-between items-center">
                <span>Cryptographic SHA-256 Verified</span>
                <span className="font-mono font-bold">8f92c...e41b</span>
              </div>
            </div>

            {/* Discrepancy Flags on Document */}
            {openDiscrepancies.length > 0 && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {openDiscrepancies.length} Open Discrepancy Flag(s)
                </div>
                <div className="space-y-2">
                  {openDiscrepancies.map((d) => (
                    <div
                      key={d.id}
                      className="text-xs bg-white p-3 rounded-xl border border-rose-100 shadow-2xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-rose-700">
                          {d.rule_code}
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
                          {d.severity}
                        </span>
                      </div>
                      <p className="text-stone-800 text-[11px]">
                        {d.message}
                      </p>

                      {resolvingId === d.id ? (
                        <div className="mt-2 space-y-2 pt-2 border-t border-stone-100">
                          <input
                            type="text"
                            placeholder="Resolution rationale note..."
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveDiscrepancy(d.id)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold cursor-pointer"
                            >
                              Confirm Resolution
                            </button>
                            <button
                              onClick={() => setResolvingId(null)}
                              className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-full text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(d.id)}
                          className="self-start text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
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
          <div className="lg:col-span-7 p-6 bg-white flex flex-col gap-6 overflow-y-auto min-h-0 h-full">
            {/* Section 1: Field-Level Trust Checklist */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Field Scrutiny &amp; Trust Verification
                </h3>
                <span className="text-xs text-stone-400 font-sans">
                  Confirm document matches recorded data
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Field 1 */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] text-stone-500">FDR Reference</span>
                    <div className="font-semibold text-stone-900">
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
                    <span className="text-[11px] font-medium text-stone-700">
                      Matches
                    </span>
                  </label>
                </div>

                {/* Field 2 */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] text-stone-500">Amount (INR)</span>
                    <div className="font-semibold text-stone-900">
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
                    <span className="text-[11px] font-medium text-stone-700">
                      Matches
                    </span>
                  </label>
                </div>

                {/* Field 3 */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] text-stone-500">Maturity Date</span>
                    <div className="font-semibold text-stone-900">
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
                    <span className="text-[11px] font-medium text-stone-700">
                      Matches
                    </span>
                  </label>
                </div>

                {/* Field 4 */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[11px] text-stone-500">Lien Endorsement</span>
                    <div className="font-semibold text-stone-900">
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
                    <span className="text-[11px] font-medium text-stone-700">
                      Matches
                    </span>
                  </label>
                </div>
              </div>

              {/* Scrutiny Observation input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700">
                  Officer Observation / Scrutiny Remarks
                </label>
                <textarea
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  placeholder="Record formal observation note on document integrity and AICTE compliance..."
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-stone-800 focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400"
                  rows={2}
                />
                <button
                  onClick={handleOfficerVerify}
                  disabled={isSubmittingOfficer}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  {isSubmittingOfficer ? "Recording..." : "Record Officer Verification & Upgrade Trust"}
                </button>
              </div>
            </div>

            <div className="h-px bg-stone-200"></div>

            {/* Section 2: Bank Verification Adapter Integration */}
            <div className="bg-[#FEF3C7]/40 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4 shrink-0">
              {/* Header: Title + Gateway Badge */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      Automated Bank Verification Adapter
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Simulate Direct Bank CBS / SFMS API Confirmation
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/60 shrink-0">
                  Direct API Gateway
                </span>
              </div>

              {/* Action Controls: Scenario Selector & Trigger Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-0.5">
                <div className="relative flex-1 min-w-0">
                  <select
                    value={bankScenario}
                    onChange={(e) => setBankScenario(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-stone-300 rounded-xl text-stone-800 shadow-2xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden pr-8 truncate cursor-pointer"
                  >
                    <option value="MATCH">Scenario: Full Match (Happy Path)</option>
                    <option value="MISMATCH">Scenario: Amount Mismatch (Discrepancy)</option>
                    <option value="NOT_FOUND">Scenario: Not Found in Bank CBS</option>
                    <option value="TIMEOUT">Scenario: Bank Gateway Timeout</option>
                  </select>
                </div>
                <button
                  onClick={handleBankVerify}
                  disabled={isVerifyingBank}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all shrink-0 whitespace-nowrap active:scale-[0.98]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingBank ? "animate-spin" : ""}`} />
                  <span>{isVerifyingBank ? "Calling Bank..." : "Trigger Bank Check"}</span>
                </button>
              </div>

              {bankResult && (
                <div className="mt-2 text-xs bg-white p-3.5 rounded-xl border border-amber-200 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans font-medium">Response Status:</span>
                    <span className={`font-bold ${bankResult.result === "MATCH" ? "text-emerald-700" : "text-rose-700"}`}>
                      {bankResult.result}
                    </span>
                  </div>
                  {bankResult.response_payload && (
                    <pre className="text-[10px] text-stone-700 overflow-x-auto p-2 bg-stone-50 rounded-lg">
                      {JSON.stringify(bankResult.response_payload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: State Machine Transitions */}
            <div className="space-y-2 pt-2 pb-8 shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Authorized State Transitions
              </h4>
              <div className="flex flex-wrap gap-2">
                {instrument.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleTransition("UNDER_SCRUTINY", "Officer initiated formal scrutiny")}
                    className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs rounded-full font-medium cursor-pointer shadow-2xs"
                  >
                    Take Up for Scrutiny
                  </button>
                )}
                {instrument.status === "UNDER_SCRUTINY" && (
                  <>
                    <button
                      onClick={() => handleTransition("VERIFIED", "Scrutiny completed successfully")}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-full font-medium cursor-pointer shadow-2xs"
                    >
                      Mark as Verified
                    </button>
                    <button
                      onClick={() => handleTransition("RESUBMISSION_REQUIRED", "Discrepancy notice sent to institution")}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs rounded-full font-medium cursor-pointer shadow-2xs"
                    >
                      Request Resubmission
                    </button>
                  </>
                )}
                {instrument.status === "VERIFIED" && (
                  <button
                    onClick={() => handleTransition("ACTIVE", "Accepted as valid security deposit pledge")}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-full font-medium cursor-pointer shadow-2xs"
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
