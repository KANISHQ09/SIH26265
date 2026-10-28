"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Emblem } from "@/components/Emblem";
import { ZetsuRoleModal } from "@/components/ZetsuRoleModal";
import { ZetsuArchitectureModal } from "@/components/ZetsuArchitectureModal";
import { 
  Play, Shield, ChevronDown, Check, X, ArrowUpRight, 
  Sparkles, Compass, Eye, HeartHandshake, Lock, Building2,
  FileText, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  Search, ShieldCheck, ArrowRight, Menu
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const testimonials = [
    {
      quote: "Eliminated 6-month paper verification cycles down to real-time scheduled bank API reconciliation.",
      author: "Scrutiny Officer (Desk 1)",
      context: "AICTE Regulation Bureau",
    },
    {
      quote: "Immediate visibility into joint lien status, automated renewal alerts, and seamless 4-eye release approvals.",
      author: "Principal & Registrar",
      context: "Technical Institution (IIT Delhi Campus)",
    },
    {
      quote: "Complete tamper-evidence. Every field update and scrutiny action is provable via immutable SHA-256 hash chains.",
      author: "Vigilance & External Auditor",
      context: "Independent Audit Cell",
    },
  ];

  const silentFailures = [
    {
      num: "01",
      title: "The Phantom Lien Illusion",
      desc: "Colleges submit authentic-looking deposit receipts, yet branch records fail to register an irrevocable joint lien in favor of AICTE, risking unauthorized premature encashment.",
    },
    {
      num: "02",
      title: "Silent Maturity Lapses",
      desc: "Multi-crore deposits quietly expire without automated notification, leaving technical institutions non-compliant and student corpus guarantees completely unsecured.",
    },
    {
      num: "03",
      title: "Opaque Release Approvals",
      desc: "Manual paper releases scattered across departmental desks without cryptographic audit chains or strict 4-eye segregation between scrutiny, finance, and competent authority.",
    },
  ];

  const movements = [
    {
      step: "Pillar I",
      name: "Three-Tier Trust Provenance",
      headline: "Granular verification status for every instrument and field.",
      detail:
        "Values progress strictly from ⚪ SUBMITTED (institution input/OCR extraction) to 🟡 OFFICER_VERIFIED (checked against certified branch letters) to 🟢 BANK_CONFIRMED (verified via scheduled Bank Adapter API integration).",
    },
    {
      step: "Pillar II",
      name: "Intelligent Discrepancy Engine",
      headline: "Automated real-time inspection across 7 regulatory failure vectors.",
      detail:
        "Instantly catches missing joint lien clauses, OCR amount discrepancies, duplicate document SHA-256 hashes, short validity periods (< statutory 5-8 years), and mismatched bank responses.",
    },
    {
      step: "Pillar III",
      name: "Tamper-Evident SHA-256 Ledger",
      headline: "Every state transition and officer action cryptographically chained.",
      detail:
        "Every change produces an immutable audit record referencing prev_hash + payload SHA-256, enabling one-click audit verification and total vigilance integrity.",
    },
    {
      step: "Pillar IV",
      name: "4-Stage Segregated Release",
      headline: "Statutory 4-eye approval workflow for security deposit discharge.",
      detail:
        "Institution Release Claim → Automated Pre-Scrutiny Checklist → Regulation Scrutiny Review → Finance Officer Reconciliation → Competent Authority Final Statutory Authorization.",
    },
  ];

  const trustMatrix = [
    {
      code: "SUBMITTED",
      label: "SUBMITTED",
      dotBg: "bg-purple-500",
      badgeClass: "bg-purple-50 text-purple-900 border-purple-200",
      origin: "Institution / OCR Scan",
      legalStatus: "Provisional (Non-authoritative)",
      verification: "Raw extracted data pending human or automated audit",
    },
    {
      code: "OFFICER_VERIFIED",
      label: "OFFICER_VERIFIED",
      dotBg: "bg-amber-500",
      badgeClass: "bg-amber-50 text-amber-950 border-amber-300",
      origin: "Scrutiny Officer (Desk 1)",
      legalStatus: "Substantive Regulatory Sign-off",
      verification: "Reconciled with original physical/signed branch confirmation letter",
    },
    {
      code: "BANK_CONFIRMED",
      label: "BANK_CONFIRMED",
      dotBg: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-950 border-emerald-300",
      origin: "Direct Scheduled Bank Adapter",
      legalStatus: "Authoritative Financial Assurance",
      verification: "Machine-to-machine validation via SBI, PNB, HDFC, or Canara API",
    },
  ];

  const faqs = [
    {
      q: "How does Zetsu verify lien confirmation directly with scheduled commercial banks?",
      a: "Zetsu connects to partner bank adapters (State Bank of India, Punjab National Bank, HDFC Bank, Canara Bank) via encrypted, authenticated APIs. When an FDR is submitted or renewed, the adapter verifies account existence, pledged amount, lock-in tenure, and explicit joint lien marking in favor of AICTE without manual postal delays.",
    },
    {
      q: "What prevents fraudulent or duplicate FDR resubmissions across institutions?",
      a: "Every uploaded scan produces a cryptographic SHA-256 document hash that is cataloged in the global registry. If an institution attempts to pledge an existing FDR or alter a previously submitted receipt, the discrepancy engine immediately blocks ingestion with a duplicate reference violation.",
    },
    {
      q: "How does the Segregation of Duties release workflow operate?",
      a: "Release requests cannot be approved by a single individual. The workflow enforces a mandatory 4-stage gate: (1) Automated checklist validation against pending institution inquiries, (2) Scrutiny Officer technical endorsement, (3) Finance Officer financial audit, and (4) Competent Authority final statutory discharge. Each step is cryptographically hash-chained.",
    },
    {
      q: "How does the built-in Time-Travel simulation assist regulatory oversight?",
      a: "The portal features an interactive demonstration time-travel control that allows evaluators to advance the system clock (+15d, +30d, +90d). This triggers automated multi-tier escalation notices (90, 60, 30, 15, 7, 1 days) and updates FDR statuses to EXPIRING, OVERDUE, or MATURED in real time.",
    },
    {
      q: "Can institutions track renewal requirements before penalties are incurred?",
      a: "Yes. Technical institutions receive automated multi-channel alerts and a dedicated renewal workspace with auto-generated draft renewal forms 90 days before maturity, ensuring seamless compliance without regulatory disruption.",
    },
  ];

  const handleLaunchRole = (role: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zetsu_active_role", role);
    }
    router.push("/portal");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 selection:bg-amber-200 selection:text-amber-950 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 group cursor-pointer"
            title="Zetsu AICTE Portal"
          >
            <Logo size={36} showText={true} />
          </Link>

          {/* Center: Desktop Nav Links (Spaced out, clean, only on xl screens where plenty of room exists) */}
          <nav className="hidden xl:flex items-center space-x-8 text-xs uppercase tracking-widest text-stone-600 font-medium shrink-0">
            <a href="#about" className="hover:text-stone-950 transition-colors whitespace-nowrap">
              Architecture
            </a>
            <a href="#pillars" className="hover:text-stone-950 transition-colors whitespace-nowrap">
              Trust Engine
            </a>
            <a href="#provenance" className="hover:text-stone-950 transition-colors whitespace-nowrap">
              Provenance
            </a>
            <a href="#faq" className="hover:text-stone-950 transition-colors whitespace-nowrap">
              FAQ
            </a>
          </nav>

          {/* Right Action: Launch Portal & Verify Desk */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="hidden md:inline-flex border border-stone-300 hover:border-stone-800 bg-white/80 hover:bg-white text-stone-800 text-xs font-semibold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
            >
              Verify Desk
            </button>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md group cursor-pointer whitespace-nowrap"
              title="Enter FDR Portal Workspace"
            >
              <span>Launch Portal</span>
              <ArrowUpRight size={14} className="opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </Link>

            {/* Mobile/Tablet Menu Button for screens < xl */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-full border border-stone-200/80 bg-white/80 hover:bg-white text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shadow-2xs"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#FAF9F5] border-b border-stone-200/80 px-6 py-4 space-y-3 shadow-md animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2.5 text-xs uppercase tracking-widest text-stone-700 font-semibold">
              <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-amber-700 py-1.5 transition-colors"
              >
                The Architecture
              </a>
              <a
                href="#pillars"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-amber-700 py-1.5 transition-colors"
              >
                Trust Engine
              </a>
              <a
                href="#provenance"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-amber-700 py-1.5 transition-colors"
              >
                3-Tier Provenance
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-amber-700 py-1.5 transition-colors"
              >
                Regulatory FAQ
              </a>
            </nav>
            <div className="pt-2 border-t border-stone-200/60 md:hidden flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsRoleModalOpen(true);
                }}
                className="w-full text-center border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold uppercase tracking-wider py-2.5 rounded-full shadow-2xs transition-colors"
              >
                Verify Desk
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24 sm:pt-20 sm:pb-32">
        {/* HERO SECTION */}
        <section className="text-center space-y-6 sm:space-y-8">
          {/* Centered Emblem Hero Top */}
          <div className="flex justify-center mb-6">
            <Emblem size={52} className="text-stone-900" />
          </div>

          {/* Script Eyebrow */}
          <div className="font-script text-2xl sm:text-3xl md:text-4xl text-stone-600 font-normal tracking-wide">
            regulation bureau · all india council for technical education
          </div>

          {/* Main Editorial Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[66px] font-normal tracking-tight text-stone-900 leading-[1.12] max-w-3xl mx-auto">
            Clarity in regulatory deposits —<br />
            when compliance looks fine,{" "}
            <span className="relative inline-block text-[#E59700] font-serif">
              but isn&apos;t
              <span className="absolute left-0 -bottom-1.5 w-full h-[2.5px] bg-[#F59E0B]/70 rounded-full" />
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-stone-600 text-sm sm:text-base md:text-[17px] font-normal leading-relaxed max-w-2xl mx-auto pt-1">
            Centralized, tamper-evident lifecycle governance for Fixed Deposit Receipts &amp; Security Deposits
            pledged to AICTE. Automated bank API provenance, OCR discrepancy detection, and cryptographic audit chains.
          </p>

          {/* CTA Pill Button */}
          <div className="pt-4 flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/portal"
                className="bg-[#F59E0B] hover:bg-[#EAA00A] active:scale-[0.99] text-stone-950 font-semibold text-base sm:text-[17px] px-9 py-3.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer inline-flex items-center gap-2.5 group"
              >
                <Logo size={22} />
                <span>Launch Portal Workspace</span>
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="border border-stone-300 hover:border-stone-800 text-stone-800 hover:text-stone-950 font-medium text-sm sm:text-base px-6 py-3.5 rounded-full transition-all duration-200 bg-white/70 hover:bg-white cursor-pointer"
              >
                Explore Roles &amp; Desks
              </button>
            </div>
            <p className="text-xs text-stone-500 tracking-wide mt-3.5 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Three-Tier Provenance</span>
              <span className="text-stone-300">·</span>
              <span>Direct Bank Adapter API</span>
              <span className="text-stone-300">·</span>
              <span>Cryptographic Hash Chain</span>
            </p>
          </div>
        </section>

        {/* SOCIAL PROOF & STAKEHOLDER REVIEWS */}
        <section className="mt-24 sm:mt-28">
          <p className="text-xs sm:text-sm font-medium text-stone-600 tracking-tight text-center mb-8">
            Governing ₹1,200+ Cr in institutional security deposits across 10,000+ technical institutions nationwide.
          </p>

          <div className="border-t border-stone-200/90 pt-8 sm:pt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {testimonials.map((item, index) => (
                <div key={index} className="space-y-3">
                  <p className="text-stone-800 text-sm sm:text-[15px] font-normal leading-relaxed font-serif italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-xs text-stone-900 font-semibold font-sans">
                      — {item.author}
                    </p>
                    <p className="text-[11px] text-stone-400 font-sans">
                      {item.context}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT ZETSU IS — AND WHAT IT ISN'T */}
        <section id="about" className="mt-28 sm:mt-36 space-y-8">
          {/* Section Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-stone-200/80 pb-4 gap-2">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
                What Zetsu is —
              </h2>
              <span className="text-xs sm:text-sm text-stone-500 font-sans tracking-wide">
                and what it isn&apos;t
              </span>
            </div>
            <div className="text-xs sm:text-sm text-stone-400 font-serif italic">
              A regulatory integrity paradigm...
            </div>
          </div>

          {/* Featured Highlighted Statement */}
          <p className="font-sans text-lg sm:text-xl md:text-2xl text-stone-800 font-light leading-relaxed max-w-3xl">
            This is not a manual spreadsheet, generic file cabinet, or passive tracker. It&apos;s an active, tamper-evident regulatory engine designed to enforce{" "}
            <span className="bg-[#FEF3C7] text-stone-900 px-2 py-0.5 rounded font-serif italic font-normal text-amber-950">
              provenance in moments that matter.
            </span>
          </p>

          {/* Platform Showcase Card matching screenshot */}
          <div 
            onClick={() => setIsArchModalOpen(true)}
            className="group relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-stone-200/80 bg-stone-900"
          >
            {/* Background Platform Mockup */}
            <Image
              src="/zetsu_platform_preview.jpg"
              alt="Zetsu Regulatory Trust Dashboard"
              fill
              className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 brightness-[0.95]"
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/20" />

            {/* Central Ambient Play / Explore Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-md text-stone-900 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#F59E0B] transition-all duration-300">
                <Play size={24} className="ml-1 text-stone-900" fill="currentColor" />
              </div>
            </div>

            {/* Showcase Badges */}
            <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-8 flex items-center justify-between text-xs text-stone-200">
              <span className="bg-stone-950/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full font-medium tracking-wide border border-stone-700/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Inspect: 3-Tier Provenance &amp; Bank Adapter Engine
              </span>
              <span className="hidden sm:inline-block bg-stone-950/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-stone-300 border border-stone-700/60 font-mono text-[11px]">
                SIH Problem Statement 26265
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 3: THE THREE SILENT REGULATORY FAILURES */}
        <section className="mt-28 sm:mt-36">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <span className="text-xs uppercase tracking-widest text-amber-600 font-semibold">
              The Reality
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
              When paperwork looks fine on paper
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Without machine-to-machine bank verification, paper FDR certificates hide critical regulatory risks that go undetected for years.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {silentFailures.map((item) => (
              <div
                key={item.num}
                className="bg-white/80 border border-stone-200/80 rounded-2xl p-6 sm:p-7 space-y-4 hover:border-amber-300 hover:shadow-xs transition-all duration-200"
              >
                <span className="font-serif text-2xl text-amber-600 font-normal">
                  {item.num}
                </span>
                <h3 className="font-serif text-xl text-stone-900 font-normal">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: THE FOUR ARCHITECTURAL PILLARS */}
        <section id="pillars" className="mt-28 sm:mt-36">
          <div className="border-t border-stone-200/90 pt-16">
            <div className="max-w-2xl mb-12">
              <span className="text-xs uppercase tracking-widest text-amber-600 font-semibold">
                Core Innovations
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal mt-2">
                Engineered for uncompromising statutory trust
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Combining cryptographic hash chains, OCR discrepancy matching, and direct bank APIs into an integrated regulatory workflow.
              </p>
            </div>

            <div className="space-y-6">
              {movements.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 border border-stone-200/80 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
                >
                  <div className="md:col-span-3 space-y-1">
                    <span className="text-xs uppercase tracking-wider text-amber-600 font-semibold">
                      {m.step}
                    </span>
                    <h3 className="font-serif text-2xl text-stone-900 font-normal">
                      {m.name}
                    </h3>
                  </div>
                  <div className="md:col-span-9 space-y-2">
                    <h4 className="font-serif text-lg text-stone-900 font-normal italic">
                      {m.headline}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                      {m.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: THREE-TIER TRUST PROVENANCE MATRIX */}
        <section id="provenance" className="mt-28 sm:mt-36">
          <div className="max-w-xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs uppercase tracking-widest text-amber-600 font-semibold">
              The Provenance Model
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
              Every data point carries its verifiable source
            </h2>
            <p className="text-sm text-stone-600">
              Clear visual distinction between unverified college inputs, officer certifications, and bank-confirmed liens.
            </p>
          </div>

          <div className="bg-white/90 border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Desktop / Tablet Table View (with horizontal scroll safety) */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-12 bg-stone-100/70 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-600 px-6 py-4">
                  <div className="col-span-4 lg:col-span-3">Trust Tier</div>
                  <div className="col-span-4 lg:col-span-4 text-stone-900 font-serif normal-case text-sm">
                    Provenance Origin
                  </div>
                  <div className="col-span-4 lg:col-span-5 text-stone-500">
                    Verification Rigor &amp; Evidentiary Value
                  </div>
                </div>

                <div className="divide-y divide-stone-200/70 text-xs sm:text-sm">
                  {trustMatrix.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 px-6 py-5 gap-4 items-center">
                      <div className="col-span-4 lg:col-span-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-semibold border ${item.badgeClass} shadow-2xs whitespace-nowrap`}>
                          <span className={`w-2 h-2 rounded-full ${item.dotBg} shrink-0`} />
                          {item.label}
                        </span>
                      </div>
                      <div className="col-span-4 lg:col-span-4 text-stone-800 font-medium">
                        <div>{item.origin}</div>
                        <span className="block text-[11px] text-stone-400 font-normal mt-0.5">{item.legalStatus}</span>
                      </div>
                      <div className="col-span-4 lg:col-span-5 text-stone-600 font-sans leading-relaxed">
                        {item.verification}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Responsive Stacked Card View */}
            <div className="block sm:hidden divide-y divide-stone-200/70">
              {trustMatrix.map((item, i) => (
                <div key={i} className="p-4 space-y-2.5 bg-white/70">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-semibold border ${item.badgeClass} shadow-2xs`}>
                      <span className={`w-2 h-2 rounded-full ${item.dotBg} shrink-0`} />
                      {item.label}
                    </span>
                    <span className="text-[11px] text-stone-400 font-normal">
                      {item.legalStatus}
                    </span>
                  </div>
                  <div className="text-stone-900 font-medium text-sm">
                    {item.origin}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {item.verification}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: DIRECT ROLE-BASED ACCESS */}
        <section className="mt-28 sm:mt-36">
          <div className="max-w-xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs uppercase tracking-widest text-amber-600 font-semibold">
              Interactive Workspace
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
              Enter by regulatory role
            </h2>
            <p className="text-sm text-stone-600">
              Select any desk below to experience the customized workspace, KPI meters, and action registers:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => handleLaunchRole("SCRUTINY_OFFICER")}
              className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Desk 1
                </span>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-serif text-lg text-stone-900 font-medium">Scrutiny Officer</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Review uploaded certificates, inspect OCR diffs, run Bank Adapter checks, and flag discrepancies.
              </p>
            </div>

            <div 
              onClick={() => handleLaunchRole("INSTITUTION_USER")}
              className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-950 bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-amber-300/80">
                  IIT Delhi
                </span>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-serif text-lg text-stone-900 font-medium">Institution Submitter</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Submit new FDR deposits, track renewal countdowns, reply to officer queries, and submit release claims.
              </p>
            </div>

            <div 
              onClick={() => handleLaunchRole("COMPETENT_AUTHORITY")}
              className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Statutory
                </span>
                <ArrowRight size={14} className="text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-serif text-lg text-stone-900 font-medium">Competent Authority</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Execute final statutory release approvals and trigger automated lien revocation orders to banks.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: FREQUENTLY ADDRESSED QUESTIONS */}
        <section id="faq" className="mt-28 sm:mt-36">
          <div className="max-w-xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs uppercase tracking-widest text-amber-600 font-semibold">
              Statutory Inquiries
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
              Regulatory governance FAQ
            </h2>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="bg-white/80 border border-stone-200/80 rounded-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-serif text-lg text-stone-900 font-normal hover:text-amber-700 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-stone-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-amber-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-stone-600 font-sans leading-relaxed border-t border-stone-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL REGULATORY INVITATION BANNER */}
        <section className="mt-32 sm:mt-40 text-center space-y-6 bg-white/70 border border-stone-200/90 rounded-3xl p-10 sm:p-14 shadow-xs">
          <div className="flex justify-center">
            <Emblem size={44} className="text-stone-900" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal leading-snug">
              Experience the future of regulatory deposit management.
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed font-sans">
              Streamline FDR intake, eliminate forged liens, automate renewal countdowns, and establish an unassailable audit ledger for the AICTE.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-[#F59E0B] hover:bg-[#EAA00A] active:scale-[0.99] text-stone-950 font-medium text-base px-8 py-3.5 rounded-full shadow-sm hover:shadow transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Launch Demonstration Portal</span>
                <ArrowRight size={16} />
              </button>
              <Link
                href="/portal"
                className="text-stone-700 hover:text-stone-950 font-medium text-sm px-6 py-3.5 underline underline-offset-4"
              >
                Direct Portal Workspace →
              </Link>
            </div>
            <p className="text-xs text-stone-500 tracking-wide mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Smart India Hackathon 2024</span>
              <span className="text-stone-300">·</span>
              <span>Problem Statement 26265</span>
              <span className="text-stone-300">·</span>
              <span>AICTE Regulation Bureau</span>
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-200/70 bg-[#FAF9F5] py-14 px-6 text-stone-500 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size={28} showText={true} />

          <div className="text-center sm:text-right space-y-1">
            <p>© 2026 Zetsu · All India Council for Technical Education (AICTE)</p>
            <p className="text-[11px] text-stone-400">
              Ministry of Education, Government of India · SIH Problem Statement 26265
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-4xl mx-auto mt-6 pt-6 border-t border-stone-200/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <span>Cryptographic Hash-Chain Ledger · Direct Bank API Provenance</span>
          <Link
            href="/portal"
            className="hover:text-stone-700 underline underline-offset-2 transition-colors font-medium text-stone-600"
          >
            Enter Institutional FDR Workspace →
          </Link>
        </div>
      </footer>

      {/* Interactive Modals */}
      <ZetsuRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
      <ZetsuArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
}
