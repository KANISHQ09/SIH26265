"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, UserRole } from "@/types";
import { Logo } from "@/components/Logo";
import { 
  Building2, Shield, Calendar, FastForward, RotateCcw, 
  UserCheck, ShieldAlert, Sparkles, Check, Clock
} from "lucide-react";

interface HeaderProps {
  currentUser: User | null;
  currentRole: UserRole;
  systemDate: string;
  onRoleChange: (role: UserRole, email: string) => void;
  onTimeTravel: (days: number) => void;
  onResetTime: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  systemDate,
  onRoleChange,
  onTimeTravel,
  onResetTime,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roleOptions: { role: UserRole; title: string; email: string; desc: string }[] = [
    {
      role: "SCRUTINY_OFFICER",
      title: "Scrutiny Officer (Desk 1)",
      email: "scrutiny@aicte-india.org",
      desc: "Reviews documents, runs bank checks & flags discrepancies",
    },
    {
      role: "SECTION_HEAD",
      title: "Section Head (Regulation)",
      email: "sectionhead@aicte-india.org",
      desc: "Handles escalations, reassignments & scrutiny oversight",
    },
    {
      role: "FINANCE_OFFICER",
      title: "Finance Officer (Accounts)",
      email: "finance@aicte-india.org",
      desc: "Verifies financial claims & release request conditions",
    },
    {
      role: "COMPETENT_AUTHORITY",
      title: "Competent Authority (Director)",
      email: "director@aicte-india.org",
      desc: "Final statutory approval for security deposit release",
    },
    {
      role: "AUDITOR",
      title: "Vigilance & External Auditor",
      email: "auditor@aicte-india.org",
      desc: "Read-only access + cryptographic hash-chain verification",
    },
    {
      role: "INSTITUTION_USER",
      title: "Institution User (IIT Delhi)",
      email: "institution@iitdelhi.ac.in",
      desc: "Submits FDRs, uploads scans, tracks renewals & requests release",
    },
    {
      role: "ADMIN",
      title: "Super Administrator",
      email: "admin@aicte-india.org",
      desc: "Master rules, system settings & simulation controls",
    },
  ];

  const formattedDate = systemDate
    ? new Date(systemDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Live System";

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/60 shadow-2xs transition-all">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Top bar on mobile: Brand on Left, Role Switcher on Right */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Brand - Click to Return to Landing Page */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer"
            title="← Back to Landing Page"
          >
            <Logo size={36} />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">
                  Zetsu
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#FEF3C7] text-amber-950 border border-amber-300/60 px-2 py-0.5 rounded-full whitespace-nowrap font-sans">
                  FDR Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1 font-sans">
                Security Deposit Lifecycle &amp; Compliance Gateway
              </p>
            </div>
          </Link>

          {/* Role Switcher Button (Mobile view inside top bar) */}
          <div className="relative md:hidden shrink-0">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all shadow-2xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
              <span className="font-bold text-[11px] truncate max-w-[100px]">
                {currentRole.replace("_", " ")}
              </span>
              <UserCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Center: Live Time-Travel Demonstration Widget */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-stone-100/80 px-2.5 sm:px-3 py-1.5 rounded-full border border-stone-200/80 text-xs overflow-x-auto w-full md:w-auto shadow-2xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-stone-500 font-medium uppercase leading-none">
                System Clock
              </span>
              <span className="font-semibold font-mono text-[11px] sm:text-xs text-stone-900 whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-stone-300 mx-1 shrink-0"></div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-stone-500 hidden lg:inline mr-1">
              Fast-Forward:
            </span>
            <button
              onClick={() => onTimeTravel(15)}
              className="px-2 py-0.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-full text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 15 days (Trigger 15-day reminder)"
            >
              +15d
            </button>
            <button
              onClick={() => onTimeTravel(30)}
              className="px-2 py-0.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-full text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 30 days (Trigger 30-day reminder)"
            >
              +30d
            </button>
            <button
              onClick={() => onTimeTravel(60)}
              className="px-2 py-0.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-full text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 60 days (Trigger 60-day reminder)"
            >
              +60d
            </button>
            <button
              onClick={() => onTimeTravel(90)}
              className="px-2 py-0.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-full text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 90 days (Move ACTIVE to EXPIRING)"
            >
              +90d
            </button>
            <button
              onClick={onResetTime}
              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 rounded-full transition-colors cursor-pointer"
              title="Reset to Actual Live Date"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right side: Active Role Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Right: Active Role Switcher (Desktop view) */}
          <div className="relative hidden md:block shrink-0">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-2xs cursor-pointer transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
              <div className="text-left">
                <div className="text-[10px] text-stone-500 leading-none font-medium">Acting Role</div>
                <div className="font-bold text-stone-900">
                  {currentRole.replace("_", " ")}
                </div>
              </div>
              <UserCheck className="w-4 h-4 ml-1 text-stone-400 shrink-0" />
            </button>

            {/* Role Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50">
                <div className="px-3 py-2 border-b border-stone-100 text-xs font-semibold text-stone-500">
                  Switch Perspective (System Roles)
                </div>
                <div className="py-1 max-h-80 overflow-y-auto space-y-1">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.role}
                      onClick={() => {
                        onRoleChange(opt.role, opt.email);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start gap-2.5 transition-colors cursor-pointer ${
                        currentRole === opt.role
                          ? "bg-[#FEF3C7] text-amber-950 font-semibold border border-amber-200/80"
                          : "hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {currentRole === opt.role ? (
                          <Check className="w-4 h-4 text-amber-800" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-stone-900">{opt.title}</div>
                        <div className="text-[11px] text-stone-500">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Dropdown Menu for Mobile */}
        {showRoleMenu && (
          <div className="md:hidden fixed inset-x-4 top-24 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 z-50 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 text-xs font-bold text-stone-800">
              <span>Switch Active System Role</span>
              <button 
                onClick={() => setShowRoleMenu(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              {roleOptions.map((opt) => (
                <button
                  key={opt.role}
                  onClick={() => {
                    onRoleChange(opt.role, opt.email);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start gap-2.5 transition-colors cursor-pointer ${
                    currentRole === opt.role
                      ? "bg-[#FEF3C7] text-amber-950 font-semibold border border-amber-200/80"
                      : "hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {currentRole === opt.role ? (
                      <Check className="w-4 h-4 text-amber-800" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">{opt.title}</div>
                    <div className="text-[11px] text-stone-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
