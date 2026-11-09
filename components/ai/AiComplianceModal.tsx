'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, AlertTriangle, CheckCircle, RefreshCw, X, BookOpen } from 'lucide-react';
import { ComplianceAuditReport } from '@/lib/ai/geminiComplianceAudit';
import { GeneratedRebarItem } from '@/lib/engine/members/footing';

export interface AiComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GeneratedRebarItem[];
}

export const AiComplianceModal: React.FC<AiComplianceModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<ComplianceAuditReport | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/compliance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          projectMeta: {
            authorityStandard: 'MAHARASHTRA_PWD',
            isSeismicZone: true,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        alert(data.error || 'Compliance audit failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error running compliance audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Structural Compliance Audit Assistant</h3>
              <p className="text-xs text-slate-400">
                Audited against IS 13920:2016 (Ductile Detailing), IS 456:2000, IS 3370:2021 & Maharashtra PWD Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {!report ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Audit {items.length} Rebar Items for Indian Standards Compliance
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Evaluates 135° seismic hook tails, lap splices in high moment zones, side-face reinforcement for deep beams (&gt;750mm), liquid-retaining cover (IS 3370), and PWD billing rules.
                </p>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-emerald-500/25 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing Schedule Rules...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run AI Structural Compliance Audit</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between ${
                  report.overallStatus === 'COMPLIANT'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : report.overallStatus === 'WARNINGS_FOUND'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {report.overallStatus === 'COMPLIANT' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : report.overallStatus === 'WARNINGS_FOUND' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  ) : (
                    <AlertOctagon className="w-6 h-6 text-rose-400" />
                  )}
                  <div>
                    <div className="text-sm font-black uppercase tracking-wider">
                      Audit Status: {report.overallStatus.replace('_', ' ')}
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">{report.summaryText}</div>
                  </div>
                </div>

                <button
                  onClick={handleRunAudit}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Re-Audit
                </button>
              </div>

              {/* Stat counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Rules Checked</div>
                  <div className="text-xl font-black text-sky-400 mt-0.5">{report.totalRulesChecked}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Passed</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">{report.passedCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Warnings / Critical</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">
                    {report.warningCount + report.criticalCount}
                  </div>
                </div>
              </div>

              {/* Audit items list */}
              <div className="space-y-3">
                {report.auditItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${
                      item.severity === 'PASSED'
                        ? 'bg-slate-950/50 border-slate-800'
                        : item.severity === 'WARNING'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.severity === 'PASSED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.severity === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.severity}
                          </span>
                          <span className="text-xs font-bold text-white">{item.ruleTitle}</span>
                        </div>
                        <div className="text-[11px] font-mono text-sky-400 mt-1">{item.codeReference}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">{item.issueDescription}</p>

                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                      <strong className="text-sky-400 shrink-0">Recommendation:</strong>
                      <span>{item.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Close Audit Report
          </button>
        </div>
      </div>
    </div>
  );
};
