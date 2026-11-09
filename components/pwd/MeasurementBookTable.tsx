'use client';

import React, { useState } from 'react';
import { GeneratedRebarItem } from '@/lib/engine/members/footing';
import { generatePwdBillingSummary, validateRollingMargin, RollingMarginCheck } from '@/lib/engine/pwdBilling';
import { FileSpreadsheet, FileText, Download, CheckCircle, AlertTriangle, ShieldCheck, Calculator, Check, X } from 'lucide-react';

export interface MeasurementBookTableProps {
  items: GeneratedRebarItem[];
  projectName: string;
  onTogglePayable?: (index: number) => void;
}

export const MeasurementBookTable: React.FC<MeasurementBookTableProps> = ({
  items,
  projectName,
  onTogglePayable,
}) => {
  const [sampleWeights, setSampleWeights] = useState<Record<number, number>>({
    8: 0.395,
    10: 0.617,
    12: 0.888,
    16: 1.578,
    20: 2.466,
    25: 3.853,
    32: 6.313,
  });

  const [activeTab, setActiveTab] = useState<'MB_SHEET' | 'ABSTRACT' | 'ROLLING_MARGIN'>('MB_SHEET');
  const [downloading, setDownloading] = useState<string | null>(null);

  const summary = generatePwdBillingSummary(items, projectName, sampleWeights);

  const handleDownloadExcel = async () => {
    try {
      setDownloading('EXCEL');
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          options: {
            projectName,
            authority: 'MAHARASHTRA_PWD DSR 2024-2026',
            mbNumber: 'MB-2026/PWD-042',
          },
        }),
      });

      if (!response.ok) throw new Error('Excel download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Maharashtra_PWD_MB_${projectName.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download Excel MB');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading('PDF');
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          options: { projectName },
        }),
      });

      if (!response.ok) throw new Error('PDF download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartBBS_ShopFloor_${projectName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDxf = async () => {
    try {
      setDownloading('DXF');
      const response = await fetch('/api/export/dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, projectName }),
      });

      if (!response.ok) throw new Error('DXF download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartBBS_CAD_${projectName.replace(/\s+/g, '_')}.dxf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download DXF');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/10 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('MB_SHEET')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MB_SHEET'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Measurement Book (Item Bd.F.5)
          </button>
          <button
            onClick={() => setActiveTab('ABSTRACT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ABSTRACT'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Abstract of Steel (Diameter Summary)
          </button>
          <button
            onClick={() => setActiveTab('ROLLING_MARGIN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ROLLING_MARGIN'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rolling Margin Verifier
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={Boolean(downloading)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloading === 'EXCEL' ? 'Generating...' : 'Export PWD MB (.xlsx)'}</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={Boolean(downloading)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>{downloading === 'PDF' ? 'Generating...' : 'Production PDF'}</span>
          </button>
          <button
            onClick={handleDownloadDxf}
            disabled={Boolean(downloading)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'DXF' ? 'Generating...' : 'AutoCAD (.dxf)'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MEASUREMENT BOOK SHEET */}
      {activeTab === 'MB_SHEET' && (
        <div className="space-y-4">
          {/* Official PWD Title Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-slate-900/80 border border-sky-500/30 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-400">
                  Government of Maharashtra • Public Works Department
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  DSR Item Bd.F.5 — TMT/HYSD Reinforcement Measurement Book (MB) Record
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Total Net Payable Quantity</div>
                <div className="text-xl font-black text-emerald-400">
                  {summary.grandTotalPayableWeightMT} M.T. ({summary.grandTotalWeightKg.toFixed(1)} kg)
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Member & Description</th>
                  <th className="py-3 px-2">Mark</th>
                  <th className="py-3 px-2">Shape</th>
                  <th className="py-3 px-2">Dia</th>
                  <th className="py-3 px-2">Qty</th>
                  <th className="py-3 px-3">Dimensions (A/B/C)</th>
                  <th className="py-3 px-2 text-right">Cut L (m)</th>
                  <th className="py-3 px-2 text-right">Total L (m)</th>
                  <th className="py-3 px-2 text-right">Unit Wt</th>
                  <th className="py-3 px-3 text-right">Total Wt (kg)</th>
                  <th className="py-3 px-3 text-center">PWD Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {items.map((item, idx) => {
                  const totalLen = (item.count * item.calculatedCutLength) / 1000;
                  const totalWt = totalLen * item.unitWeight;
                  return (
                    <tr key={idx} className="hover:bg-sky-500/5 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-200 font-bold">{item.description}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.remarks}</div>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-sky-400">{item.barMark}</td>
                      <td className="py-2.5 px-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                          {item.shapeCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-slate-200">Ø {item.dia}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-200">{item.count}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        A:{item.dimA} {item.dimB > 0 && `| B:${item.dimB}`} {item.dimC > 0 && `| C:${item.dimC}`}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-slate-300">
                        {(item.calculatedCutLength / 1000).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-sky-400">{totalLen.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-400">{item.unitWeight}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">{totalWt.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onTogglePayable && onTogglePayable(idx)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                            item.isPayable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {item.isPayable ? 'PAYABLE' : 'NON-PAYABLE'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900/90 font-bold text-slate-200 border-t-2 border-slate-700">
                <tr>
                  <td colSpan={8} className="py-3 px-3 text-right uppercase tracking-wider">
                    Total Quantity (All Diameters):
                  </td>
                  <td className="py-3 px-2 text-right text-sky-400">{summary.grandTotalLengthM.toFixed(2)} m</td>
                  <td></td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    {summary.grandTotalWeightKg.toFixed(1)} kg ({summary.grandTotalWeightMT} MT)
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ABSTRACT OF STEEL (DIAMETER-WISE SUMMARY) */}
      {activeTab === 'ABSTRACT' && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-white/10 dark:border-slate-800 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Diameter (mm)</th>
                  <th className="py-3 px-3">Theoretical Formula</th>
                  <th className="py-3 px-3">Unit Wt (kg/m)</th>
                  <th className="py-3 px-3 text-right">Total Length (R.M.)</th>
                  <th className="py-3 px-3 text-right">Total Wt (kg)</th>
                  <th className="py-3 px-3 text-right">Total Wt (M.T.)</th>
                  <th className="py-3 px-3 text-right">Payable Wt (M.T.)</th>
                  <th className="py-3 px-3 text-center">Permissible Tolerance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold">
                {summary.diaBreakdown.map((row) => (
                  <tr key={row.dia} className="hover:bg-sky-500/5 transition-colors">
                    <td className="py-3 px-4 font-black text-sky-400 text-sm">Ø {row.dia} mm</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">({row.dia}²)/162.2</td>
                    <td className="py-3 px-3 text-slate-300">{row.unitWeight} kg/m</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-200">{row.totalLengthM} m</td>
                    <td className="py-3 px-3 text-right text-slate-200">{row.totalWeightKg} kg</td>
                    <td className="py-3 px-3 text-right text-slate-200">{row.totalWeightMT} MT</td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-400">{row.payableWeightMT} MT</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {row.dia <= 8 ? '± 4.0%' : row.dia <= 16 ? '± 3.0%' : '± 2.5%'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900/90 font-extrabold text-slate-100 border-t-2 border-slate-700">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-sky-400">
                    Grand Net Payable Bill Quantity:
                  </td>
                  <td className="py-3 px-3 text-right text-sky-400">{summary.grandTotalLengthM.toFixed(2)} m</td>
                  <td className="py-3 px-3 text-right">{summary.grandTotalWeightKg.toFixed(1)} kg</td>
                  <td className="py-3 px-3 text-right">{summary.grandTotalWeightMT} MT</td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-base">
                    {summary.grandTotalPayableWeightMT} MT
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Binding Wire Site Requirement Note */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong className="font-bold text-amber-300">Maharashtra PWD Binding Wire Provision:</strong>
              <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                As per PWD specification, binding wire is <strong>strictly excluded from payable steel weight</strong>.
                For procurement and site planning, estimated 1.63mm annealed wire requirement is calculated at 8 to 10
                kg per MT of payable steel:
                <strong className="text-white ml-1">
                  {summary.bindingWireEstimateMinKg} kg to {summary.bindingWireEstimateMaxKg} kg
                </strong>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLLING MARGIN VERIFIER */}
      {activeTab === 'ROLLING_MARGIN' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/10 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h4 className="text-sm font-bold text-slate-200">Site Steel Rolling Margin Quality Check</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify actual weighed steel sample weights per running meter against IS 1786 and Maharashtra PWD tolerances.
              Excessive underweight or overweight beyond standard tolerances (±2.5% to ±4.0%) will be flagged for billing deduction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.rollingMarginAudits.map((audit) => (
              <div
                key={audit.dia}
                className={`p-4 rounded-2xl border backdrop-blur-md ${
                  audit.isCompliant
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-sky-400">Ø {audit.dia} mm Bar</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 ${
                      audit.isCompliant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {audit.isCompliant ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {audit.isCompliant ? 'COMPLIANT' : 'TOLERANCE EXCEEDED'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Theoretical Weight:</span>
                    <strong className="text-slate-200">{audit.theoreticalWeightKgPerM} kg/m</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Site Sample Weight:</span>
                    <strong className="text-slate-200">{audit.actualSampleWeightKgPerM} kg/m</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tolerance Allowed:</span>
                    <strong className="text-slate-200">± {audit.toleranceAllowedPercentage}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Observed Deviation:</span>
                    <strong className={audit.isCompliant ? 'text-emerald-400' : 'text-rose-400'}>
                      {audit.deviationPercentage > 0 ? '+' : ''}
                      {audit.deviationPercentage}%
                    </strong>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-300 pt-2 border-t border-slate-800">
                  {audit.statusMessage}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
