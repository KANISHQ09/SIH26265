"use client";

import React, { useState } from "react";
import { ReleaseRequest, UserRole } from "@/types";
import { api } from "@/lib/api";
import { 
  CheckCircle2, XCircle, Clock, ShieldCheck, FileCheck, X, AlertTriangle, ArrowRight 
} from "lucide-react";

interface ReleaseWorkflowModalProps {
  releaseRequest: ReleaseRequest;
  currentRole: UserRole;
  onClose: () => void;
  onRefresh: () => void;
}

export const ReleaseWorkflowModal: React.FC<ReleaseWorkflowModalProps> = ({
  releaseRequest,
  currentRole,
  onClose,
  onRefresh,
}) => {
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checklist = releaseRequest.checklist_json || {};

  const handleAction = async (decision: "APPROVED" | "REJECTED") => {
    if (!decisionNote.trim()) {
      alert("Please provide a decision note.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.takeApprovalAction(releaseRequest.id, decision, decisionNote);
      alert(`Step ${decision.toLowerCase()} successfully!`);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(`Action Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = releaseRequest.approval_steps || [];
  const activeStep = steps.find((s) => s.decision === "PENDING");

  const canActOnStep =
    activeStep &&
    (activeStep.required_role === currentRole || currentRole === "ADMIN");

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Release &amp; Refund Statutory Review
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 font-sans">
                Segregation of Duties Multi-Stage Approval Workflow
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Reason & Status */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Request Type:</span>
              <span className="font-bold text-amber-900 font-mono">
                {releaseRequest.request_type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Overall Status:</span>
              <span className="font-bold text-stone-800">
                {releaseRequest.status}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block mb-1">Institution Justification:</span>
              <p className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-800 font-sans">
                {releaseRequest.reason}
              </p>
            </div>
          </div>

          {/* Automated Eligibility Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Automated Statutory Eligibility Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3.5 rounded-2xl border border-stone-200 flex items-start gap-2 bg-white shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-800">Trust Provenance</div>
                  <div className="text-[11px] text-stone-500">Verified by Bank / Officer</div>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-stone-200 flex items-start gap-2 bg-white shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-800">Zero Discrepancies</div>
                  <div className="text-[11px] text-stone-500">No high severity flags</div>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-stone-200 flex items-start gap-2 bg-white shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-stone-800">Regulation Maturity</div>
                  <div className="text-[11px] text-stone-500">5-Year cycle completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sequential 3-Step Approval Ladder */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Segregation of Duties Approval Ladder
            </h4>
            <div className="space-y-2.5">
              {steps.map((step) => {
                const isPassed = step.decision === "APPROVED";
                const isRejected = step.decision === "REJECTED";
                const isCurrent = step.decision === "PENDING";

                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors shadow-2xs ${
                      isPassed
                        ? "bg-emerald-50/70 border-emerald-300"
                        : isRejected
                        ? "bg-rose-50/70 border-rose-300"
                        : "bg-white border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-stone-100 border border-stone-300 text-stone-800">
                        {step.step_order}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">
                          Step {step.step_order}: {step.required_role.replace("_", " ")}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {step.note || "Awaiting statutory review..."}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isPassed && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 font-semibold text-rose-800 bg-rose-100/70 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                      {isCurrent && (
                        <span className="flex items-center gap-1 font-semibold text-amber-950 bg-[#FEF3C7] border border-amber-300 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-700" /> Pending Action
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Box if current role can act on current step */}
          {canActOnStep && (
            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Action Required by {activeStep?.required_role.replace("_", " ")}
              </div>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Enter mandatory decision note and regulatory justification..."
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-stone-800 focus:ring-1 focus:ring-stone-400"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("APPROVED")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Step #{activeStep?.step_order}
                </button>
                <button
                  onClick={() => handleAction("REJECTED")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Step #{activeStep?.step_order}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
