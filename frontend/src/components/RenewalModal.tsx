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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                FDR Renewal & Replacement Chain
              </h2>
              <p className="text-xs text-slate-500">
                AICTE Regulatory Continuity & Renewal Tracking
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Historical Chain Visualization */}
          {chain.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unbroken Renewal History Chain
              </h4>
              <div className="space-y-2">
                {chain.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        item.is_current
                          ? "bg-blue-50/70 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800"
                          : "bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-bold font-mono text-slate-900 dark:text-slate-100">
                          {item.reference_number}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.issue_date} &rarr; {item.maturity_date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Currency amount={item.amount} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    {idx < chain.length - 1 && (
                      <div className="flex justify-center text-slate-400">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Form to submit renewal child */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Submit Replacement Instrument
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  New FDR Reference *
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Renewal Amount (INR) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  New Issue Date *
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  New Maturity Date *
                </label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleRenew}
              disabled={isSubmitting}
              className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
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
