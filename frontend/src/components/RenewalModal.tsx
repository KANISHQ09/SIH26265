"use client";

import React, { useState, useEffect } from "react";
import { Instrument } from "@/types";
import { api } from "@/lib/api";
import { Currency } from "./CurrencyFormatter";
import { StatusBadge } from "./StatusBadge";
import { TrustBadge } from "./TrustBadge";
import { ArrowDown, X, RefreshCw, CheckCircle2 } from "lucide-react";

interface RenewalModalProps {
  instrument: Instrument;
  onClose: () => void;
  onSuccess: () => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  instrument,
  onClose,
  onSuccess,
}) => {
  const [chain, setChain] = useState<any[]>([]);
  const [referenceNumber, setReferenceNumber] = useState(
    `FDR-REN-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [amount, setAmount] = useState(instrument.amount);
  const [issueDate, setIssueDate] = useState(instrument.maturity_date);
  const [maturityDate, setMaturityDate] = useState("2031-03-31");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getRenewalChain(instrument.id).then(setChain).catch(console.error);
  }, [instrument.id]);

  const handleRenew = async () => {
    setIsSubmitting(true);
    try {
      await api.renewInstrument(instrument.id, {
        reference_number: referenceNumber,
        amount: Number(amount),
        issue_date: issueDate,
        maturity_date: maturityDate,
        purpose: `Renewal of FDR #${instrument.reference_number}`,
      });
      alert("Renewal instrument registered! Linked to parent chain.");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Renewal failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 shadow-2xs">
              <RefreshCw className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                FDR Renewal &amp; Replacement Chain
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 font-sans">
                AICTE Regulatory Continuity &amp; Renewal Tracking
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Historical Chain Visualization */}
          {chain.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Unbroken Renewal History Chain
              </h4>
              <div className="space-y-2">
                {chain.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs shadow-2xs ${
                        item.is_current
                          ? "bg-white border-amber-300 ring-1 ring-amber-200"
                          : "bg-white border-stone-200"
                      }`}
                    >
                      <div>
                        <div className="font-bold font-mono text-stone-900">
                          {item.reference_number}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {item.issue_date} &rarr; {item.maturity_date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Currency amount={item.amount} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    {idx < chain.length - 1 && (
                      <div className="flex justify-center text-stone-400">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Form to submit renewal child */}
          <div className="space-y-3 pt-3 border-t border-stone-200 bg-white p-5 rounded-2xl border shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Submit Replacement Instrument
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-stone-700">
                  New FDR Reference *
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white font-mono text-stone-900"
                />
              </div>
              <div>
                <label className="font-medium text-stone-700">
                  Renewal Amount (INR) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white font-mono text-stone-900"
                />
              </div>
              <div>
                <label className="font-medium text-stone-700">
                  New Issue Date *
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white text-stone-900"
                />
              </div>
              <div>
                <label className="font-medium text-stone-700">
                  New Maturity Date *
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white text-stone-900"
                />
              </div>
            </div>

            <button
              onClick={handleRenew}
              disabled={isSubmitting}
              className="mt-3 w-full py-2.5 bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Linking Renewal Chain..." : "Submit Renewal FDR & Link Chain"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
