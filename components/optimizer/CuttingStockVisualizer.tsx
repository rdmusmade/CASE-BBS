'use client';

import React, { useState } from 'react';
import { CuttingOptimizationResult, OptimizedStockBar } from '@/lib/engine/optimizer';
import { Scissors, AlertCircle, CheckCircle2, TrendingDown, Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CuttingStockVisualizerProps {
  results: Record<number, CuttingOptimizationResult>;
  onRunOptimization?: () => void;
}

export const CuttingStockVisualizer: React.FC<CuttingStockVisualizerProps> = ({ results }) => {
  const availableDias = Object.keys(results).map(Number).sort((a, b) => a - b);
  const [selectedDia, setSelectedDia] = useState<number>(availableDias[0] || 16);

  const currentResult = results[selectedDia];

  if (!currentResult || availableDias.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-3xl border border-white/10 dark:border-slate-800">
        <Scissors className="w-12 h-12 text-sky-400 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-bold text-slate-200">No Cutting Data Available</h3>
        <p className="text-sm text-slate-400 mt-1">
          Add structural members to the schedule to run the 1D Cutting Stock Optimization.
        </p>
      </div>
    );
  }

  // Palette of distinct colors for placed cut pieces
  const pieceColors = [
    'bg-sky-500/90 border-sky-400 text-white',
    'bg-indigo-500/90 border-indigo-400 text-white',
    'bg-emerald-500/90 border-emerald-400 text-white',
    'bg-amber-500/90 border-amber-400 text-white',
    'bg-purple-500/90 border-purple-400 text-white',
    'bg-teal-500/90 border-teal-400 text-white',
    'bg-blue-500/90 border-blue-400 text-white',
  ];

  return (
    <div className="space-y-6">
      {/* Diameter Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {availableDias.map((dia) => {
          const res = results[dia];
          const isTargetAchieved = res.scrapPercentage <= 1.5;
          return (
            <button
              key={dia}
              onClick={() => setSelectedDia(dia)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                selectedDia === dia
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-400'
                  : 'bg-white/10 dark:bg-slate-900/60 text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/80 border border-white/10 dark:border-slate-800'
              }`}
            >
              <span>Ø {dia} mm</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  isTargetAchieved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {res.scrapPercentage}% Scrap
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm">
          <div className="text-xs text-slate-400 font-medium">12.0m Commercial Bars</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{currentResult.totalBarsUsed} Nos</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{currentResult.totalPiecesCount} cut pieces packed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm">
          <div className="text-xs text-slate-400 font-medium">Scrap Percentage</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-black ${
                currentResult.scrapPercentage <= 1.5 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {currentResult.scrapPercentage}%
            </span>
            {currentResult.scrapPercentage <= 1.5 ? (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Target &lt;1.5%
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> Exceeds 1.5%
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{currentResult.totalWasteScrapWeightKg.toFixed(1)} kg waste scrap</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm">
          <div className="text-xs text-slate-400 font-medium">Reusable Offcuts (≥1.0m)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{currentResult.totalReusableOffcutM.toFixed(1)} m</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{currentResult.totalReusableOffcutWeightKg.toFixed(1)} kg for chairs/starters</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm">
          <div className="text-xs text-slate-400 font-medium">Packing Efficiency</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{currentResult.efficiencyPercentage}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{currentResult.totalUsedWeightKg.toFixed(1)} kg net rebar</div>
        </div>
      </div>

      {/* Visual Cutting Pattern Diagrams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Standard 12.0m Commercial Stock Cutting Layouts</span>
          </h4>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Scheduled Cuts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Reusable Offcut (≥1m)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Waste Scrap (&lt;1m)
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {currentResult.bars.map((bar, index) => {
            const stockLen = bar.stockLengthMm || 12000;
            return (
              <div
                key={bar.barIndex}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/50 backdrop-blur-md border border-white/10 dark:border-slate-800/80 hover:border-sky-500/40 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 font-bold border border-slate-700">
                      Stock Bar #{bar.barIndex} (12000 mm)
                    </span>
                    <span className="text-slate-400">{bar.cuts.length} cuts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300">
                      Used: <strong className="text-sky-400">{bar.totalCutLengthMm}mm</strong> ({bar.utilizationPercentage}%)
                    </span>
                    {bar.isReusableOffcut ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        Offcut: {bar.wasteMm}mm (Reusable)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        Scrap: {bar.wasteMm}mm (Waste)
                      </span>
                    )}
                  </div>
                </div>

                {/* 12m Bar Graphic */}
                <div className="relative w-full h-8 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-700/60 p-0.5">
                  {bar.cuts.map((cut, cIdx) => {
                    const widthPct = (cut.lengthMm / stockLen) * 100;
                    const colorClass = pieceColors[cIdx % pieceColors.length];
                    return (
                      <div
                        key={cut.pieceId}
                        style={{ width: `${widthPct}%` }}
                        className={`h-full ${colorClass} rounded-lg border-r flex items-center justify-center text-[10px] font-black px-1 truncate transition-all hover:brightness-125 cursor-pointer`}
                        title={`[${cut.memberTag}] Mark ${cut.barMark}: ${cut.lengthMm}mm (${cut.description})`}
                      >
                        {cut.memberTag} ({cut.lengthMm}mm)
                      </div>
                    );
                  })}

                  {/* Remaining waste / offcut piece */}
                  {bar.wasteMm > 0 && (
                    <div
                      style={{ width: `${(bar.wasteMm / stockLen) * 100}%` }}
                      className={`h-full rounded-lg flex items-center justify-center text-[10px] font-bold px-1 truncate ${
                        bar.isReusableOffcut
                          ? 'bg-emerald-500/40 border border-emerald-400/60 text-emerald-200'
                          : 'bg-rose-500/30 border border-rose-400/50 text-rose-300'
                      }`}
                      title={bar.isReusableOffcut ? `Reusable Offcut: ${bar.wasteMm}mm` : `Waste Scrap: ${bar.wasteMm}mm`}
                    >
                      {bar.wasteMm}mm
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
