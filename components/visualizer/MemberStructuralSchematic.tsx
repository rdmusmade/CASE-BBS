'use client';

import React, { useState } from 'react';
import { Layers, Eye, Compass, Sun, Moon } from 'lucide-react';

export interface MemberSchematicProps {
  category: 'FOOTING' | 'BEAM' | 'COLUMN' | 'SLAB' | 'RCC_PARDI' | 'PLAIN_PCC_MESH' | 'STAIRCASE' | 'WATER_TANK';
  subType?: string;
  memberTag: string;
  params: {
    // General
    length?: number;
    width?: number;
    depth?: number;
    height?: number;
    clearCover?: number;
    concreteGrade?: string;
    steelGrade?: string;

    // Footing
    footingType?: string;
    stepLength2?: number;
    stepWidth2?: number;
    stepDepth1?: number;
    stepDepth2?: number;
    edgeDepth?: number;
    strapBeamLength?: number;
    strapBeamWidth?: number;
    strapBeamDepth?: number;
    strapTopDia?: number;
    strapTopCount?: number;
    strapBottomDia?: number;
    strapBottomCount?: number;
    strapStirrupDia?: number;
    strapStirrupSpacing?: number;

    // Dual Footings for Strap
    f1Length?: number;
    f1Width?: number;
    f1Depth?: number;
    f1DiaX?: number;
    f1SpacingX?: number;
    f1DiaY?: number;
    f1SpacingY?: number;

    f2Length?: number;
    f2Width?: number;
    f2Depth?: number;
    f2DiaX?: number;
    f2SpacingX?: number;
    f2DiaY?: number;
    f2SpacingY?: number;

    // Combined Footing
    col1WidthX?: number;
    col1WidthY?: number;
    col1Offset?: number;
    col2WidthX?: number;
    col2WidthY?: number;
    col2Offset?: number;
    colSpacing?: number;

    // Pile Foundation
    pileCount?: number;
    pileShape?: 'CIRCULAR' | 'RECTANGULAR';
    pileDia?: number;
    pileLength?: number;
    pileVerticalDia?: number;
    pileVerticalCount?: number;
    pileSpiralDia?: number;
    pileSpiralPitch?: number;
    pileCapShape?: 'SQUARE' | 'RECTANGULAR' | 'TRIANGULAR' | 'CIRCULAR';
    pileCapLength?: number;
    pileCapWidth?: number;
    pileCapDepth?: number;

    // General Footing Rebar
    bottomDiaX?: number;
    bottomSpacingX?: number;
    bottomDiaY?: number;
    bottomSpacingY?: number;
    hasTopMesh?: boolean;
    topDiaX?: number;
    topSpacingX?: number;
    topDiaY?: number;
    topSpacingY?: number;
    includeChairs?: boolean;

    // Beam
    beamType?: string;
    clearSpan?: number;
    spans?: Array<{
      spanIndex: number;
      spanLength: number;
      width?: number;
      depth?: number;
      topMainDia?: number;
      topMainCount?: number;
      bottomMainDia?: number;
      bottomMainCount?: number;
      stirrupSpacingSupport?: number;
      stirrupSpacingMid?: number;
    }>;
    span2Length?: number;
    span3Length?: number;
    cantileverLengthRight?: number;
    supportWidthLeft?: number;
    supportWidthRight?: number;
    topMainDia?: number;
    topMainCount?: number;
    topMainDia2?: number;
    topMainCount2?: number;
    bottomMainDia?: number;
    bottomMainCount?: number;
    bottomMainDia2?: number;
    bottomMainCount2?: number;
    topExtraLeftDia?: number;
    topExtraLeftCount?: number;
    topExtraRightDia?: number;
    topExtraRightCount?: number;
    bottomExtraMidDia?: number;
    bottomExtraMidCount?: number;
    hasCrankedBars?: boolean;
    crankedBarDia?: number;
    crankedBarCount?: number;
    stirrupDia?: number;
    stirrupSpacingSupport?: number;
    stirrupSpacingMid?: number;
    stirrupType?: string;

    // Column
    columnShape?: string;
    colMainDia?: number;
    colMainCount?: number;
    colCornerDia?: number;
    colCornerCount?: number;
    colFaceDia?: number;
    colFaceCount?: number;
    colTieDia?: number;
    colTieSpacing?: number;

    // Slab
    slabType?: string;
    slabLx?: number;
    slabLy?: number;
    shortSpanLx?: number;
    longSpanLy?: number;
    thickness?: number;
    slabThick?: number;
    slabMainDia?: number;
    slabMainSpacing?: number;
    slabDistDia?: number;
    slabDistSpacing?: number;
    useAlternateCrank?: boolean;
    topMeshDiaX?: number;
    topMeshSpacingX?: number;
    topMeshDiaY?: number;
    topMeshSpacingY?: number;

    // Pardi / PCC / Stair / Water Tank
    meshDiaX?: number;
    meshSpacingX?: number;
    pardiThickness?: number;
    vertMainDia?: number;
    vertMainSpacing?: number;
    horizDistDia?: number;
    horizDistSpacing?: number;
    stairWaist?: number;
    stairTread?: number;
    stairRiser?: number;
    stairSteps?: number;
    tankWallLength?: number;
    tankWallHeight?: number;
    tankWallThickness?: number;
  };
}

