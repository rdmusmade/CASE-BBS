'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getScaledShapeDrawing } from '@/lib/drawings/rebarDrawingUtils';

export interface RebarShapeProps {
  shapeCode: string;
  dia: number;
  dimA: number;
  dimB?: number;
  dimC?: number;
  dimD?: number;
  dimE?: number;
  calculatedCutLength?: number;
  rawCutLength?: number;
  bendDeductionTotal?: number;
  interactive?: boolean;
}

export const Rebar2DCanvas: React.FC<RebarShapeProps> = ({
  shapeCode,
  dia,
  dimA,
  dimB = 0,
  dimC = 0,
  dimD = 0,
  dimE = 0,
  calculatedCutLength,
  rawCutLength,
  bendDeductionTotal = 0,
}) => {
  const code = (shapeCode || '20').toUpperCase();

  // Color mapping based on bar diameter
  const diaColor = useMemo(() => {
    switch (dia) {
      case 8:
        return '#38bdf8'; // Sky blue
      case 10:
        return '#0ea5e9'; // Cyan
      case 12:
        return '#10b981'; // Emerald
      case 16:
        return '#f59e0b'; // Amber
      case 20:
        return '#f97316'; // Orange
      case 25:
        return '#ef4444'; // Red
      case 32:
      case 36:
      case 40:
        return '#a855f7'; // Purple
      default:
        return '#0ea5e9';
    }
  }, [dia]);

  const drawing = useMemo(() => {
    return getScaledShapeDrawing(code, dia, dimA, dimB, dimC, dimD, dimE);
  }, [code, dia, dimA, dimB, dimC, dimD, dimE]);

  const strokeWidth = Math.max(Math.min(dia / 2.5, 6), 3);

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md p-4 flex flex-col justify-between overflow-hidden shadow-inner">
      {/* Top Header Tags */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            IS 2502 Shape {code}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-mono font-bold text-slate-900 border"
            style={{ backgroundColor: diaColor, borderColor: diaColor }}
          >
            Ø {dia} mm
          </span>
        </div>

        {calculatedCutLength && (
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">IS 2502 Cut Length</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {calculatedCutLength} mm
            </span>
            {bendDeductionTotal !== 0 && (
              <span className="text-[10px] text-rose-400 block font-mono">
                Bend Ded: {bendDeductionTotal}mm
              </span>
            )}
          </div>
        )}
      </div>

      {/* SVG Canvas Drawing */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <svg
          viewBox={drawing.viewBox}
          className="w-full h-full max-h-[170px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Engineering Grid Pattern in Background */}
          <defs>
            <pattern id="engGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
          </defs>

          <rect width="100%" height="100%" fill="url(#engGrid)" opacity="0.4" />

          {/* Dimension Lines */}
          {drawing.dimensionLines.map((dLine, idx) => (
            <g key={`dline-${idx}`}>
              <line
                x1={dLine.x1}
                y1={dLine.y1}
                x2={dLine.x2}
                y2={dLine.y2}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
            </g>
          ))}

          {/* Animated Rebar Geometry Path */}
          <motion.path
            d={drawing.svgPath}
            stroke={diaColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            filter="drop-shadow(0 0 6px rgba(14, 165, 233, 0.4))"
          />

          {/* Dimension & Notation Labels */}
          {drawing.annotations.map((ann, idx) => (
            <text
              key={`ann-${idx}`}
              x={ann.x}
              y={ann.y}
              textAnchor={ann.anchor || 'middle'}
              fill={ann.type === 'hook' ? '#38bdf8' : ann.type === 'note' ? '#94a3b8' : '#f8fafc'}
              fontSize={ann.type === 'note' ? '10' : '11'}
              fontFamily="monospace"
              fontWeight="600"
              className="select-none"
            >
              {ann.text}
            </text>
          ))}
        </svg>
      </div>

      {/* Footer Notation */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 z-10">
        <span className="truncate">
          {drawing.hookCallout || `Standard IS 2502 Detailing`}
        </span>
        <span className="font-mono text-slate-300">
          Scale: 1:25 (Vector)
        </span>
      </div>
    </div>
  );
};
