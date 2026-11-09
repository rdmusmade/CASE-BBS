'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Rebar2DCanvas } from '@/components/visualizer/Rebar2DCanvas';
import { Rebar3DViewer } from '@/components/visualizer/Rebar3DViewer';
import { calculateRebarShape } from '@/lib/engine/is2502';
import {
  Sparkles,
  ShieldCheck,
  Scissors,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ArrowRight,
  Calculator,
  HardHat,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [selectedShape, setSelectedShape] = useState<string>('51');
  const [dia, setDia] = useState<number>(16);
  const [dimA, setDimA] = useState<number>(300);
  const [dimB, setDimB] = useState<number>(650);
  const [view3D, setView3D] = useState<boolean>(false);

  const calcResult = calculateRebarShape({
    shapeCode: selectedShape,
    dia,
    dimA,
    dimB,
    steelGrade: 'Fe500D',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Background glow meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/15 dark:bg-sky-500/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-indigo-500/15 dark:bg-indigo-500/20 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/80 border border-sky-500/30 backdrop-blur-md shadow-neo-dark-sm">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-black tracking-wide text-sky-500 dark:text-sky-300">
                IS 2502:1963 • IS 456:2000 • IS 13920:2016 • IS 1786:2008
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.15]">
              State-of-the-Art Bar Bending Schedule & <br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Steel Inventory Management
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              SmartBBS Pro delivers 100% accurate structural Bar Bending Schedule generation, sub-type parametric member detailing, A3 engineering sheet exports, and live diameter-wise site stock reconciliation.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <span>Launch BBS Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700/80 backdrop-blur-md shadow-neo-dark-sm transition-all"
              >
                System Admin Login
              </Link>
            </div>
          </div>

          {/* Interactive Live BBS & Rebar Studio Sandbox */}
          <div className="mt-16 max-w-5xl mx-auto rounded-3xl p-6 sm:p-8 bg-white/60 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                  Interactive Engineering Engine
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Live IS 2502 Shape Calculation & Deduction Sandbox
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView3D(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !view3D ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2D Dynamic Vector
                </button>
                <button
                  onClick={() => setView3D(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    view3D ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  3D WebGL Studio
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">IS 2502 Standard Shape Code</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: '20', label: '20 (Straight)' },
                      { code: '21', label: '21 (L-Bar)' },
                      { code: '37', label: '37 (U-Bar)' },
                      { code: '41', label: '41 (Crank)' },
                      { code: '51', label: '51 (135° Stirrup)' },
                      { code: 'CHAIR', label: 'Raft Chair' },
                    ].map((s) => (
                      <button
                        key={s.code}
                        onClick={() => setSelectedShape(s.code)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          selectedShape === s.code
                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Diameter Ø (mm)</label>
                    <select
                      value={dia}
                      onChange={(e) => setDia(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                    >
                      {[8, 10, 12, 16, 20, 25, 32].map((d) => (
                        <option key={d} value={d}>
                          Ø {d} mm ({(d * d / 162.2).toFixed(3)} kg/m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400">Dimension A (mm)</label>
                    <input
                      type="number"
                      value={dimA}
                      onChange={(e) => setDimA(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                {selectedShape !== '20' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Dimension B (mm)</label>
                    <input
                      type="number"
                      value={dimB}
                      onChange={(e) => setDimB(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                )}

                {/* Calculation Output Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>IS 2502 Cl. 5.1.1 Cut Length:</span>
                    <strong className="text-emerald-400 text-base font-black">
                      {calcResult.roundedCutLength} mm
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Theoretical Weight:</span>
                    <strong className="text-sky-400">{calcResult.unitWeight} kg/m</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Bend Deduction Applied:</span>
                    <strong className="text-amber-400">-{calcResult.bendDeductionTotal} mm</strong>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                    {calcResult.formulaDescription}
                  </div>
                </div>
              </div>

              {/* Visualizer Canvas */}
              <div className="lg:col-span-7">
                {view3D ? (
                  <Rebar3DViewer shapeCode={selectedShape} dia={dia} dimA={dimA} dimB={dimB} />
                ) : (
                  <Rebar2DCanvas
                    shapeCode={selectedShape}
                    dia={dia}
                    dimA={dimA}
                    dimB={dimB}
                    calculatedCutLength={calcResult.roundedCutLength}
                    rawCutLength={calcResult.rawCutLength}
                    bendDeductionTotal={calcResult.bendDeductionTotal}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-white/40 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Engineered Specifically for Authentic Indian Standards
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Zero-error structural mathematics, professional A3 engineering sheet exports, and live steel inventory control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm space-y-4 hover:border-sky-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Authentic IS Codes Detailing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Direct compliance with IS 2502:1963 Table II hook allowances (13d/17d), 1d to 4d bend deductions, standard unit weights ($d^2/162.2$), and 25mm round-up rule.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Steel Stocks & Site Reconciliation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Log inward steel procurement and outward site issues by diameter in kg/MT. Reconcile on-site available stock against BBS required tonnage.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 shadow-neo-dark-sm space-y-4 hover:border-purple-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                MNC AEC Parametric Detailing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Multi-span continuous beams with mixed diameter layers (e.g. 2-T16 + 2-T12), stepped & raft footings with top reinforcement, and interactive 2D vector & 3D WebGL inspection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/80 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 SmartBBS Pro. Structural BBS & 1D Cutting Stock Optimization Engine. Pre-configured for Creative Associates.</p>
        </div>
      </footer>
    </div>
  );
}
