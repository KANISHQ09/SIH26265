"use client";

import React, { useState } from "react";
import { User, UserRole } from "@/types";
import { 
  Building2, Shield, Calendar, FastForward, RotateCcw, 
  UserCheck, ShieldAlert, Sparkles, Check
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
  const [customDays, setCustomDays] = useState(30);

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
    <header className="border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
      {/* Top Govt Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide text-slate-100">
            ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Regulation Bureau • Ministry of Education</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50">
            SIH Problem ID: 26265
          </span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            CBS & SFMS Gateway: Active
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xl tracking-tighter">
            Z
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Zetsu
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">
                FDR Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Security Deposit Lifecycle & Compliance Gateway
            </p>
          </div>
        </div>

        {/* Center: Live Time-Travel Demonstration Widget */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium uppercase leading-none">
              System Clock
            </span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-100">
              {formattedDate}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
              Fast-Forward:
            </span>
            <button
              onClick={() => onTimeTravel(15)}
              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
              title="Advance 15 days (Trigger 15-day reminder)"
            >
              +15d
            </button>
            <button
              onClick={() => onTimeTravel(30)}
              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
              title="Advance 30 days (Trigger 30-day reminder)"
            >
              +30d
            </button>
            <button
              onClick={() => onTimeTravel(60)}
              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
              title="Advance 60 days (Trigger 60-day reminder)"
            >
              +60d
            </button>
            <button
              onClick={() => onTimeTravel(90)}
              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
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

        {/* Right: Active Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm cursor-pointer transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Acting Role</div>
              <div className="font-semibold text-slate-100">
                {currentRole.replace("_", " ")}
              </div>
            </div>
            <UserCheck className="w-4 h-4 ml-1 opacity-70" />
          </button>

          {/* Role Dropdown Menu */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Switch Perspective (Hackathon Demo)
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
                    <div className="mt-0.5">
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
      </div>
    </header>
  );
};
