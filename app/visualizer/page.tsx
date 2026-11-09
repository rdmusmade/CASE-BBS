'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useAuth } from '@/components/common/Providers';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { AccessRestrictedView } from '@/components/AccessRestrictedView';
import { Rebar2DCanvas } from '@/components/visualizer/Rebar2DCanvas';
import { Rebar3DViewer } from '@/components/visualizer/Rebar3DViewer';
import { calculateRebarShape } from '@/lib/engine/is2502';
import { Eye, Layers, Box, Info } from 'lucide-react';

export default function VisualizerPage() {
  const { user } = useAuth();
  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN' || user?.email === 'admin' || user?.email === 'admin@smartbbs.com';
  const isAccessAllowed =
    isSystemAdmin ||
    (user?.isApprovedByAdmin === true &&
      user?.subscriptionStatus !== 'SUSPENDED' &&
      user?.subscriptionStatus !== 'EXPIRED');

  const [shapeCode, setShapeCode] = useState<string>('51');
  const [dia, setDia] = useState<number>(16);
  const [dimA, setDimA] = useState<number>(250);
  const [dimB, setDimB] = useState<number>(550);
  const [dimC, setDimC] = useState<number>(150);
  const [steelGrade, setSteelGrade] = useState<string>('Fe500D');

  const calcResult = calculateRebarShape({
    shapeCode,
    dia,
    dimA,
    dimB,
    dimC,
    steelGrade,
  });

  const shapesList = [
    { code: '20', name: 'Shape 20: Straight Bar', desc: 'L = A (IS 2502 Cl 5.1)' },
    { code: '21', name: 'Shape 21: L-Bar (90° Bend)', desc: 'L = A + B - 2d' },
    { code: '37', name: 'Shape 37: U-Bar (Two 90° Bends)', desc: 'L = A + 2B - 4d' },
    { code: '38', name: 'Shape 38: U-Bar (180° Hooks)', desc: 'L = A + 2B + 2*Hook180' },
    { code: '41', name: 'Shape 41: Cranked Bar (45°)', desc: 'L = A + 2B + 2(0.42*D_crank) - 4d' },
    { code: '51', name: 'Shape 51: Rect Stirrup (135° Hooks)', desc: 'L = 2(A+B) + 2*Hook135 - Deductions' },
    { code: '61', name: 'Shape 61: Circular Link / Hoop', desc: 'L = π*D + Lap' },
    { code: '71', name: 'Shape 71: 4-Leg Cross Tie', desc: 'L = A + 2*Hook135' },
    { code: '81', name: 'Shape 81: Diamond / Rhombus Tie', desc: 'L = 4*√( (A/2)² + (B/2)² ) + 2*Hook' },
    { code: '86', name: 'Shape 86: Helical Column Spiral', desc: 'L = N*√( (πD)² + P² ) + 2πD + 2*Hook' },
    { code: 'CHAIR', name: 'Raft Spacer Chair Bar', desc: 'L = Head + 2*Leg + 2*Foot - 4(2d)' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 relative">
          {/* Violet Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {!isAccessAllowed ? (
            <AccessRestrictedView />
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 relative z-10 w-full">
              <div className="p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-neo-dark-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    IS 2502:1963 Standard Directory
                  </span>
                  <span className="text-xs text-slate-400">2D Vector & 3D WebGL Rebar Studio</span>
                </div>
                <h1 className="text-2xl font-black text-white">
                  Interactive Rebar Shape Studio
                </h1>
                <p className="text-xs text-slate-400">
                  Explore standard Indian Standard bar profiles, geometric bend deductions (1d, 2d, 3d, 4d), and 25mm round-up logic in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Shape Directory (4 cols) */}
                <div className="lg:col-span-4 space-y-2 max-h-[700px] overflow-y-auto pr-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Standard IS 2502 Shape Codes
                  </span>
                  {shapesList.map((shape) => (
                    <button
                      key={shape.code}
                      onClick={() => setShapeCode(shape.code)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        shapeCode === shape.code
                          ? 'bg-violet-600/20 border-violet-500/80 text-white shadow-lg shadow-violet-500/10'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{shape.name}</div>
                        <div className="text-[10px] text-slate-400">{shape.desc}</div>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-slate-400">
                        {shape.code}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Visualizer & Controls (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Visualizer Preview Card */}
                  <div className="p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-neo-dark-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Shape {shapeCode} — 2D Technical Schematic & 3D WebGL
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        Calculated Cut Length: {calcResult.roundedCutLength} mm
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 2D Canvas */}
                      <div className="h-64 rounded-2xl bg-slate-950/80 border border-slate-800 p-2 overflow-hidden flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 px-2 pt-1 uppercase">2D Scale Canvas</span>
                        <div className="flex-1">
                          <Rebar2DCanvas
                            shapeCode={shapeCode}
                            dia={dia}
                            dimA={dimA}
                            dimB={dimB}
                            dimC={dimC}
                            calculatedCutLength={calcResult.roundedCutLength}
                          />
                        </div>
                      </div>

                      {/* 3D WebGL View */}
                      <div className="h-64 rounded-2xl bg-slate-950/80 border border-slate-800 p-2 overflow-hidden flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 px-2 pt-1 uppercase">3D WebGL Metallic View</span>
                        <div className="flex-1">
                          <Rebar3DViewer
                            shapeCode={shapeCode}
                            dia={dia}
                            dimA={dimA}
                            dimB={dimB}
                            dimC={dimC}
                            calculatedCutLength={calcResult.roundedCutLength}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Parametric Inputs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bar Dia (mm)</label>
                        <select
                          value={dia}
                          onChange={(e) => setDia(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-violet-500"
                        >
                          {[6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40].map((d) => (
                            <option key={d} value={d}>
                              Ø {d} mm
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dim A (mm)</label>
                        <input
                          type="number"
                          step={25}
                          value={dimA}
                          onChange={(e) => setDimA(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dim B (mm)</label>
                        <input
                          type="number"
                          step={25}
                          value={dimB}
                          onChange={(e) => setDimB(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dim C (mm)</label>
                        <input
                          type="number"
                          step={25}
                          value={dimC}
                          onChange={(e) => setDimC(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Math & Code Compliance Formula Output */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs text-slate-400">
                        <span>IS 2502 Formula: </span>
                        <strong className="font-mono text-violet-400">{calcResult.formulaDescription}</strong>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Theoretical Weight (d²/162.2):</span>
                        <strong className="text-slate-200">{calcResult.unitWeight} kg/m</strong>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>IS 2502 Cl. 5.1.1 25mm Round-Up Cut:</span>
                        <strong className="text-emerald-400 text-sm font-black">{calcResult.roundedCutLength} mm</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
