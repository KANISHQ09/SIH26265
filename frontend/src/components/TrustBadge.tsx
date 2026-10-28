import React from "react";
import { TrustLevel } from "@/types";
import { ShieldCheck, UserCheck, Clock } from "lucide-react";

interface Props {
  trust: TrustLevel;
  size?: "sm" | "md";
}

export const TrustBadge: React.FC<Props> = ({ trust, size = "md" }) => {
  if (trust === "BANK_CONFIRMED") {
    return (
      <span
        title="Verified directly with Issuing Bank Core Banking System (CBS/SFMS)"
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs ${
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
        Bank-Confirmed
      </span>
    );
  }

  if (trust === "OFFICER_VERIFIED") {
    return (
      <span
        title="Scrutinized and verified by AICTE Officer against uploaded FDR document"
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FEF3C7] text-amber-950 border border-amber-300 shadow-2xs ${
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
        }`}
      >
        <UserCheck className="w-3.5 h-3.5 text-amber-800" />
        Officer-Verified
      </span>
    );
  }

  return (
    <span
      title="Entered by institution or extracted by OCR. Pending official verification."
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-300 shadow-2xs ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
      }`}
    >
      <Clock className="w-3.5 h-3.5 text-stone-500" />
      Submitted
    </span>
  );
};
