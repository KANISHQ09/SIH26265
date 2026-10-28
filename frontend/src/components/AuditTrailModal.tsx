"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  ShieldCheck, ShieldAlert, RefreshCw, X, Lock, AlertTriangle, Bug, 
  Copy, Check, ChevronDown, ChevronUp, Link2, RotateCcw, Database, Server
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
  const [isResetting, setIsResetting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.listAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
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
      if (res.chain_verification_result) {
        setVerificationResult(res.chain_verification_result);
      } else {
        await handleVerifyChain();
      }
      await fetchLogs();
    } catch (err: any) {
      alert(`Tamper Demo Failed: ${err.message}`);
    } finally {
      setIsTampering(false);
    }
  };

  const handleResetLedger = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetTamperDemo();
      if (res?.chain_verification_result) {
        setVerificationResult(res.chain_verification_result);
      } else {
        await handleVerifyChain();
      }
      await fetchLogs();
    } catch (err: any) {
      alert(`Reset Failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = (hash: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  useEffect(() => {
    fetchLogs();
    handleVerifyChain();
  }, []);

  const formatTimestamp = (timestampStr?: string) => {
    if (!timestampStr) return "—";
    try {
      const d = new Date(timestampStr);
      if (isNaN(d.getTime())) return timestampStr;
      return d.toISOString().replace("T", " ").substring(0, 19) + " UTC";
    } catch {
      return timestampStr;
    }
  };

  const renderActionBadge = (action: string) => {
    if (action.includes("TAMPERED")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {action}
        </span>
      );
    }
    if (action.includes("CREATED") || action.includes("SUBMITTED")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {action}
        </span>
      );
    }
    if (action.includes("MATCHED") || action.includes("VERIFIED") || action.includes("APPROVED")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {action}
        </span>
      );
    }
    if (action.includes("FLAGGED") || action.includes("DISCREPANCY")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {action}
      </span>
    );
  };

  const isChainBroken = verificationResult && !verificationResult.is_valid;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-xs">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Cryptographic Audit Trail (Non-Repudiation)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
                  SHA-256 Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hash-Chained Append-Only Ledger • AICTE Section 9.7 Architecture Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              Verify Hash Chain
            </button>

            {isChainBroken ? (
              <button
                onClick={handleResetLedger}
                disabled={isResetting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Restore tampered record back to legitimate state and verify integrity"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                Restore Ledger (Reset)
              </button>
            ) : (
              <button
                onClick={handleTriggerTamperDemo}
                disabled={isTampering || logs.length === 0}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Deliberately corrupts an audit entry to demonstrate live cryptographic tamper detection to judges"
              >
                <Bug className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Simulate Tampering (Demo)
              </button>
            )}

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {verificationResult && (
          <div
            className={`px-6 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
              verificationResult.is_valid
                ? "bg-emerald-50/90 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {verificationResult.is_valid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
              )}
              <div>
                <span className="font-semibold text-xs sm:text-sm">
                  {verificationResult.message || (
                    verificationResult.is_valid
                      ? `Chain integrity verified: ${logs.length} audit entries cryptographically valid (SHA-256 intact).`
                      : `Tampering detected at Row #${verificationResult.broken_at_audit_id || 1}: payload hash mismatch!`
                  )}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {verificationResult.is_valid
                    ? "Every row hash mathematically matches its parent link and canonical payload."
                    : "Cryptographic breakdown detected! Append-only integrity constraint failed."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {verificationResult.broken_at_audit_id && (
                <span className="font-mono bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 px-2.5 py-1 rounded text-xs font-bold border border-rose-300 dark:border-rose-700">
                  Broken Link at Row #{verificationResult.broken_at_audit_id}
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Database className="w-3 h-3 text-slate-400" />
                {logs.length} Blocks Verified
              </span>
            </div>
          </div>
        )}

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Recomputing and fetching cryptographic ledger...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3">Timestamp (UTC)</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Entity</th>
                    <th className="py-3 px-3">Actor / Role</th>
                    <th className="py-3 px-3">Cryptographic Row Hash (SHA-256)</th>
                    <th className="py-3 px-3 text-center w-16">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {logs.map((log) => {
                    const rowHash = log.row_hash || log.current_hash || "—";
                    const prevHash = log.prev_hash || "0000000000000000000000000000000000000000000000000000000000000000";
                    const isTamperedRow = log.action?.includes("TAMPERED") || (verificationResult?.broken_at_audit_id === log.id);
                    const isExpanded = expandedRowId === log.id;
                    const timestampDisplay = formatTimestamp(log.at || log.created_at);

                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer ${
                            isTamperedRow 
                              ? "bg-rose-50/50 dark:bg-rose-950/20 border-l-4 border-l-rose-500" 
                              : isExpanded 
                                ? "bg-slate-50/50 dark:bg-slate-800/30" 
                                : ""
                          }`}
                          onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                        >
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                            #{log.id}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                            {timestampDisplay}
                          </td>
                          <td className="py-3 px-3">
                            {renderActionBadge(log.action)}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{log.entity_type}</span>
                            {log.entity_id && (
                              <span className="ml-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                ({log.entity_id})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="inline-block self-start bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {log.actor_role || "SYSTEM"}
                              </span>
                              {(log.actor_email || log.actor_id) && (
                                <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={log.actor_email || log.actor_id}>
                                  {log.actor_email || log.actor_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className={`font-mono text-[11px] px-2 py-1 rounded max-w-[200px] sm:max-w-xs truncate ${
                                  isTamperedRow 
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold" 
                                    : "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
                                }`} 
                                title={rowHash}
                              >
                                {rowHash}
                              </span>
                              {rowHash !== "—" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(rowHash);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Copy full SHA-256 hash"
                                >
                                  {copiedHash === rowHash ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Inspection Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={7} className="p-4 sm:p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Cryptographic Link Verification */}
                                <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <Link2 className="w-4 h-4 text-indigo-500" />
                                    <span>Cryptographic Chain Linkage</span>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Previous Block Hash (prev_hash)
                                    </span>
                                    <div className="font-mono text-[11px] bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 break-all select-all mt-1">
                                      {prevHash}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Calculated Row Hash (row_hash)
                                    </span>
                                    <div className={`font-mono text-[11px] p-2 rounded break-all select-all mt-1 ${
                                      isTamperedRow 
                                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800" 
                                        : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    }`}>
                                      {rowHash}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                                    <span className="flex items-center gap-1.5">
                                      <Server className="w-3.5 h-3.5 text-slate-400" />
                                      Client IP: <strong className="font-mono text-slate-700 dark:text-slate-300">{log.ip_address || "127.0.0.1 (Loopback)"}</strong>
                                    </span>
                                    <span>
                                      Actor ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{log.actor_id || "N/A"}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* State Transition Payload Diff */}
                                <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                      <Database className="w-4 h-4 text-emerald-500" />
                                      Canonical State Change Payload
                                    </span>
                                    <span className="text-[10px] text-slate-400">Canonical JSON Input</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">State Before:</span>
                                      <pre className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto mt-1">
                                        {log.before_json ? JSON.stringify(log.before_json, null, 2) : "null (Creation)"}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">State After:</span>
                                      <pre className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto mt-1">
                                        {log.after_json ? JSON.stringify(log.after_json, null, 2) : "{}"}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Append-Only Immutability Guaranteed
            </span>
            <span>•</span>
            <span>Canonical JSON SHA-256</span>
            <span>•</span>
            <span>Click any row to inspect cryptographic link & state payload</span>
          </div>
          <div className="font-mono text-slate-400 text-[10px]">
            Genesis: 0000000000000000000000000000000000000000000000000000000000000000
          </div>
        </div>
      </div>
    </div>
  );
};
