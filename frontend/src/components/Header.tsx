"use client";

import React, { useState } from "react";
import { User, UserRole } from "@/types";
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
    <header className="border-b border-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs dark:border-slate-800 sticky top-0 z-40 shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Top bar on mobile: Brand on Left, Role Switcher on Right */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg sm:text-xl tracking-tighter shrink-0">
              Z
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Zetsu
                </h1>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                  FDR Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Security Deposit Lifecycle & Compliance Gateway
              </p>
            </div>
          </div>

          {/* Role Switcher Button (Mobile view inside top bar) */}
          <div className="relative md:hidden shrink-0">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
              <span className="font-bold text-[11px] truncate max-w-[100px]">
                {currentRole.replace("_", " ")}
              </span>
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Center: Live Time-Travel Demonstration Widget */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-800/60 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto w-full md:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-medium uppercase leading-none">
                System Clock
              </span>
              <span className="font-semibold font-mono text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden lg:inline mr-1">
              Fast-Forward:
            </span>
            <button
              onClick={() => onTimeTravel(15)}
              className="px-1.5 sm:px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 15 days (Trigger 15-day reminder)"
            >
              +15d
            </button>
            <button
              onClick={() => onTimeTravel(30)}
              className="px-1.5 sm:px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 30 days (Trigger 30-day reminder)"
            >
              +30d
            </button>
            <button
              onClick={() => onTimeTravel(60)}
              className="px-1.5 sm:px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 60 days (Trigger 60-day reminder)"
            >
              +60d
            </button>
            <button
              onClick={() => onTimeTravel(90)}
              className="px-1.5 sm:px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
              title="Advance 90 days (Move ACTIVE to EXPIRING)"
            >
              +90d
            </button>
            <button
              onClick={onResetTime}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Reset to Actual Live Date"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Active Role Switcher (Desktop view) */}
        <div className="relative hidden md:block shrink-0">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium shadow-xs cursor-pointer transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
            <div className="text-left">
              <div className="text-[10px] text-slate-500 leading-none font-medium">Acting Role</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {currentRole.replace("_", " ")}
              </div>
            </div>
            <UserCheck className="w-4 h-4 ml-1 text-slate-400 shrink-0" />
          </button>

          {/* Role Dropdown Menu */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                    className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentRole === opt.role
                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {currentRole === opt.role ? (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{opt.title}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Dropdown Menu for Mobile */}
        {showRoleMenu && (
          <div className="md:hidden fixed inset-x-4 top-24 max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Switch Active System Role</span>
              <button 
                onClick={() => setShowRoleMenu(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
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
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {currentRole === opt.role ? (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{opt.title}</div>
                    <div className="text-[11px] text-slate-400">{opt.desc}</div>
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
