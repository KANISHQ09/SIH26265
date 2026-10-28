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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-lg shrink-0">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Release & Refund Statutory Review
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Segregation of Duties Multi-Stage Approval Workflow
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Reason & Status */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Request Type:</span>
              <span className="font-bold text-purple-600 font-mono">
                {releaseRequest.request_type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Overall Status:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {releaseRequest.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Institution Justification:</span>
              <p className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {releaseRequest.reason}
              </p>
            </div>
          </div>

          {/* Automated Eligibility Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Automated Statutory Eligibility Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Trust Provenance</div>
                  <div className="text-[11px] text-slate-400">Verified by Bank / Officer</div>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Zero Discrepancies</div>
                  <div className="text-[11px] text-slate-400">No high severity flags</div>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Regulation Maturity</div>
                  <div className="text-[11px] text-slate-400">5-Year cycle completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sequential 3-Step Approval Ladder */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isPassed
                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                        : isRejected
                        ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        {step.step_order}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          Step {step.step_order}: {step.required_role.replace("_", " ")}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {step.note || "Awaiting statutory review..."}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isPassed && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                          <XCircle className="w-4 h-4" /> Rejected
                        </span>
                      )}
                      {isCurrent && (
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          <Clock className="w-4 h-4" /> Pending Action
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
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Action Required by {activeStep?.required_role.replace("_", " ")}
              </div>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Enter mandatory decision note and regulatory justification..."
                className="w-full text-xs p-2.5 border border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("APPROVED")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Step #{activeStep?.step_order}
                </button>
                <button
                  onClick={() => handleAction("REJECTED")}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
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
