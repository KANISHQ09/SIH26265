import React from "react";
import { InstrumentStatus } from "@/types";
import { 
  CheckCircle2, Clock, AlertTriangle, XCircle, RotateCcw, 
  FileCheck, ShieldAlert, FileText, ArrowRightCircle 
} from "lucide-react";

interface Props {
  status: InstrumentStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const configs: Record<
    InstrumentStatus,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    DRAFT: {
      label: "Draft",
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      icon: FileText,
    },
    SUBMITTED: {
      label: "Submitted",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-300",
      icon: Clock,
    },
    UNDER_SCRUTINY: {
      label: "Under Scrutiny",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-300",
      icon: FileCheck,
    },
    DISCREPANCY_FLAGGED: {
      label: "Discrepancy Flagged",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-300",
      icon: AlertTriangle,
    },
    RESUBMISSION_REQUIRED: {
      label: "Resubmission Required",
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-300",
      icon: RotateCcw,
    },
    VERIFIED: {
      label: "Verified",
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-300",
      icon: CheckCircle2,
    },
    ACTIVE: {
      label: "Active Valid",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-300",
      icon: CheckCircle2,
    },
    EXPIRING: {
      label: "Expiring Soon",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-300",
      icon: AlertTriangle,
    },
    RENEWAL_PENDING: {
      label: "Renewal Pending",
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      border: "border-yellow-400",
      icon: Clock,
    },
    OVERDUE: {
      label: "Overdue Critical",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-400",
      icon: ShieldAlert,
    },
    MATURED: {
      label: "Matured",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-300",
      icon: Clock,
    },
    RENEWED: {
      label: "Renewed",
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-300",
      icon: ArrowRightCircle,
    },
    RELEASE_REQUESTED: {
      label: "Release Requested",
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-300",
      icon: Clock,
    },
    RELEASE_UNDER_REVIEW: {
      label: "Release In Review",
      bg: "bg-violet-100",
      text: "text-violet-800",
      border: "border-violet-400",
      icon: FileCheck,
    },
    RELEASE_APPROVED: {
      label: "Release Approved",
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      border: "border-emerald-400",
      icon: CheckCircle2,
    },
    RELEASE_REJECTED: {
      label: "Release Rejected",
      bg: "bg-rose-100",
      text: "text-rose-800",
      border: "border-rose-400",
      icon: XCircle,
    },
    RELEASED: {
      label: "Discharged / Released",
      bg: "bg-slate-200",
      text: "text-slate-800",
      border: "border-slate-400",
      icon: CheckCircle2,
    },
  };

  const cfg = configs[status] || configs.DRAFT;
  const IconComponent = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
};
