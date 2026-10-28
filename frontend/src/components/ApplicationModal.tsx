"use client";

import React, { useState } from "react";
import { X, Check, ArrowRight, ArrowLeft, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { Emblem } from "./Emblem";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    dilemma: [] as string[],
    customDilemma: "",
    name: "",
    title: "",
    organization: "",
    scale: "",
    email: "",
    phone: "",
    timezone: "US / Eastern (ET)",
    reflection: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const dilemmaOptions = [
    {
      id: "strategic",
      label: "Directional & Strategic Fog",
      desc: "Hitting benchmarks on paper, but the core direction feels disconnected or uncertain.",
    },
    {
      id: "relational",
      label: "Co-founder, Board, or Executive Tension",
      desc: "Unspoken misalignment and political friction draining your cognitive energy.",
    },
    {
      id: "depletion",
      label: "Carrying the Weight in Isolation",
      desc: "Expected to radiate absolute certainty to everyone, with nowhere safe to reflect.",
    },
    {
      id: "transition",
      label: "High-Stakes Inflection or Exit",
      desc: "Navigating succession, capital restructuring, or a major life and business transition.",
    },
    {
      id: "resistance",
      label: "Internal Resistance & Second-Guessing",
      desc: "Hesitation on high-leverage decisions where old playbooks no longer work.",
    },
  ];

  const toggleDilemma = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      dilemma: prev.dilemma.includes(id)
        ? prev.dilemma.filter((item) => item !== id)
        : [...prev.dilemma, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(4);
    }, 1200);
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal dialog */}
      <div className="relative w-full max-w-2xl bg-[#FAF9F5] border border-stone-200/80 rounded-2xl shadow-2xl z-10 overflow-hidden my-8">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-stone-200/60">
          <div className="flex items-center space-x-3">
            <Emblem size={28} className="text-stone-800" />
            <div>
              <p className="font-script text-xl text-stone-700 leading-none">a quiet moment</p>
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                Confidential Application
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress indicator */}
        {step < 4 && (
          <div className="px-6 sm:px-8 pt-4 pb-2">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>Step {step} of 3</span>
              <span className="flex items-center gap-1 text-[11px] text-stone-500">
                <Lock size={12} className="text-stone-400" /> 100% Confidential
              </span>
            </div>
            <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content body */}
        <div className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal leading-snug">
                  Where do things look fine on the surface,{" "}
                  <span className="italic text-amber-600">but aren&apos;t underneath?</span>
                </h3>
                <p className="text-sm text-stone-600 mt-2">
                  Select all tensions currently present in your leadership or decision-making landscape:
                </p>
              </div>

              <div className="space-y-3">
                {dilemmaOptions.map((item) => {
                  const isChecked = formData.dilemma.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleDilemma(item.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 ${
                        isChecked
                          ? "bg-amber-50/70 border-amber-400/80 shadow-xs"
                          : "bg-white/70 border-stone-200/90 hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? "bg-amber-500 text-stone-950" : "border border-stone-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="font-medium text-stone-900 text-sm sm:text-base">
                          {item.label}
                        </div>
                        <div className="text-xs sm:text-sm text-stone-500 mt-0.5 leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 font-medium px-6 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  Continue to Background <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal leading-snug">
                  Your seat and context
                </h3>
                <p className="text-sm text-stone-600 mt-2">
                  To ensure resonance and depth, please share the scope of your current enterprise.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Mitchell"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    Current Role / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Founder & CEO, Managing Partner"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    Organization / Venture
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Company or fund name (optional)"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    Stage or Scale
                  </label>
                  <select
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  >
                    <option value="">Select scope...</option>
                    <option value="early">Early Stage / Seed-Series A ($1M - $5M ARR)</option>
                    <option value="growth">Growth Scale / Series B-D ($10M - $50M ARR)</option>
                    <option value="enterprise">Established Enterprise / Public / PE-backed ($50M+)</option>
                    <option value="family_office">Private Investment / Family Office / Principal</option>
                    <option value="other">Boutique / Specialist Consultancy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                  If there is one decision or knot you want absolute clarity on, what is it?
                </label>
                <textarea
                  rows={3}
                  value={formData.reflection}
                  onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                  placeholder="Share a sentence or two on what has felt cloudy, heavy, or unresolved..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-stone-600 hover:text-stone-900 text-sm inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 font-medium px-6 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  Proceed to Private Contact <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal leading-snug">
                  Confidential contact
                </h3>
                <p className="text-sm text-stone-600 mt-2">
                  All exchanges are treated with strict executive discretion. No mailing lists or unsolicited follow-ups.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    Direct Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@firm.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                      Direct Mobile / Signal (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                    >
                      <option value="US / Eastern (ET)">US / Eastern (ET)</option>
                      <option value="US / Pacific (PT)">US / Pacific (PT)</option>
                      <option value="US / Central (CT)">US / Central (CT)</option>
                      <option value="Europe / London (GMT/BST)">Europe / London (GMT)</option>
                      <option value="Europe / Central (CET)">Europe / Central (CET)</option>
                      <option value="Asia / Singapore (SGT)">Asia / Singapore (SGT)</option>
                      <option value="Asia / India (IST)">Asia / India (IST)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-stone-100/70 border border-stone-200/70 rounded-xl text-xs text-stone-600 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-800 font-medium">Non-obligation pledge:</strong>{" "}
                    We review each inquiry personally. If there is mutual alignment, you will receive an invitation for a private 30-minute introductory conversation. No sales tactics, ever.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-stone-600 hover:text-stone-900 text-sm inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.email}
                  className="bg-[#F59E0B] hover:bg-[#EAA00A] disabled:opacity-50 text-stone-950 font-medium px-7 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition-all shadow-xs"
                >
                  {isSubmitting ? (
                    <>Submitting In Confidence...</>
                  ) : (
                    <>Submit Application <Sparkles size={16} /></>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="py-6 text-center space-y-5">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-3xl text-stone-900 font-normal">
                  Thank you for your trust.
                </h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                  Your inquiry has been privately received. We personally review every submission and will respond directly to <strong className="text-stone-900">{formData.email || "your email"}</strong> within 24 business hours.
                </p>
              </div>
              <div className="p-4 bg-stone-100/60 rounded-xl max-w-sm mx-auto text-xs text-stone-500">
                A private confirmation note has been dispatched with preliminary reflection prompts for our conversation.
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-stone-900 text-stone-50 hover:bg-stone-800 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                >
                  Return to Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
