"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ShieldCheck, ShieldAlert, RefreshCw, X, Lock, CheckCircle2, AlertTriangle, Bug
} from "lucide-react";

interface AuditTrailModalProps {
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.listAuditLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
    } catch (err: any) {
      alert(`Verification Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTriggerTamperDemo = async () => {
    if (logs.length === 0) return;
    setIsTampering(true);
    try {
      const targetId = logs[0].id;
      const res = await api.triggerTamperDemo(targetId);
      setVerificationResult(res.chain_verification_result);
      fetchLogs();
    } catch (err: any) {
      alert(`Tamper Demo Failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    handleVerifyChain();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-lg">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cryptographic Audit Trail (Non-Repudiation)
              </h2>
              <p className="text-xs text-slate-500">
                SHA-256 Hash-Chained Append-Only Ledger • Section 9.7 Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              Verify Hash Chain
            </button>
            <button
              onClick={handleTriggerTamperDemo}
              disabled={isTampering}
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Deliberately corrupts an audit entry to demonstrate live tamper detection to judges"
            >
              <Bug className="w-3.5 h-3.5 text-rose-600" />
              Simulate Tampering (Demo)
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {verificationResult && (
          <div
            className={`px-6 py-3 border-b text-xs flex items-center justify-between ${
              verificationResult.is_valid
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {verificationResult.is_valid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              )}
              <span className="font-semibold">{verificationResult.message}</span>
            </div>
            {verificationResult.broken_at_audit_id && (
              <span className="font-mono bg-rose-200 dark:bg-rose-900 px-2 py-0.5 rounded text-[11px] font-bold">
                Broken Link at Row #{verificationResult.broken_at_audit_id}
              </span>
            )}
          </div>
        )}

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">Cryptographic Row Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono text-slate-400">{log.id}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{log.at}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)})` : ""}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      {log.actor_role || "SYSTEM"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 max-w-xs truncate" title={log.row_hash}>
                    {log.row_hash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