export const MemberStructuralSchematic: React.FC<MemberSchematicProps> = ({
  category,
  subType,
  memberTag,
  params,
}) => {
  const [viewMode, setViewMode] = useState<'SECTION' | 'PLAN'>('SECTION');
  const [cadTheme, setCadTheme] = useState<'WHITE' | 'DARK'>('WHITE'); // Default to MNC White CAD drafting standard

  const width = 560;
  const height = 300;

  const isWhite = cadTheme === 'WHITE';
  const bgCanvas = isWhite ? 'bg-white' : 'bg-slate-950';
  const concreteFill = isWhite ? '#f8fafc' : '#0f172a';
  const concreteStroke = isWhite ? '#0f172a' : '#64748b';
  const blindingFill = isWhite ? '#f1f5f9' : '#1e293b';
  const textDark = isWhite ? '#0f172a' : '#f8fafc';
  const textMuted = isWhite ? '#475569' : '#94a3b8';
  const rebarNavy = isWhite ? '#1d4ed8' : '#38bdf8';
  const rebarRed = isWhite ? '#dc2626' : '#f87171';
  const rebarGreen = isWhite ? '#059669' : '#34d399';
  const rebarAmber = isWhite ? '#d97706' : '#f59e0b';
  const dimColor = isWhite ? '#475569' : '#94a3b8';
  const balloonBg = isWhite ? '#ffffff' : '#0f172a';
  const balloonBorder = isWhite ? '#0f172a' : '#38bdf8';

  // Architectural Dimensioning Helpers (45° slash ticks per IS 962 / SP 34)
  const renderDimH = (x1: number, x2: number, y: number, text: string, above = true) => (
    <g key={`dh-${x1}-${x2}-${y}`}>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={dimColor} strokeWidth="1" />
      <line x1={x1 - 3} y1={y + 3} x2={x1 + 3} y2={y - 3} stroke={dimColor} strokeWidth="1.5" />
      <line x1={x2 - 3} y1={y + 3} x2={x2 + 3} y2={y - 3} stroke={dimColor} strokeWidth="1.5" />
      <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={dimColor} strokeWidth="0.8" opacity="0.6" />
      <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={dimColor} strokeWidth="0.8" opacity="0.6" />
      <text x={(x1 + x2) / 2} y={above ? y - 4 : y + 12} fill={textDark} fontSize="9.5" fontWeight="bold" textAnchor="middle">
        {text}
      </text>
    </g>
  );

  const renderDimV = (x: number, y1: number, y2: number, text: string, right = true) => (
    <g key={`dv-${x}-${y1}-${y2}`}>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={dimColor} strokeWidth="1" />
      <line x1={x - 3} y1={y1 + 3} x2={x + 3} y2={y1 - 3} stroke={dimColor} strokeWidth="1.5" />
      <line x1={x - 3} y1={y2 + 3} x2={x + 3} y2={y2 - 3} stroke={dimColor} strokeWidth="1.5" />
      <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke={dimColor} strokeWidth="0.8" opacity="0.6" />
      <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke={dimColor} strokeWidth="0.8" opacity="0.6" />
      <text x={right ? x + 6 : x - 6} y={(y1 + y2) / 2 + 3.5} fill={textDark} fontSize="9.5" fontWeight="bold" textAnchor={right ? 'start' : 'end'}>
        {text}
      </text>
    </g>
  );

  const renderBarBalloon = (bx: number, by: number, mark: string, tx: number, ty: number, label?: string) => {
    const midX = bx > tx ? bx - 8 : bx + 8;
    return (
      <g key={`bb-${bx}-${by}-${mark}`}>
        <line x1={tx} y1={ty} x2={midX} y2={by} stroke={dimColor} strokeWidth="1" />
        <line x1={midX} y1={by} x2={bx} y2={by} stroke={dimColor} strokeWidth="1" />
        <circle cx={tx} cy={ty} r="2" fill={concreteStroke} />
        <circle cx={bx} cy={by} r="7.5" fill={balloonBg} stroke={balloonBorder} strokeWidth="1.5" />
        <text x={bx} y={by + 3.5} fill={textDark} fontSize="8.5" fontWeight="bold" textAnchor="middle">{mark}</text>
        {label && (
          <text x={bx > tx ? bx + 11 : bx - 11} y={by + 3.5} fill={textDark} fontSize="9" fontWeight="bold" textAnchor={bx > tx ? 'start' : 'end'}>
            {label}
          </text>
        )}
      </g>
    );
  };

  // -------------------------------------------------------------
  // 1. FOOTINGS SCHEMATIC (ISOLATED, TRAPEZOIDAL, STRAP, COMBINED, RAFT, PILE)
  // -------------------------------------------------------------
  if (category === 'FOOTING') {
    const fType = (params.footingType || subType || 'ISOLATED').toUpperCase();
    const L = params.length || 2400;
    const B = params.width || 2400;
    const D = params.depth || 600;
    const cover = params.clearCover || 50;

    const diaX = params.bottomDiaX || 12;
    const spX = params.bottomSpacingX || 150;
    const diaY = params.bottomDiaY || 12;
    const spY = params.bottomSpacingY || 150;

    // 1A. SLOPED / TRAPEZOIDAL FOOTING
    if (fType.includes('SLOPE') || fType.includes('TRAPEZOIDAL')) {
      const edgeD = Math.max(params.edgeDepth || 200, 150); // IS 456 Cl. 34.1.2 min 150mm

      if (viewMode === 'PLAN') {
        return (
          <div className="w-full h-full flex flex-col">
            <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Trapezoidal Footing Plan`} />
            <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
              <rect x="70" y="45" width="420" height="200" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" rx="3" />
              <rect x="235" y="115" width="90" height="60" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2" />
              
              {/* Crease slope lines from pedestal to outer corners */}
              <line x1="70" y1="45" x2="235" y2="115" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="490" y1="45" x2="325" y2="115" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="70" y1="245" x2="235" y2="175" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="490" y1="245" x2="325" y2="175" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Bottom mesh indicator grid */}
              {[120, 170, 220, 340, 390, 440].map((gx) => (
                <line key={`gx-${gx}`} x1={gx} y1="55" x2={gx} y2="235" stroke={rebarNavy} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              ))}
              {[80, 100, 190, 210].map((gy) => (
                <line key={`gy-${gy}`} x1="80" y1={gy} x2="480" y2={gy} stroke={rebarAmber} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              ))}

              {renderDimH(70, 490, 28, `Footing Length L = ${L} mm (Cover: ${cover}mm)`, true)}
              {renderDimV(505, 45, 245, `Width B = ${B} mm`, true)}

              <text x="280" y="150" fill={rebarAmber} fontSize="10.5" fontWeight="bold" textAnchor="middle">
                Column Pedestal
              </text>
              <text x="280" y="272" fill={textDark} fontSize="10" fontWeight="bold" textAnchor="middle">
                Bottom Mesh: Ø{diaX}@{spX}mm (X) + Ø{diaY}@{spY}mm (Y)
              </text>
            </svg>
          </div>
        );
      }

      // Section View
      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Trapezoidal Footing Section (MNC CAD Standard)`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* 75mm PCC Blinding Layer */}
            <rect x="60" y="220" width="440" height="16" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
            <text x="280" y="232" fill={textMuted} fontSize="9" textAnchor="middle">75mm PCC (1:4:8) Blinding Sub-Base</text>

            {/* Trapezoidal Formwork Body */}
            <path
              d="M 60 165 L 230 75 L 230 30 L 330 30 L 330 75 L 500 165 L 500 220 L 60 220 Z"
              fill={concreteFill}
              stroke={concreteStroke}
              strokeWidth="2.5"
            />

            {/* Column Starter Dowels with 90° Hook into Base */}
            <path d="M 250 30 L 250 206 L 210 206" fill="none" stroke={rebarAmber} strokeWidth="3" strokeLinecap="round" />
            <path d="M 310 30 L 310 206 L 350 206" fill="none" stroke={rebarAmber} strokeWidth="3" strokeLinecap="round" />
            <line x1="245" y1="45" x2="315" y2="45" stroke={rebarAmber} strokeWidth="1.5" />
            <line x1="245" y1="65" x2="315" y2="65" stroke={rebarAmber} strokeWidth="1.5" />

            {/* Bottom Tension Mesh (Navy) with 90° Upstands up to d_edge */}
            <path
              d="M 72 170 L 72 210 Q 72 213 75 213 L 485 213 Q 488 213 488 210 L 488 170"
              fill="none"
              stroke={rebarNavy}
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Transverse Bottom Bars (Circles) */}
            {[105, 145, 185, 225, 265, 305, 345, 385, 425, 465].map((cx) => (
              <circle key={cx} cx={cx} cy="204" r="3.5" fill={rebarAmber} stroke={concreteStroke} strokeWidth="1.5" />
            ))}

            {/* Architectural Dimensions */}
            {renderDimV(48, 165, 220, `d_edge = ${edgeD} mm (min 150 Cl. 34.1.2)`, false)}
            {renderDimV(512, 30, 220, `Total Depth D = ${D} mm`, true)}
            {renderDimH(60, 500, 255, `Footing Length L = ${L} mm (Cover = ${cover}mm)`, false)}

            {/* Bar Balloons */}
            {renderBarBalloon(110, 140, '1', 110, 213, `Bottom Mesh: Ø${diaX}@${spX} c/c (B1)`)}
            {renderBarBalloon(380, 50, '3', 310, 50, 'Column Starter Dowels (Ld Anchor)')}

            {/* Single Mesh Confirmation Note */}
            <rect x="170" y="272" width="220" height="18" fill={isWhite ? '#f1f5f9' : '#0f172a'} stroke={isWhite ? '#cbd5e1' : '#334155'} rx="4" />
            <text x="280" y="284.5" fill={textDark} fontSize="9" fontWeight="bold" textAnchor="middle">
              ✓ Single bottom mesh (Top mesh omitted per IS 456 Cl. 34)
            </text>
          </svg>
        </div>
      );
    }

    // 1B. STEPPED FOOTING
    if (fType.includes('STEP')) {
      const sL1 = params.length || 2400;
      const sL2 = params.stepLength2 || 1500;
      const sD1 = params.stepDepth1 || 350;
      const sD2 = params.stepDepth2 || 250;

      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Stepped Footing Section`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* Blinding */}
            <rect x="50" y="215" width="460" height="12" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
            <text x="280" y="225" fill={textMuted} fontSize="9" textAnchor="middle">75mm PCC (1:4:8) Blinding Sub-Base</text>

            {/* Lower Step */}
            <rect x="50" y="145" width="460" height="70" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />
            
            {/* Upper Step */}
            <rect x="150" y="85" width="260" height="60" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

            {/* Column Pedestal */}
            <rect x="235" y="35" width="90" height="50" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Lower Mesh (Navy) */}
            <path d="M 65 160 L 65 205 L 495 205 L 495 160" fill="none" stroke={rebarNavy} strokeWidth="3" />
            {[100, 150, 200, 250, 300, 350, 400, 450].map((cx) => (
              <circle key={`step-b-${cx}`} cx={cx} cy="198" r="3" fill={rebarAmber} />
            ))}

            {/* Upper Step Cage (Red) */}
            <path d="M 165 140 L 165 95 L 395 95 L 395 140" fill="none" stroke={rebarRed} strokeWidth="2.5" />

            {/* Column Dowels */}
            <path d="M 255 35 L 255 200 L 225 200" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 305 35 L 305 200 L 335 200" fill="none" stroke={rebarAmber} strokeWidth="2.5" />

            {renderDimH(50, 510, 245, `Lower Step L1 = ${sL1} mm (D1 = ${sD1}mm)`, false)}
            {renderDimH(150, 410, 75, `Upper Step L2 = ${sL2} mm (D2 = ${sD2}mm)`, true)}
            {renderBarBalloon(160, 120, '1', 65, 205, `Lower Mesh: Ø${diaX}@${spX} c/c`)}
            {renderBarBalloon(400, 120, '3', 395, 95, 'Upper Step Reinforcement Cage')}
          </svg>
        </div>
      );
    }

    // 1C. STRAP FOOTING (FOOTING 1 + STRAP BEAM + FOOTING 2)
    if (fType.includes('STRAP')) {
      const f1L = params.f1Length || 1800;
      const f1D = params.f1Depth || 500;
      const f2L = params.f2Length || 2200;
      const f2D = params.f2Depth || 600;
      const sLen = params.strapBeamLength || 3500;
      const sDep = params.strapBeamDepth || 550;

      if (viewMode === 'PLAN') {
        return (
          <div className="w-full h-full flex flex-col">
            <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Strap Footing Plan`} />
            <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
              {/* Footing 1 (Left Exterior) */}
              <rect x="40" y="60" width="130" height="170" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="3" />
              <rect x="85" y="125" width="40" height="40" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarAmber} strokeWidth="1.5" />
              <text x="105" y="90" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">F1 (Exterior)</text>
              <text x="105" y="105" fill={textMuted} fontSize="9" textAnchor="middle">{f1L}x{params.f1Width || f1L}mm</text>

              {/* Connecting Strap Beam */}
              <rect x="170" y="120" width="200" height="50" fill={isWhite ? '#f8fafc' : '#1e293b'} stroke={rebarRed} strokeWidth="2" />
              <text x="270" y="150" fill={rebarRed} fontSize="10.5" fontWeight="bold" textAnchor="middle">
                Strap Beam ({sLen}mm Clear Span)
              </text>

              {/* Footing 2 (Right Interior) */}
              <rect x="370" y="50" width="150" height="190" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="3" />
              <rect x="425" y="120" width="40" height="40" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarAmber} strokeWidth="1.5" />
              <text x="445" y="80" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">F2 (Interior)</text>
              <text x="445" y="95" fill={textMuted} fontSize="9" textAnchor="middle">{f2L}x{params.f2Width || f2L}mm</text>

              {renderDimH(40, 520, 260, `Total Footprint Span = ${f1L + sLen + f2L} mm`, false)}
            </svg>
          </div>
        );
      }

      // Section View
      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Strap Footing & Connecting Beam Section`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* 75mm Blinding under both footings */}
            <rect x="35" y="215" width="130" height="12" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
            <rect x="385" y="215" width="140" height="12" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />

            {/* Footing 1 (Left) */}
            <rect x="35" y="120" width="130" height="95" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />
            <rect x="80" y="55" width="40" height="65" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Connecting Strap Beam Body */}
            <rect x="100" y="105" width="360" height="75" fill={concreteFill} stroke={rebarRed} strokeWidth="2" />

            {/* Footing 2 (Right) */}
            <rect x="385" y="105" width="140" height="110" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />
            <rect x="435" y="45" width="40" height="60" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Strap Beam Top Tension Bars (Continuous Through Beam into Both Footings) */}
            <path d="M 55 180 L 55 115 L 505 115 L 505 180" fill="none" stroke={rebarRed} strokeWidth="3.5" strokeLinecap="round" />
            
            {/* Strap Beam Bottom Nominal Bars */}
            <line x1="60" y1="170" x2="500" y2="170" stroke={rebarGreen} strokeWidth="2.5" />

            {/* Strap Beam Stirrups */}
            {[180, 210, 240, 270, 300, 330, 360].map((sx) => (
              <line key={`sst-${sx}`} x1={sx} y1="117" x2={sx} y2="173" stroke={rebarAmber} strokeWidth="1.5" />
            ))}

            {/* Footing 1 & 2 Bottom Mesh */}
            <path d="M 45 150 L 45 205 L 155 205 L 155 150" fill="none" stroke={rebarNavy} strokeWidth="2.5" />
            <path d="M 395 140 L 395 205 L 515 205 L 515 140" fill="none" stroke={rebarNavy} strokeWidth="2.5" />

            {/* Dimensions */}
            {renderDimH(35, 165, 245, `F1: ${f1L}mm (D=${f1D})`, false)}
            {renderDimH(165, 385, 90, `Strap Beam Clear L = ${sLen}mm (D=${sDep})`, true)}
            {renderDimH(385, 525, 245, `F2: ${f2L}mm (D=${f2D})`, false)}

            {renderBarBalloon(280, 70, '1', 280, 115, `Top Tension: ${params.strapTopCount || 4}-T${params.strapTopDia || 20} Cont.`)}
            {renderBarBalloon(280, 195, '2', 280, 170, `Bottom Nominal: ${params.strapBottomCount || 3}-T${params.strapBottomDia || 16}`)}
          </svg>
        </div>
      );
    }

    // 1C. COMBINED FOOTING
    if (fType.includes('COMB')) {
      const c1x = params.col1WidthX || 400;
      const c2x = params.col2WidthX || 400;
      const spCol = params.colSpacing || 3200;

      if (viewMode === 'PLAN') {
        return (
          <div className="w-full h-full flex flex-col">
            <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Combined Footing Plan`} />
            <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
              <rect x="50" y="55" width="460" height="180" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="3" />
              <rect x="120" y="115" width="60" height="60" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2" />
              <text x="150" y="105" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">Col 1 ({c1x}mm)</text>
              <rect x="360" y="115" width="60" height="60" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2" />
              <text x="390" y="105" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">Col 2 ({c2x}mm)</text>
              {renderDimH(150, 390, 185, `Column c/c Spacing = ${spCol} mm`, true)}
              {renderDimH(50, 510, 35, `L = ${L} mm • B = ${B} mm`, true)}
            </svg>
          </div>
        );
      }

      // Section View
      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Combined Footing Section`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="50" y="215" width="460" height="12" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
            <rect x="50" y="100" width="460" height="115" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />
            
            <rect x="120" y="40" width="55" height="60" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />
            <rect x="365" y="40" width="55" height="60" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Column Starter Bars */}
            <path d="M 130 40 L 130 205 L 105 205" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 165 40 L 165 205 L 190 205" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 375 40 L 375 205 L 350 205" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 410 40 L 410 205 L 435 205" fill="none" stroke={rebarAmber} strokeWidth="2.5" />

            {/* Top Hogging Rebar Between Columns */}
            <path d="M 100 115 L 440 115" stroke={rebarRed} strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Bottom Tension Mesh */}
            <path d="M 62 140 L 62 205 L 498 205 L 498 140" fill="none" stroke={rebarNavy} strokeWidth="3" />

            {renderDimH(147, 392, 30, `Col Spacing = ${spCol} mm`, true)}
            {renderDimH(50, 510, 245, `Total L = ${L} mm • Depth D = ${D} mm`, false)}
            {renderBarBalloon(270, 75, '1', 270, 115, 'Top Hogging Rebar Between Columns')}
          </svg>
        </div>
      );
    }

    // 1D. PILE FOUNDATION & PILE CAP
    if (fType.includes('PILE')) {
      const pCnt = params.pileCount || 4;
      const pDia = params.pileDia || 500;
      const capD = params.pileCapDepth || D;

      if (viewMode === 'PLAN') {
        return (
          <div className="w-full h-full flex flex-col">
            <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — ${pCnt}-Pile Foundation Plan`} />
            <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
              <rect x="130" y="35" width="300" height="230" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="4" />
              {pCnt >= 4 && (
                <>
                  <circle cx="205" cy="95" r="30" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
                  <circle cx="355" cy="95" r="30" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
                  <circle cx="205" cy="195" r="30" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
                  <circle cx="355" cy="195" r="30" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
                  <line x1="205" y1="95" x2="355" y2="95" stroke={dimColor} strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="205" y1="95" x2="205" y2="195" stroke={dimColor} strokeWidth="1" strokeDasharray="2 2" />
                </>
              )}
              {pCnt === 2 && (
                <>
                  <circle cx="210" cy="150" r="32" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
                  <circle cx="350" cy="150" r="32" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
                </>
              )}
              {pCnt === 1 && (
                <circle cx="280" cy="150" r="35" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={rebarNavy} strokeWidth="2.5" />
              )}
              <rect x="250" y="125" width="60" height="50" fill={isWhite ? '#cbd5e1' : '#334155'} stroke={rebarAmber} strokeWidth="2" />
              <text x="280" y="155" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">Column</text>
              <text x="280" y="22" fill={textDark} fontSize="11" fontWeight="bold" textAnchor="middle">
                {pCnt} Nos Ø{pDia}mm Piles • Pile Cap {L}x{B}mm
              </text>
            </svg>
          </div>
        );
      }

      // Section View
      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Pile Foundation Section`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="70" y="50" width="420" height="90" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />
            <rect x="240" y="15" width="80" height="35" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Piles */}
            <rect x="120" y="135" width="60" height="120" fill={concreteFill} stroke={rebarNavy} strokeWidth="2" />
            <rect x="380" y="135" width="60" height="120" fill={concreteFill} stroke={rebarNavy} strokeWidth="2" />

            {/* Pile Vertical Dowels Anchoring into Cap */}
            <path d="M 130 250 L 130 75 L 160 75" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 170 250 L 170 75 L 140 75" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 390 250 L 390 75 L 420 75" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
            <path d="M 430 250 L 430 75 L 400 75" fill="none" stroke={rebarAmber} strokeWidth="2.5" />

            {/* Pile Cap Bottom Mat */}
            <path d="M 85 90 L 85 130 L 475 130 L 475 90" fill="none" stroke={rebarNavy} strokeWidth="3" />

            {renderDimV(500, 50, 140, `Cap Depth D = ${capD} mm`, true)}
            <text x="150" y="270" fill={textDark} fontSize="10" textAnchor="middle">Pile 1 (Ø{pDia})</text>
            <text x="410" y="270" fill={textDark} fontSize="10" textAnchor="middle">Pile 2 (Ø{pDia})</text>
          </svg>
        </div>
      );
    }

    // 1E. RAFT FOUNDATION / STANDARD ISOLATED FOOTING
    const isRaft = fType.includes('RAFT');
    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — ${isRaft ? 'Raft Foundation' : 'Isolated Footing'}`} />
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
          <rect x="60" y="215" width="440" height="14" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
          <rect x="60" y="80" width="440" height="135" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="2" />
          <rect x="240" y="30" width="80" height="50" fill={isWhite ? '#e2e8f0' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

          {/* Bottom Mesh U-Bar */}
          <path d="M 75 125 L 75 204 L 485 204 L 485 125" fill="none" stroke={rebarNavy} strokeWidth="3.5" strokeLinecap="round" />
          {[110, 160, 210, 260, 310, 360, 410, 460].map((cx) => (
            <circle key={cx} cx={cx} cy="198" r="3.5" fill={rebarAmber} stroke={concreteStroke} strokeWidth="1.5" />
          ))}

          {/* Top Mesh (if Raft) with 3D Spacer Chairs */}
          {isRaft && (
            <>
              <path d="M 75 160 L 75 92 L 485 92 L 485 160" fill="none" stroke={rebarRed} strokeWidth="3" strokeLinecap="round" />
              <g stroke={rebarGreen} strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M 140 204 L 155 204 L 165 94 L 195 94 L 205 204 L 220 204" />
                <path d="M 340 204 L 355 204 L 365 94 L 395 94 L 405 204 L 420 204" />
              </g>
              <text x="280" y="112" fill={rebarGreen} fontSize="10" fontWeight="bold" textAnchor="middle">
                Top Mat with 3D Spacer Chairs @ 1m Grid
              </text>
            </>
          )}

          {/* Column Dowels */}
          <path d="M 255 30 L 255 200 L 225 200" fill="none" stroke={rebarAmber} strokeWidth="3" />
          <path d="M 305 30 L 305 200 L 335 200" fill="none" stroke={rebarAmber} strokeWidth="3" />

          {renderDimH(60, 500, 245, `L = ${L} mm • Depth D = ${D} mm (Cover: ${cover}mm)`, false)}
          <text x="280" y="272" fill={textDark} fontSize="10" textAnchor="middle">
            Bottom Mesh: Ø{diaX}@{spX}mm (X) + Ø{diaY}@{spY}mm (Y)
          </text>
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. BEAMS SCHEMATIC (SIMPLY SUPPORTED, CANTILEVER, CONTINUOUS)
  // -------------------------------------------------------------
  if (category === 'BEAM') {
    const bType = (params.beamType || subType || 'SIMPLY_SUPPORTED').toUpperCase();
    const L1 = params.clearSpan || 5000;
    const b = params.width || 300;
    const D = params.depth || 600;
    const isCant = bType.includes('CANTILEVER') && !bType.includes('CONT');
    const isCont = bType.includes('CONT');

    const topDia = params.topMainDia || 16;
    const topCnt = params.topMainCount || 2;
    const botDia = params.bottomMainDia || 20;
    const botCnt = params.bottomMainCount || 3;
    const sDia = params.stirrupDia || 8;
    const sSup = params.stirrupSpacingSupport || 100;
    const sMid = params.stirrupSpacingMid || 175;

    // 2A. CANTILEVER BEAM
    if (isCant) {
      if (viewMode === 'PLAN') {
        // Cross-Section View
        return (
          <div className="w-full h-full flex flex-col">
            <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Cantilever Beam Cross-Section`} />
            <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
              <rect x="210" y="45" width="140" height="200" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" rx="4" />
              <rect x="225" y="60" width="110" height="170" fill="none" stroke={rebarAmber} strokeWidth="2.5" rx="3" />
              {/* Top tension rebar */}
              <circle cx="242" cy="76" r="6" fill={rebarRed} stroke={concreteStroke} strokeWidth="1.5" />
              <circle cx="318" cy="76" r="6" fill={rebarRed} stroke={concreteStroke} strokeWidth="1.5" />
              {/* Bottom nominal bars */}
              <circle cx="242" cy="214" r="5" fill={rebarGreen} stroke={concreteStroke} strokeWidth="1.5" />
              <circle cx="318" cy="214" r="5" fill={rebarGreen} stroke={concreteStroke} strokeWidth="1.5" />

              {renderDimH(210, 350, 30, `Width b = ${b} mm`, true)}
              {renderDimV(365, 45, 245, `D = ${D} mm`, true)}
              <text x="280" y="270" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">
                Top Tension: {topCnt}-T{topDia} • Bottom Hanger: {botCnt}-T{botDia}
              </text>
            </svg>
          </div>
        );
      }

      // Section / Elevation View
      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Cantilever Beam Detailing (Fixed Support on Left)`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* Fixed Support Column on Left */}
            <rect x="40" y="35" width="80" height="225" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="2" />
            <text x="80" y="25" fill={rebarAmber} fontSize="10" fontWeight="bold" textAnchor="middle">Fixed Support</text>

            {/* Cantilever Body */}
            <path d="M 120 75 L 500 75 L 500 170 L 120 170 Z" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

            {/* Top Tension Main Rebar: Anchored into column (Ld) and 90° bend down at tip */}
            <path d="M 60 170 L 60 85 L 488 85 L 488 150" fill="none" stroke={rebarRed} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 60 160 L 488 160" fill="none" stroke={rebarGreen} strokeWidth="3" strokeLinecap="round" />

            {/* Closed Shear Stirrups */}
            {[140, 165, 190, 215, 240, 270, 305, 345, 390, 440, 480].map((sx) => (
              <line key={`cst-${sx}`} x1={sx} y1="87" x2={sx} y2="158" stroke={rebarAmber} strokeWidth="1.5" />
            ))}

            {renderDimH(120, 500, 58, `Cantilever Clear Span L = ${L1} mm • Depth D = ${D} mm`, true)}
            {renderDimH(50, 120, 58, 'Ld Anchor', true)}

            {renderBarBalloon(310, 205, '1', 310, 85, `Top Tension: ${topCnt}-T${topDia} (Anchored into support)`)}
            {renderBarBalloon(310, 225, '2', 310, 160, `Bottom Nominal: ${botCnt}-T${botDia} • Stirrups: 2L-T${sDia} @ ${sSup}mm`)}
          </svg>
        </div>
      );
    }

    // 2B. CONTINUOUS BEAM (MULTI-SPAN)
    if (isCont) {
      const spans = params.spans && params.spans.length > 0
        ? params.spans
        : [
            { spanIndex: 1, spanLength: L1 },
            { spanIndex: 2, spanLength: params.span2Length || 4500 },
          ];

      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Continuous Multi-Span Beam (${spans.length} Spans)`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="35" y="45" width="40" height="195" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />
            <rect x="260" y="45" width="40" height="195" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />
            <rect x="485" y="45" width="40" height="195" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Continuous Beam Body */}
            <rect x="35" y="80" width="490" height="95" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

            {/* Top Through Bars */}
            <path d="M 45 150 L 45 90 L 515 90 L 515 150" fill="none" stroke={rebarNavy} strokeWidth="3" />
            {/* Top Extra at Intermediate Support */}
            <path d="M 200 98 L 360 98" fill="none" stroke={rebarRed} strokeWidth="3" strokeLinecap="round" />
            {/* Bottom Continuous Bars */}
            <path d="M 45 110 L 45 165 L 515 165 L 515 110" fill="none" stroke={rebarRed} strokeWidth="3" />

            {renderDimH(75, 260, 62, `Span 1 = ${spans[0]?.spanLength || L1} mm`, true)}
            {renderDimH(300, 485, 62, `Span 2 = ${spans[1]?.spanLength || params.span2Length || 4500} mm`, true)}

            {renderBarBalloon(280, 205, '1', 280, 98, 'Intermediate Support Hogging: 3-T16 (0.30L1 + 0.30L2)')}
            <text x="280" y="235" fill={textDark} fontSize="10" textAnchor="middle">
              Top Through: {topCnt}-T{topDia} • Bottom: {botCnt}-T{botDia} • Links: 2L-T{sDia}
            </text>
          </svg>
        </div>
      );
    }

    // 2C. SIMPLY SUPPORTED BEAM
    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Simply Supported Beam Detailing`} />
        {viewMode === 'PLAN' ? (
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* Section A-A (Support) */}
            <rect x="90" y="55" width="140" height="190" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="3" />
            <rect x="105" y="70" width="110" height="160" fill="none" stroke={rebarAmber} strokeWidth="2" rx="2" />
            <circle cx="120" cy="85" r="5" fill={rebarNavy} />
            <circle cx="145" cy="85" r="5" fill={rebarRed} />
            <circle cx="175" cy="85" r="5" fill={rebarRed} />
            <circle cx="200" cy="85" r="5" fill={rebarNavy} />
            <circle cx="120" cy="215" r="5.5" fill={rebarRed} />
            <circle cx="160" cy="215" r="5.5" fill={rebarRed} />
            <circle cx="200" cy="215" r="5.5" fill={rebarRed} />
            <text x="160" y="42" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">Section A-A (Support)</text>

            {/* Section B-B (Mid-Span) */}
            <rect x="330" y="55" width="140" height="190" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="3" />
            <rect x="345" y="70" width="110" height="160" fill="none" stroke={rebarAmber} strokeWidth="2" rx="2" />
            <circle cx="360" cy="85" r="5" fill={rebarNavy} />
            <circle cx="440" cy="85" r="5" fill={rebarNavy} />
            <circle cx="360" cy="215" r="5.5" fill={rebarRed} />
            <circle cx="385" cy="215" r="5.5" fill={rebarRed} />
            <circle cx="415" cy="215" r="5.5" fill={rebarRed} />
            <circle cx="440" cy="215" r="5.5" fill={rebarRed} />
            <text x="400" y="42" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">Section B-B (Mid-Span)</text>

            <text x="280" y="270" fill={textMuted} fontSize="10" textAnchor="middle">
              Width b = {b} mm • Depth D = {D} mm (Clear Cover: {params.clearCover || 25}mm)
            </text>
          </svg>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="40" y="45" width="55" height="195" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />
            <rect x="465" y="45" width="55" height="195" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            <rect x="40" y="75" width="480" height="105" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

            {/* Top Main Hanger Bars */}
            <path d="M 52 145 L 52 85 L 508 85 L 508 145" fill="none" stroke={rebarNavy} strokeWidth="3.5" strokeLinecap="round" />

            {/* Top Extra at Supports */}
            <path d="M 52 135 L 52 95 L 180 95" fill="none" stroke={rebarRed} strokeWidth="2.5" />
            <path d="M 508 135 L 508 95 L 380 95" fill="none" stroke={rebarRed} strokeWidth="2.5" />

            {/* Bottom Main Tension Bars */}
            <path d="M 52 110 L 52 170 L 508 170 L 508 110" fill="none" stroke={rebarRed} strokeWidth="3.5" strokeLinecap="round" />

            {/* Stirrups */}
            {[105, 120, 135, 150, 165, 180].map((sx) => (
              <line key={`stl-${sx}`} x1={sx} y1="87" x2={sx} y2="168" stroke={rebarAmber} strokeWidth="1.5" />
            ))}
            {[205, 235, 265, 295, 325, 355].map((sx) => (
              <line key={`stm-${sx}`} x1={sx} y1="87" x2={sx} y2="168" stroke={rebarAmber} strokeWidth="1.2" strokeDasharray="3 1" />
            ))}
            {[380, 395, 410, 425, 440, 455].map((sx) => (
              <line key={`str-${sx}`} x1={sx} y1="87" x2={sx} y2="168" stroke={rebarAmber} strokeWidth="1.5" />
            ))}

            {renderDimH(95, 465, 60, `Clear Span L = ${L1} mm • Depth D = ${D} mm • Width b = ${b} mm`, true)}
            {renderBarBalloon(160, 205, '1', 120, 85, `Top: ${topCnt}-T${topDia} (Through) + Support Curtailment`)}
            {renderBarBalloon(160, 225, '2', 120, 170, `Bottom: ${botCnt}-T${botDia} (Tension Main)`)}
            <text x="280" y="260" fill={textDark} fontSize="10" fontWeight="bold" textAnchor="middle">
              Stirrups: 2L-T{sDia} @ {sSup}mm c/c (Support 2D Zone) / {sMid}mm c/c (Mid-Span)
            </text>
          </svg>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. COLUMNS SCHEMATIC
  // -------------------------------------------------------------
  if (category === 'COLUMN') {
    const isCirc = (subType || '').toUpperCase().includes('CIRC') || params.columnShape === 'CIRCULAR';
    const b = params.width || 400;
    const D = params.depth || 400;
    const H = params.height || 3000;
    const cornerDia = params.colCornerDia || params.colMainDia || 20;
    const cornerCnt = params.colCornerCount || 4;
    const faceDia = params.colFaceDia || cornerDia;
    const faceCnt = params.colFaceCount || 4;
    const tieDia = params.colTieDia || 8;
    const tieSp = params.colTieSpacing || 150;

    if (isCirc) {
      const radius = 80;
      const cX = 160;
      const cY = 135;

      return (
        <div className="w-full h-full flex flex-col">
          <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Circular Column (Helical Spiral Ties)`} />
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* Concrete Circle */}
            <circle cx={cX} cy={cY} r={radius} fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />
            <circle cx={cX} cy={cY} r={radius - 12} fill="none" stroke={dimColor} strokeDasharray="3 3" />
            <circle cx={cX} cy={cY} r={radius - 16} fill="none" stroke={rebarAmber} strokeWidth="2.5" />

            {/* 8 Bars around circle */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const bx = cX + (radius - 16) * Math.cos(rad);
              const by = cY + (radius - 16) * Math.sin(rad);
              return <circle key={`circ-bar-${angle}`} cx={bx} cy={by} r="6" fill={rebarNavy} stroke={concreteStroke} strokeWidth="1" />;
            })}

            {/* Elevation with Helical Spiral */}
            <rect x="340" y="30" width="80" height="210" fill={concreteFill} stroke={concreteStroke} strokeWidth="1.5" />
            <line x1="355" y1="30" x2="355" y2="240" stroke={rebarNavy} strokeWidth="2.5" />
            <line x1="405" y1="30" x2="405" y2="240" stroke={rebarNavy} strokeWidth="2.5" />

            {/* Helical Spiral */}
            {[45, 65, 85, 105, 125, 145, 165, 185, 205, 225].map((sy) => (
              <line key={`spir-${sy}`} x1="340" y1={sy} x2="420" y2={sy + 10} stroke={rebarAmber} strokeWidth="1.8" />
            ))}

            {renderDimH(cX - radius, cX + radius, 30, `Diameter Ø = ${b} mm`, true)}
            {renderBarBalloon(160, 245, '1', cX + radius - 16, cY, `8 Nos Ø${params.colMainDia || 20}mm Longitudinal Bars`)}
            {renderBarBalloon(380, 260, '2', 420, 125, 'Helical Continuous Spiral (75mm Pitch)')}
          </svg>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Column Detailing (Corner & Face Bars)`} />
        {viewMode === 'SECTION' ? (
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            {/* Column Cross Section */}
            <rect x="60" y="40" width="180" height="190" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" rx="4" />
            <rect x="75" y="55" width="150" height="160" fill="none" stroke={dimColor} strokeDasharray="3 3" />
            <rect x="77" y="57" width="146" height="156" fill="none" stroke={rebarAmber} strokeWidth="2.5" rx="3" />
            <polygon points="150,57 223,135 150,213 77,135" fill="none" stroke={rebarAmber} strokeWidth="2" />

            {/* 4 Corner Bars (Red) */}
            <circle cx="89" cy="69" r="7" fill={rebarRed} stroke={concreteStroke} strokeWidth="1.5" />
            <circle cx="211" cy="69" r="7" fill={rebarRed} stroke={concreteStroke} strokeWidth="1.5" />
            <circle cx="89" cy="201" r="7" fill={rebarRed} stroke={concreteStroke} strokeWidth="1.5" />
            <circle cx="211" cy="201" r="7" fill={rebarRed} stroke={concreteStroke} strokeWidth="1.5" />

            {/* 4 Face Bars (Navy) */}
            <circle cx="150" cy="69" r="6" fill={rebarNavy} stroke={concreteStroke} strokeWidth="1.5" />
            <circle cx="150" cy="201" r="6" fill={rebarNavy} stroke={concreteStroke} strokeWidth="1.5" />
            <circle cx="89" cy="135" r="6" fill={rebarNavy} stroke={concreteStroke} strokeWidth="1.5" />
            <circle cx="211" cy="135" r="6" fill={rebarNavy} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Elevation View on Right */}
            <rect x="340" y="30" width="70" height="210" fill={concreteFill} stroke={concreteStroke} strokeWidth="1.5" />
            <path d="M 355 30 L 355 230 L 325 230" fill="none" stroke={rebarRed} strokeWidth="2.5" />
            <path d="M 395 30 L 395 230 L 425 230" fill="none" stroke={rebarRed} strokeWidth="2.5" />

            {[50, 70, 90, 115, 145, 175, 195, 215].map((ty) => (
              <line key={`ct-${ty}`} x1="340" y1={ty} x2="410" y2={ty} stroke={rebarAmber} strokeWidth="1.5" />
            ))}

            {renderBarBalloon(160, 250, '1', 89, 69, `Corner Rebar: ${cornerCnt} Nos Ø${cornerDia}mm`)}
            {renderBarBalloon(160, 268, '2', 150, 69, `Face Rebar: ${faceCnt} Nos Ø${faceDia}mm`)}
            <text x="375" y="260" fill={textDark} fontSize="10" textAnchor="middle">
              Height H = {H} mm
            </text>
            <text x="280" y="288" fill={textMuted} fontSize="10" textAnchor="middle">
              Ties: Ø{tieDia}mm @ {tieSp}mm c/c (Outer Tie + Diamond Link)
            </text>
          </svg>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="180" y="60" width="200" height="180" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" rx="4" />
            <rect x="195" y="75" width="170" height="150" fill="none" stroke={rebarAmber} strokeWidth="2.5" rx="3" />
            <polygon points="280,75 365,150 280,225 195,150" fill="none" stroke={rebarAmber} strokeWidth="2" />

            <circle cx="210" cy="90" r="7" fill={rebarRed} />
            <circle cx="350" cy="90" r="7" fill={rebarRed} />
            <circle cx="210" cy="210" r="7" fill={rebarRed} />
            <circle cx="350" cy="210" r="7" fill={rebarRed} />

            <circle cx="280" cy="90" r="6" fill={rebarNavy} />
            <circle cx="280" cy="210" r="6" fill={rebarNavy} />
            <circle cx="210" cy="150" r="6" fill={rebarNavy} />
            <circle cx="350" cy="150" r="6" fill={rebarNavy} />

            {renderDimH(180, 380, 42, `b = ${b} mm`, true)}
            {renderDimV(395, 60, 240, `D = ${D} mm`, true)}
            <text x="280" y="270" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">
              4 Corner Ø${cornerDia}mm + {faceCnt} Face Ø${faceDia}mm
            </text>
          </svg>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. SLABS SCHEMATIC
  // -------------------------------------------------------------
  if (category === 'SLAB') {
    const sType = (params.slabType || subType || 'TWO_WAY').toUpperCase();
    const lx = params.shortSpanLx || params.slabLx || 3500;
    const ly = params.longSpanLy || params.slabLy || 4500;
    const thick = params.thickness || params.slabThick || 150;
    const mDia = params.slabMainDia || 10;
    const mSp = params.slabMainSpacing || 150;
    const dDia = params.slabDistDia || 8;
    const dSp = params.slabDistSpacing || 175;

    const isDouble = sType.includes('DOUBLE');
    const isSingle = sType.includes('SINGLE');

    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — ${sType} Slab Detailing`} />
        {viewMode === 'SECTION' ? (
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="40" y="90" width="45" height="130" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />
            <rect x="475" y="90" width="45" height="130" fill={isWhite ? '#f1f5f9' : '#1e293b'} stroke={concreteStroke} strokeWidth="1.5" />

            {/* Slab Body */}
            <rect x="40" y="100" width="480" height="60" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

            {/* Bottom Reinforcement */}
            <path d="M 50 145 L 510 145" stroke={rebarRed} strokeWidth="3" />
            {[100, 150, 200, 250, 300, 350, 400, 450].map((sx) => (
              <circle key={`sb-${sx}`} cx={sx} cy="140" r="3" fill={rebarAmber} />
            ))}

            {/* Top Reinforcement */}
            {isDouble ? (
              <>
                <path d="M 50 115 L 510 115" stroke={rebarNavy} strokeWidth="3" />
                <g stroke={rebarGreen} strokeWidth="2" fill="none">
                  <path d="M 180 145 L 195 145 L 205 116 L 225 116 L 235 145 L 250 145" />
                  <path d="M 320 145 L 335 145 L 345 116 L 365 116 L 375 145 L 390 145" />
                </g>
                <text x="280" y="85" fill={rebarGreen} fontSize="10.5" fontWeight="bold" textAnchor="middle">
                  Double Jali: Top Mat with 3D Spacer Chairs
                </text>
              </>
            ) : isSingle ? (
              <text x="280" y="85" fill={textMuted} fontSize="10" textAnchor="middle">
                Single Jali Bottom Mesh (No Top Mesh or Chairs)
              </text>
            ) : (
              <>
                <path d="M 50 115 L 170 115" stroke={rebarAmber} strokeWidth="2.5" />
                <path d="M 510 115 L 390 115" stroke={rebarAmber} strokeWidth="2.5" />
                <text x="280" y="85" fill={rebarAmber} fontSize="10" textAnchor="middle">
                  Support Top Extra (0.30Lx Curtailment)
                </text>
              </>
            )}

            {renderDimH(85, 475, 180, `Clear Span Lx = ${lx} mm • Slab Thickness = ${thick} mm`, false)}
            <text x="280" y="240" fill={textDark} fontSize="10" textAnchor="middle">
              Main Steel: Ø{mDia}@{mSp}mm c/c • Distribution: Ø{dDia}@{dSp}mm c/c
            </text>
          </svg>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
            <rect x="70" y="45" width="420" height="200" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" rx="3" />
            {renderDimH(70, 490, 30, `Lx = ${lx} mm (Short Span)`, true)}
            {renderDimV(510, 45, 245, `Ly = ${ly} mm`, true)}
            <text x="280" y="145" fill={textDark} fontSize="11" fontWeight="bold" textAnchor="middle">
              {sType} Plan Reinforcement Grid
            </text>
            <text x="280" y="270" fill={textMuted} fontSize="10" textAnchor="middle">
              Main: Ø{mDia}@{mSp}mm c/c • Dist: Ø{dDia}@{dSp}mm c/c
            </text>
          </svg>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. RCC PARDI / SHEAR & CORE WALLS
  // -------------------------------------------------------------
  if (category === 'RCC_PARDI') {
    const wallL = params.length || 4000;
    const wallH = params.height || 3300;
    const wallT = params.pardiThickness || params.thickness || 230;
    const vDia = params.vertMainDia || 12;
    const vSp = params.vertMainSpacing || 150;
    const hDia = params.horizDistDia || 10;
    const hSp = params.horizDistSpacing || 150;

    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — RCC Pardi / Shear Wall (Dual Face & U-Pins)`} />
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
          {/* Concrete Wall Body */}
          <rect x="50" y="55" width="460" height="150" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" rx="3" />
          
          {/* Dual Face Vertical Curtains */}
          <line x1="65" y1="70" x2="495" y2="70" stroke={rebarRed} strokeWidth="3" />
          <line x1="65" y1="190" x2="495" y2="190" stroke={rebarNavy} strokeWidth="3" />
          
          {/* End U-Pins closing both wall ends (IS 13920 Cl. 9.4) */}
          <path d="M 90 70 L 58 70 L 58 190 L 90 190" fill="none" stroke={rebarAmber} strokeWidth="2.5" />
          <path d="M 470 70 L 502 70 L 502 190 L 470 190" fill="none" stroke={rebarAmber} strokeWidth="2.5" />

          {/* Cross-ties connecting faces */}
          {[120, 165, 210, 255, 300, 345, 390, 435].map((cx) => (
            <line key={`pardi-ct-${cx}`} x1={cx} y1="70" x2={cx} y2="190" stroke={rebarAmber} strokeWidth="1.5" />
          ))}

          {renderDimH(50, 510, 38, `Running Length L = ${wallL} mm • Height H = ${wallH} mm`, true)}
          {renderDimV(522, 55, 205, `T = ${wallT} mm`, true)}

          {renderBarBalloon(160, 230, '1', 165, 70, `Vertical: 2x(Ø${vDia}@${vSp} c/c) Dual Face`)}
          {renderBarBalloon(380, 230, '2', 390, 190, `Horizontal: Ø${hDia}@${hSp} c/c + U-Pins`)}
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. PLAIN PCC WITH MESH REINFORCEMENT
  // -------------------------------------------------------------
  if (category === 'PLAIN_PCC_MESH') {
    const pccL = params.length || 8000;
    const pccW = params.width || 6000;
    const pccThk = params.thickness || 100;
    const mDia = params.meshDiaX || 8;
    const mSp = params.meshSpacingX || 150;

    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Plain PCC Grade Floor Mesh`} />
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
          {/* Compacted Soling Cushion Sub-Base */}
          <rect x="50" y="155" width="460" height="30" fill={blindingFill} stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
          <text x="280" y="174" fill={textMuted} fontSize="9.5" textAnchor="middle">Compacted Boulder Soling & Sand Cushion Sub-Base</text>

          {/* Concrete PCC Slab */}
          <rect x="50" y="85" width="460" height="70" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

          {/* Anti-Crack Welded/Tied Wire Mesh on 30mm Cover Spacer Blocks */}
          <line x1="60" y1="125" x2="500" y2="125" stroke={rebarNavy} strokeWidth="3" />
          {[100, 160, 220, 280, 340, 400, 460].map((bx) => (
            <rect key={`pcc-blk-${bx}`} x={bx - 8} y="125" width="16" height="18" fill={isWhite ? '#cbd5e1' : '#334155'} stroke={concreteStroke} strokeWidth="1" rx="2" />
          ))}

          {renderDimH(50, 510, 65, `Bay Dimensions: ${pccL} mm x ${pccW} mm`, true)}
          {renderDimV(522, 85, 155, `PCC Thk = ${pccThk} mm`, true)}

          {renderBarBalloon(280, 225, '1', 280, 125, `Anti-Crack Mesh: Ø${mDia}@${mSp}mm c/c on 30mm Cover Blocks`)}
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. STAIRCASE WAIST SLABS & LANDINGS (SP 34 CL. 10.3)
  // -------------------------------------------------------------
  if (category === 'STAIRCASE') {
    const wThk = params.stairWaist || 150;
    const tread = params.stairTread || 275;
    const riser = params.stairRiser || 150;

    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Dog-Legged Staircase (SP 34 Cl. 10.3 Cross-Over)`} />
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
          {/* Lower Landing */}
          <rect x="40" y="160" width="110" height="50" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />
          
          {/* Upper Landing */}
          <rect x="410" y="55" width="110" height="50" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />

          {/* Inclined Flight Waist Slab */}
          <path d="M 150 210 L 410 105 L 410 55 L 365 55 L 150 160 Z" fill={concreteFill} stroke={concreteStroke} strokeWidth="2" />

          {/* Stepped Treads & Risers */}
          <path
            d="M 150 160 L 195 160 L 195 138 L 240 138 L 240 116 L 285 116 L 285 94 L 330 94 L 330 72 L 375 72 L 375 55 L 410 55"
            fill="none"
            stroke={concreteStroke}
            strokeWidth="2.5"
          />

          {/* SP 34 Cl. 10.3 Bottom Tension Rebar Extending Straight into Top of Landing (Cross-Over) */}
          <path d="M 50 195 L 175 195 L 450 70" fill="none" stroke={rebarRed} strokeWidth="3" strokeLinecap="round" />
          
          {/* Upper Landing Top Bar Tying Back */}
          <path d="M 370 70 L 510 70" fill="none" stroke={rebarNavy} strokeWidth="2.5" />

          {renderDimH(40, 150, 230, 'Landing 1: 1200mm', false)}
          {renderDimH(150, 410, 230, `Inclined Flight (Tread ${tread} / Riser ${riser})`, false)}
          {renderDimH(410, 520, 35, 'Landing 2: 1200mm', true)}

          {renderBarBalloon(180, 115, '1', 175, 195, 'SP 34 Cl. 10.3 Cross-Over (Anti-Bursting)')}
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. LIQUID STORAGE TANKS & RETAINING WALLS (IS 3370)
  // -------------------------------------------------------------
  if (category === 'WATER_TANK') {
    const wH = params.tankWallHeight || 3500;
    const wT = params.tankWallThickness || 300;

    return (
      <div className="w-full h-full flex flex-col">
        <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — Water Tank Retaining Wall (IS 3370 Liquid Face)`} />
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
          {/* Base Raft Foundation Slab */}
          <rect x="130" y="210" width="280" height="45" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

          {/* Retaining Wall Body */}
          <rect x="235" y="45" width="80" height="165" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" />

          {/* Water Face Shading on Left */}
          <rect x="130" y="45" width="105" height="165" fill={isWhite ? '#f0f9ff' : '#082f49'} stroke={isWhite ? '#bae6fd' : '#0369a1'} strokeDasharray="3 3" />
          <text x="182" y="130" fill={isWhite ? '#0284c7' : '#38bdf8'} fontSize="11" fontWeight="bold" textAnchor="middle">
            LIQUID / WATER FACE
          </text>

          {/* Water Face Main Vertical Rebar (40mm clear cover per IS 3370 Cl. 8.2) */}
          <path d="M 248 55 L 248 238 L 155 238" fill="none" stroke={rebarRed} strokeWidth="3.5" strokeLinecap="round" />

          {/* Outer Earth Face Rebar (30mm cover) */}
          <path d="M 302 55 L 302 238 L 390 238" fill="none" stroke={rebarNavy} strokeWidth="3" strokeLinecap="round" />

          {/* Horizontal Hoop Rebar Dots */}
          {[65, 90, 115, 140, 165, 190].map((hy) => (
            <g key={`w-hoop-${hy}`}>
              <circle cx="256" cy={hy} r="3" fill={rebarAmber} />
              <circle cx="294" cy={hy} r="3" fill={rebarAmber} />
            </g>
          ))}

          {renderDimV(328, 45, 210, `Wall Height H = ${wH} mm`, true)}
          {renderDimH(235, 315, 30, `Thickness T = ${wT} mm`, true)}

          {renderBarBalloon(160, 272, '1', 248, 140, 'Liquid Face: 40mm Cover (IS 3370)')}
          {renderBarBalloon(380, 272, '2', 302, 140, 'Outer Earth Face: 30mm Cover')}
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 9. DEFAULT / FALLBACK DETAILED SECTION
  // -------------------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col">
      <ViewToggleHeader viewMode={viewMode} setViewMode={setViewMode} cadTheme={cadTheme} setCadTheme={setCadTheme} title={`${memberTag} — ${category} Detailing`} />
      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full flex-1 ${bgCanvas} rounded-b-2xl select-none font-mono`}>
        <rect x="60" y="80" width="440" height="120" fill={concreteFill} stroke={concreteStroke} strokeWidth="2.5" rx="3" />
        <line x1="75" y1="100" x2="485" y2="100" stroke={rebarRed} strokeWidth="3" />
        <line x1="75" y1="180" x2="485" y2="180" stroke={rebarNavy} strokeWidth="3" />
        {[120, 180, 240, 300, 360, 420].map((lx) => (
          <line key={`lnk-${lx}`} x1={lx} y1="100" x2={lx} y2="180" stroke={rebarAmber} strokeWidth="1.5" />
        ))}
        {renderDimH(60, 500, 55, `${category} Length L = ${params.length || 3500} mm`, true)}
        <text x="280" y="240" fill={textDark} fontSize="10.5" fontWeight="bold" textAnchor="middle">
          {category} Reinforcement Matrix (IS Standard Specification)
        </text>
      </svg>
    </div>
  );
};

interface ViewToggleHeaderProps {
  viewMode: 'SECTION' | 'PLAN';
  setViewMode: (m: 'SECTION' | 'PLAN') => void;
  cadTheme: 'WHITE' | 'DARK';
  setCadTheme: (t: 'WHITE' | 'DARK') => void;
  title: string;
}

const ViewToggleHeader: React.FC<ViewToggleHeaderProps> = ({
  viewMode,
  setViewMode,
  cadTheme,
  setCadTheme,
  title,
}) => (
  <div className={`flex items-center justify-between px-3.5 py-2 border-b rounded-t-2xl transition-colors ${
    cadTheme === 'WHITE'
      ? 'bg-slate-100 border-slate-300 text-slate-800'
      : 'bg-slate-900 border-slate-800 text-slate-200'
  }`}>
    <div className="flex items-center gap-2">
      <div className="w-2 h-4 rounded-full bg-blue-600" />
      <span className="text-xs font-bold tracking-wide truncate max-w-[280px] sm:max-w-[340px]">
        {title}
      </span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
        cadTheme === 'WHITE' ? 'bg-white text-slate-600 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700'
      }`}>
        MNC CAD Detailing
      </span>
    </div>
    <div className="flex items-center gap-2">
      {/* Theme Toggle (White Blueprint vs Dark CAD) */}
      <button
        type="button"
        onClick={() => setCadTheme(cadTheme === 'WHITE' ? 'DARK' : 'WHITE')}
        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border ${
          cadTheme === 'WHITE'
            ? 'bg-white text-blue-700 border-slate-300 shadow-xs hover:bg-slate-50'
            : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
        }`}
        title="Toggle White Blueprint / Dark CAD Canvas"
      >
        {cadTheme === 'WHITE' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
        {cadTheme === 'WHITE' ? 'CAD Dark' : 'MNC White'}
      </button>

      {/* View Toggle */}
      <div className={`flex items-center p-0.5 rounded-lg border ${
        cadTheme === 'WHITE' ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-slate-800'
      }`}>
        <button
          type="button"
          onClick={() => setViewMode('SECTION')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
            viewMode === 'SECTION'
              ? 'bg-blue-600 text-white shadow-xs'
              : cadTheme === 'WHITE'
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          Section / Elevation
        </button>
        <button
          type="button"
          onClick={() => setViewMode('PLAN')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
            viewMode === 'PLAN'
              ? 'bg-blue-600 text-white shadow-xs'
              : cadTheme === 'WHITE'
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3 h-3" />
          Plan View
        </button>
      </div>
    </div>
  </div>
);
