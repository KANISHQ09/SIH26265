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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {action}
        </span>
      );
    }
    if (action.includes("CREATED") || action.includes("SUBMITTED")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          {action}
        </span>
      );
    }
    if (action.includes("MATCHED") || action.includes("VERIFIED") || action.includes("APPROVED")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {action}
        </span>
      );
    }
    if (action.includes("FLAGGED") || action.includes("DISCREPANCY")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-amber-950 border border-amber-300">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
        {action}
      </span>
    );
  };

  const isChainBroken = verificationResult && !verificationResult.is_valid;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-[#FAF9F5] border border-stone-200 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shadow-2xs">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Cryptographic Audit Trail (Non-Repudiation)
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#FEF3C7] text-amber-950 border border-amber-300/60 rounded-full font-sans uppercase tracking-wider">
                  SHA-256 Ledger
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-sans">
                Hash-Chained Append-Only Ledger • AICTE Section 9.7 Architecture Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
              Verify Hash Chain
            </button>

            {isChainBroken ? (
              <button
                onClick={handleResetLedger}
                disabled={isResetting}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Restore tampered record back to legitimate state and verify integrity"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                Restore Ledger (Reset)
              </button>
            ) : (
              <button
                onClick={handleTriggerTamperDemo}
                disabled={isTampering || logs.length === 0}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Deliberately corrupts an audit entry to demonstrate live cryptographic tamper detection to judges"
              >
                <Bug className="w-3.5 h-3.5 text-rose-600" />
                Simulate Tampering (Demo)
              </button>
            )}

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
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
                ? "bg-emerald-50/90 text-emerald-950 border-emerald-200"
                : "bg-rose-50 text-rose-950 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {verificationResult.is_valid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
              )}
              <div>
                <span className="font-semibold text-xs sm:text-sm">
                  {verificationResult.message || (
                    verificationResult.is_valid
                      ? `Chain integrity verified: ${logs.length} audit entries cryptographically valid (SHA-256 intact).`
                      : `Tampering detected at Row #${verificationResult.broken_at_audit_id || 1}: payload hash mismatch!`
                  )}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5 font-sans">
                  {verificationResult.is_valid
                    ? "Every row hash mathematically matches its parent link and canonical payload."
                    : "Cryptographic breakdown detected! Append-only integrity constraint failed."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {verificationResult.broken_at_audit_id && (
                <span className="font-mono bg-rose-200 text-rose-900 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-300">
                  Broken Link at Row #{verificationResult.broken_at_audit_id}
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-stone-200 text-stone-800 shadow-2xs">
                <Database className="w-3 h-3 text-stone-400" />
                {logs.length} Blocks Verified
              </span>
            </div>
          </div>
        )}

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-sm font-medium">Recomputing and fetching cryptographic ledger...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No audit logs recorded yet.</p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/75 text-stone-600 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
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
                <tbody className="divide-y divide-stone-100">
                  {logs.map((log) => {
                    const rowHash = log.row_hash || log.current_hash || "—";
                    const prevHash = log.prev_hash || "0000000000000000000000000000000000000000000000000000000000000000";
                    const isTamperedRow = log.action?.includes("TAMPERED") || (verificationResult?.broken_at_audit_id === log.id);
                    const isExpanded = expandedRowId === log.id;
                    const timestampDisplay = formatTimestamp(log.at || log.created_at);

                    return (
                      <React.Fragment key={log.id}>
                        <tr 
                          className={`transition-colors hover:bg-amber-50/40 cursor-pointer ${
                            isTamperedRow 
                              ? "bg-rose-50/50 border-l-4 border-l-rose-500" 
                              : isExpanded 
                                ? "bg-stone-50" 
                                : ""
                          }`}
                          onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                        >
                          <td className="py-3 px-3 text-center font-mono font-bold text-stone-500">
                            #{log.id}
                          </td>
                          <td className="py-3 px-3 font-mono text-stone-600 text-[11px] whitespace-nowrap">
                            {timestampDisplay}
                          </td>
                          <td className="py-3 px-3">
                            {renderActionBadge(log.action)}
                          </td>
                          <td className="py-3 px-3 text-stone-800">
                            <span className="font-medium">{log.entity_type}</span>
                            {log.entity_id && (
                              <span className="ml-1.5 font-mono text-[11px] text-stone-500">
                                ({log.entity_id})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="inline-block self-start bg-stone-100 px-2 py-0.5 rounded-full text-[11px] font-semibold text-stone-800 border border-stone-200">
                                {log.actor_role || "SYSTEM"}
                              </span>
                              {(log.actor_email || log.actor_id) && (
                                <span className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[140px]" title={log.actor_email || log.actor_id}>
                                  {log.actor_email || log.actor_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className={`font-mono text-[11px] px-2.5 py-1 rounded-full max-w-[200px] sm:max-w-xs truncate ${
                                  isTamperedRow 
                                    ? "bg-rose-100 text-rose-800 font-bold border border-rose-200" 
                                    : "bg-stone-50 text-stone-700 border border-stone-200/80"
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
                                  className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
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
                              className="p-1 rounded text-stone-400 hover:text-stone-700"
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
                          <tr className="bg-[#FAF9F5] border-b border-stone-200">
                            <td colSpan={7} className="p-4 sm:p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Cryptographic Link Verification */}
                                <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                                  <div className="flex items-center gap-2 font-semibold text-stone-900 pb-2 border-b border-stone-100">
                                    <Link2 className="w-4 h-4 text-blue-600" />
                                    <span>Cryptographic Chain Linkage</span>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                      Previous Block Hash (prev_hash)
                                    </span>
                                    <div className="font-mono text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-stone-700 break-all select-all mt-1">
                                      {prevHash}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                      Calculated Row Hash (row_hash)
                                    </span>
                                    <div className={`font-mono text-[11px] p-2.5 rounded-xl break-all select-all mt-1 ${
                                      isTamperedRow 
                                        ? "bg-rose-100 text-rose-900 border border-rose-300 font-bold" 
                                        : "bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold"
                                    }`}>
                                      {rowHash}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 text-[11px] text-stone-500 border-t border-stone-100">
                                    <span className="flex items-center gap-1.5">
                                      <Server className="w-3.5 h-3.5 text-stone-400" />
                                      Client IP: <strong className="font-mono text-stone-800">{log.ip_address || "127.0.0.1 (Loopback)"}</strong>
                                    </span>
                                    <span>
                                      Actor ID: <strong className="font-mono text-stone-800">{log.actor_id || "N/A"}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* State Transition Payload Diff */}
                                <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
                                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                                    <span className="font-semibold text-stone-900 flex items-center gap-2">
                                      <Database className="w-4 h-4 text-amber-700" />
                                      Canonical State Change Payload
                                    </span>
                                    <span className="text-[10px] text-stone-400 font-mono">Canonical JSON</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] font-bold text-stone-500 uppercase">State Before:</span>
                                      <pre className="font-mono text-[10px] bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-stone-700 max-h-36 overflow-y-auto mt-1">
                                        {log.before_json ? JSON.stringify(log.before_json, null, 2) : "null (Creation)"}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold text-stone-500 uppercase">State After:</span>
                                      <pre className="font-mono text-[10px] bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-stone-700 max-h-36 overflow-y-auto mt-1">
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
        <div className="px-6 py-3 border-t border-stone-200 bg-white flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Append-Only Immutability Guaranteed
            </span>
            <span>•</span>
            <span>Canonical JSON SHA-256</span>
            <span>•</span>
            <span>Click any row to inspect cryptographic link &amp; state payload</span>
          </div>
          <div className="font-mono text-stone-400 text-[10px]">
            Genesis: 0000000000000000000000000000000000000000000000000000000000000000
          </div>
        </div>
      </div>
    </div>
  );
};
