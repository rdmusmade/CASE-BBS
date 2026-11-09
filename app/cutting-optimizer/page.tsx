'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { CuttingStockVisualizer } from '@/components/optimizer/CuttingStockVisualizer';
import { optimizeAllDiameters, CuttingOptimizationResult } from '@/lib/engine/optimizer';
import { GeneratedRebarItem } from '@/lib/engine/members/footing';
import { Scissors, Sliders, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CuttingOptimizerPage() {
  const [items, setItems] = useState<GeneratedRebarItem[]>([]);
  const [results, setResults] = useState<Record<number, CuttingOptimizationResult>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Optimization Parameters
  const [stockLength, setStockLength] = useState<number>(12000);
  const [reusableThreshold, setReusableThreshold] = useState<number>(1000);
  const [kerf, setKerf] = useState<number>(3);

  const runOptimization = (rebarList: GeneratedRebarItem[]) => {
    if (rebarList.length === 0) return;
    const optimized = optimizeAllDiameters(rebarList, {
      stockLengthMm: stockLength,
      reusableThresholdMm: reusableThreshold,
      kerfMm: kerf,
    });
    setResults(optimized);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && data.projects.length > 0) {
          const p = data.projects[0];
          const allItems = p.members.flatMap((m: any) =>
            m.rebarItems.map((r: any) => ({
              ...r,
              description: `${m.memberTag} ${r.remarks || r.barMark}`,
            }))
          );
          setItems(allItems);
          runOptimization(allItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReoptimize = () => {
    runOptimization(items);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex gap-8">
        <Sidebar />

        <main className="flex-1 space-y-6 min-w-0">
          <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    1D Bin Packing Solver
                  </span>
                  <span className="text-xs text-slate-400">First-Fit Decreasing & Best-Fit Heuristics</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  1D Cutting Stock Optimization Engine
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimize scrap to &lt;1.5% on commercial 12.0m (12000mm) bars and generate site bar bender cut patterns.
                </p>
              </div>

              <button
                onClick={handleReoptimize}
                className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/30 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-Solve 1D CSP</span>
              </button>
            </div>

            {/* Parameter adjustments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Commercial Stock Bar Length</label>
                <select
                  value={stockLength}
                  onChange={(e) => setStockLength(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                >
                  <option value={12000}>12.0 m (12000 mm Standard Commercial Bar)</option>
                  <option value={9000}>9.0 m (9000 mm Special Order)</option>
                  <option value={14000}>14.0 m (14000 mm Trailer Stock)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Reusable Offcut Threshold</label>
                <select
                  value={reusableThreshold}
                  onChange={(e) => setReusableThreshold(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                >
                  <option value={1000}>≥ 1000 mm (1.0m for chairs/spacers/starters)</option>
                  <option value={750}>≥ 750 mm (0.75m for small ties)</option>
                  <option value={1500}>≥ 1500 mm (1.5m for lintels/chajjas)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Cutting Blade Saw Kerf (mm)</label>
                <select
                  value={kerf}
                  onChange={(e) => setKerf(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                >
                  <option value={3}>3 mm (Shearing Machine / Fast Saw)</option>
                  <option value={5}>5 mm (Abrasive Wheel Cutter)</option>
                  <option value={0}>0 mm (Theoretical Zero Kerf)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visualizer Component */}
          <CuttingStockVisualizer results={results} />
        </main>
      </div>
    </div>
  );
}
