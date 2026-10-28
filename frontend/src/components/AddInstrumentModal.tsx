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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 shadow-2xs">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Submit New Security Deposit / FDR
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 font-sans">
                AICTE Regulation Bureau • Intake Stepper
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 py-3 bg-stone-100/70 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-stone-600 border-b border-stone-200 overflow-x-auto whitespace-nowrap gap-2">
          <span className={step === 1 ? "text-amber-800 font-bold shrink-0" : "shrink-0"}>
            1. Document &amp; OCR
          </span>
          <span className="shrink-0 text-stone-400">&rarr;</span>
          <span className={step === 2 ? "text-amber-800 font-bold shrink-0" : "shrink-0"}>
            2. Trust Review
          </span>
          <span className="shrink-0 text-stone-400">&rarr;</span>
          <span className={step === 3 ? "text-amber-800 font-bold shrink-0" : "shrink-0"}>
            3. Submission
          </span>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="border-2 border-dashed border-stone-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-white shadow-2xs">
                <FileText className="w-12 h-12 text-amber-600 opacity-80" />
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Upload Scanned FDR Certificate or Bank Guarantee
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Supports PDF, JPG, PNG up to 10MB (Magic byte verified)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateOCR}
                  disabled={isExtracting}
                  className="mt-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-950" />
                  {isExtracting ? "Analyzing Document & Extracting Fields..." : "Scan & Extract with AI-OCR"}
                </button>
              </div>

              <div className="text-left bg-white p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 shadow-2xs">
                <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  Three-Tier Trust Protection Note
                </div>
                <p className="text-[11px] text-stone-500">
                  All OCR extracted data is initially tagged with <b>SUBMITTED</b> trust. The system will independently run bank verification checks and scrutiny verification before formal release eligibility.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-xs bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              {ocrData && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    OCR extracted values with 94% confidence!
                  </span>
                  <span className="font-mono text-[11px] font-bold">Confidence: {ocrData.confidence * 100}%</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">
                    FDR Reference Number *
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
                    Principal Amount (INR) *
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
                    Issue Date *
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
                    Maturity Date *
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white text-stone-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-stone-700">
                    Issuing Branch Name
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white text-stone-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-medium text-stone-700">
                    Regulatory Purpose
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full mt-1 p-2.5 border border-stone-300 rounded-xl bg-white text-stone-900"
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
                  <span className="font-medium text-stone-800">
                    Lien marked in favour of Member Secretary, AICTE New Delhi
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-white flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer rounded-full"
            >
              &larr; Back
            </button>
          ) : (
            <div></div>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs"
            >
              Enter Details Manually &rarr;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F59E0B] hover:bg-[#EAA00A] text-stone-950 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
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
