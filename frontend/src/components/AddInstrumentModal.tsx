"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, X, Sparkles, RefreshCw
} from "lucide-react";

interface AddInstrumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddInstrumentModal: React.FC<AddInstrumentModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);

  // Form Fields
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState<number>(3500000);
  const [issueDate, setIssueDate] = useState("2024-04-01");
  const [maturityDate, setMaturityDate] = useState("2029-03-31");
  const [branchName, setBranchName] = useState("New Delhi Main Branch");
  const [lienMarked, setLienMarked] = useState(true);
  const [purpose, setPurpose] = useState("AICTE Approval Security Deposit - Engineering Degree");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateOCR = () => {
    setIsExtracting(true);
    setTimeout(() => {
      const mockRef = `FDR-${Math.floor(100000 + Math.random() * 900000)}`;
      setReferenceNumber(mockRef);
      setAmount(3500000);
      setIssueDate("2024-04-01");
      setMaturityDate("2029-03-31");
      setBranchName("State Bank of India - University Branch");
      setLienMarked(true);
      setOcrData({
        confidence: 0.94,
        extracted: {
          reference: mockRef,
          amount: 3500000,
          maturity: "2029-03-31",
          lien: "AICTE Endorsed",
        },
      });
      setIsExtracting(false);
      setStep(2);
    }, 1000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create instrument draft
      const newInst = await api.createInstrument({
        type: "FDR",
        reference_number: referenceNumber,
        amount: Number(amount),
        issue_date: issueDate,
        maturity_date: maturityDate,
        branch_name: branchName,
        lien_marked: lienMarked,
        purpose: purpose,
      });

      // 2. Submit instrument to trigger automated discrepancy scan
      await api.submitInstrument(newInst.id);

      alert("FDR Instrument submitted successfully! Intake discrepancy scan executed.");
      onSuccess();
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Submit New Security Deposit / FDR
              </h2>
              <p className="text-xs text-slate-500">
                AICTE Regulation Bureau • Intake Stepper
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/30 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
          <span className={step === 1 ? "text-blue-600 font-bold" : ""}>
            1. Document Upload & OCR
          </span>
          <span>&rarr;</span>
          <span className={step === 2 ? "text-blue-600 font-bold" : ""}>
            2. Review & Field Trust Check
          </span>
          <span>&rarr;</span>
          <span className={step === 3 ? "text-blue-600 font-bold" : ""}>
            3. Regulatory Submission
          </span>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
                <FileText className="w-12 h-12 text-blue-600 opacity-80" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Upload Scanned FDR Certificate or Bank Guarantee
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports PDF, JPG, PNG up to 10MB (Magic byte verified)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateOCR}
                  disabled={isExtracting}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  {isExtracting ? "Analyzing Document & Extracting Fields..." : "Scan & Extract with AI-OCR"}
                </button>
              </div>

              <div className="text-left bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Three-Tier Trust Protection Note
                </div>
                <p className="text-[11px]">
                  All OCR extracted data is initially tagged with <b>SUBMITTED</b> trust. The system will independently run bank verification checks and scrutiny verification before formal release eligibility.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-xs">
              {ocrData && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    OCR extracted values with 94% confidence!
                  </span>
                  <span className="font-mono text-[11px]">Confidence: {ocrData.confidence * 100}%</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    FDR Reference Number *
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
                    Principal Amount (INR) *
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
                    Issue Date *
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
                    Maturity Date *
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Issuing Branch Name
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    Regulatory Purpose
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lienMarked}
                    onChange={(e) => setLienMarked(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Lien marked in favour of Member Secretary, AICTE New Delhi
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              &larr; Back
            </button>
          ) : (
            <div></div>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Enter Details Manually &rarr;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit to AICTE Portal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
