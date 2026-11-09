'use client';

import React from 'react';

export interface MemberSchematicProps {
  category: 'FOOTING' | 'BEAM' | 'COLUMN' | 'SLAB' | 'RCC_PARDI' | 'PLAIN_PCC_MESH' | 'STAIRCASE';
  subType?: string;
  memberTag: string;
  // Dimensions & parameters
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
    stirrupDia?: number;
    stirrupSpacingSupport?: number;
    stirrupSpacingMid?: number;
    stirrupType?: string;

    // Column
    columnShape?: string;
    colMainDia?: number;
    colMainCount?: number;
    colTieDia?: number;
    colTieSpacing?: number;

    // Slab
    slabLx?: number;
    slabLy?: number;
    slabThick?: number;
    slabMainDia?: number;
    slabMainSpacing?: number;
    slabDistDia?: number;
    slabDistSpacing?: number;

    // Pardi / PCC / Stair
    pardiThickness?: number;
    stairWaist?: number;
    stairTread?: number;
    stairRiser?: number;
    stairSteps?: number;
  };
}

export const MemberStructuralSchematic: React.FC<MemberSchematicProps> = ({
  category,
  subType,
  memberTag,
  params,
}) => {
  const width = 520;
  const height = 280;

  // -------------------------------------------------------------
  // 1. FOOTINGS SCHEMATIC
  // -------------------------------------------------------------
  if (category === 'FOOTING') {
    const fType = (params.footingType || subType || 'ISOLATED').toUpperCase();
    const L = params.length || 2400;
    const D = params.depth || 600;
    const cover = params.clearCover || 50;

    const diaX = params.bottomDiaX || 12;
    const spX = params.bottomSpacingX || 150;
    const diaY = params.bottomDiaY || 12;
    const spY = params.bottomSpacingY || 150;

    const hasTop = Boolean(params.hasTopMesh || fType.includes('RAFT') || fType.includes('COMB'));
    const topDiaX = params.topDiaX || 12;
    const topSpX = params.topSpacingX || 200;

    // Stepped Footing specific
    if (fType.includes('STEP')) {
      const stepL2 = params.stepLength2 || Math.round(L * 0.6);
      const stepD1 = params.stepDepth1 || Math.round(D * 0.5);
      const stepD2 = params.stepDepth2 || Math.round(D * 0.5);

      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
          <defs>
            <pattern id="concreteHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#334155" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Stepped Concrete Outline */}
          {/* Lower Step: 50 to 470, y=140 to 220 */}
          {/* Upper Step: 150 to 370, y=80 to 140 */}
          {/* Column Pedestal: 220 to 300, y=30 to 80 */}
          <path
            d="M 50 140 L 150 140 L 150 80 L 220 80 L 220 30 L 300 30 L 300 80 L 370 80 L 370 140 L 470 140 L 470 220 L 50 220 Z"
            fill="url(#concreteHatch)"
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* Bottom Mesh U-Bar (Lower Step) */}
          <path
            d="M 65 170 L 65 208 Q 65 212 69 212 L 451 212 Q 455 212 455 208 L 455 170"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Upper Step Mesh U-Bar */}
          <path
            d="M 165 110 L 165 132 Q 165 136 169 136 L 351 136 Q 355 136 355 132 L 355 110"
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Column Starter Bars with L-Bends */}
          <path d="M 235 30 L 235 204 L 205 204" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <path d="M 285 30 L 285 204 L 315 204" fill="none" stroke="#f59e0b" strokeWidth="3" />

          {/* Dimension Callouts */}
          <text x={width / 2} y={242} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
            L1 = {L} mm (Lower Step)
          </text>
          <text x={width / 2} y={70} fill="#a855f7" fontSize="10" fontWeight="bold" textAnchor="middle">
            L2 = {stepL2} mm (Upper Step)
          </text>
          <text x={35} y={180} fill="#94a3b8" fontSize="10" textAnchor="end">
            D = {D}mm
          </text>

          {/* Reinforcement Callouts */}
          <text x={65} y={260} fill="#38bdf8" fontSize="10" fontWeight="bold">
            Bottom Mesh: Ø{diaX} @ {spX} c/c
          </text>
          <text x={310} y={115} fill="#a855f7" fontSize="10" fontWeight="bold">
            Upper Step Rebar
          </text>
          <text x={width / 2} y={20} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
            {memberTag} — Stepped Footing IS 456 Detailing
          </text>
        </svg>
      );
    }

    // Sloped / Trapezoidal Footing
    if (fType.includes('SLOPE') || fType.includes('TRAPEZOIDAL')) {
      const edgeD = params.edgeDepth || Math.max(Math.round(D * 0.35), 200);

      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
          <defs>
            <pattern id="concHatch2" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#334155" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Sloped Footing Profile */}
          <path
            d="M 50 170 L 190 80 L 220 80 L 220 30 L 300 30 L 300 80 L 330 80 L 470 170 L 470 220 L 50 220 Z"
            fill="url(#concHatch2)"
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* Edge thickness mark */}
          <line x1="50" y1="170" x2="35" y2="170" stroke="#94a3b8" strokeDasharray="2 2" />
          <line x1="50" y1="220" x2="35" y2="220" stroke="#94a3b8" strokeDasharray="2 2" />

          {/* Bottom Mesh U-Bar */}
          <path
            d="M 65 175 L 65 208 Q 65 212 69 212 L 451 212 Q 455 212 455 208 L 455 175"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Column Dowel with Foot Anchor */}
          <path d="M 235 30 L 235 204 L 205 204" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <path d="M 285 30 L 285 204 L 315 204" fill="none" stroke="#f59e0b" strokeWidth="3" />

          {/* Annotations */}
          <text x={width / 2} y={242} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
            L = {L} mm • Total D = {D} mm
          </text>
          <text x={30} y={198} fill="#f59e0b" fontSize="10" textAnchor="end">
            d={edgeD}mm
          </text>
          <text x={width / 2} y={262} fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
            Bottom Mesh: Ø{diaX} @ {spX} c/c (X) & Ø{diaY} @ {spY} c/c (Y)
          </text>
          <text x={width / 2} y={20} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
            {memberTag} — Sloped / Trapezoidal Footing Section
          </text>
        </svg>
      );
    }

    // Standard Isolated or Raft / Combined Footing with Top Mesh
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
        <defs>
          <pattern id="concreteHatch3" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#334155" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Concrete Footing Outline */}
        <rect x="50" y="80" width="420" height="140" fill="url(#concreteHatch3)" stroke="#64748b" strokeWidth="2" rx="2" />

        {/* Pedestal / Column Stub */}
        <rect x="220" y="30" width="80" height="50" fill="url(#concreteHatch3)" stroke="#64748b" strokeWidth="2" />

        {/* Clear Cover Lines (50mm offset indicator) */}
        <rect x="62" y="92" width="396" height="116" fill="none" stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />

        {/* Bottom Mesh U-Bar (Longitudinal X) */}
        <path
          d="M 65 125 L 65 206 Q 65 210 69 210 L 451 210 Q 455 210 455 206 L 455 125"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Bottom Transverse Mesh (Y Bars shown as circles) */}
        {[95, 135, 175, 215, 255, 295, 335, 375, 415].map((cx) => (
          <circle key={cx} cx={cx} cy="201" r="4" fill="#a855f7" stroke="#0f172a" strokeWidth="1.5" />
        ))}

        {/* Top Mesh (if enabled or Raft) */}
        {hasTop && (
          <>
            <path
              d="M 65 165 L 65 94 Q 65 90 69 90 L 451 90 Q 455 90 455 94 L 455 165"
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {[95, 145, 195, 245, 295, 345, 395, 425].map((cx) => (
              <circle key={cx} cx={cx} cy="98" r="3.5" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
            ))}
          </>
        )}

        {/* 3D Spacer Chair (if Top Mesh or Raft) */}
        {hasTop && (
          <g stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round">
            {/* Chair 1 */}
            <path d="M 120 208 L 135 208 L 145 92 L 180 92 L 190 208 L 205 208" />
            {/* Chair 2 */}
            <path d="M 315 208 L 330 208 L 340 92 L 375 92 L 385 208 L 400 208" />
          </g>
        )}

        {/* Column Dowels */}
        <path d="M 235 30 L 235 204 L 205 204" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <path d="M 285 30 L 285 204 L 315 204" fill="none" stroke="#f59e0b" strokeWidth="3" />

        {/* Dimension & Label Annotations */}
        <text x={width / 2} y={238} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
          L = {L} mm • Depth D = {D} mm (Cover: {cover}mm)
        </text>

        <text x={65} y={258} fill="#38bdf8" fontSize="10" fontWeight="bold">
          Bottom: Ø{diaX} @ {spX} (X) + Ø{diaY} @ {spY} (Y)
        </text>

        {hasTop ? (
          <text x={width / 2} y={75} fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
            Top Mesh: Ø{topDiaX} @ {topSpX} c/c with 3D Spacer Chairs
          </text>
        ) : (
          <text x={width / 2} y={75} fill="#64748b" fontSize="10" textAnchor="middle">
            Single Layer Bottom Mesh Detailing
          </text>
        )}

        <text x={width / 2} y={20} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
          {memberTag} — {fType} Structural Cross-Section
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 2. BEAMS SCHEMATIC (CONTINUOUS, SIMPLY SUPPORTED, CANTILEVER)
  // -------------------------------------------------------------
  if (category === 'BEAM') {
    const bType = (params.beamType || subType || 'SIMPLY_SUPPORTED').toUpperCase();
    const L1 = params.clearSpan || 5000;
    const L2 = params.span2Length || 4500;
    const isCont = bType.includes('CONTINUOUS');
    const isCant = bType.includes('CANTILEVER') && !isCont;
    const b = params.width || 300;
    const D = params.depth || 600;

    const topDia1 = params.topMainDia || 16;
    const topCnt1 = params.topMainCount || 2;
    const topDia2 = params.topMainDia2 || 0;
    const topCnt2 = params.topMainCount2 || 0;

    const botDia1 = params.bottomMainDia || 20;
    const botCnt1 = params.bottomMainCount || 3;
    const botDia2 = params.bottomMainDia2 || 0;
    const botCnt2 = params.bottomMainCount2 || 0;

    const sDia = params.stirrupDia || 8;
    const sEnd = params.stirrupSpacingSupport || 100;
    const sMid = params.stirrupSpacingMid || 175;

    // Top bar text
    const topText = topCnt2 > 0 ? `${topCnt1}-T${topDia1} + ${topCnt2}-T${topDia2}` : `${topCnt1}-T${topDia1}`;
    const botText = botCnt2 > 0 ? `${botCnt1}-T${botDia1} + ${botCnt2}-T${botDia2}` : `${botCnt1}-T${botDia1}`;

    if (isCont) {
      // Multi-Span Continuous Beam Elevation
      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
          <defs>
            <pattern id="columnHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1" />
            </pattern>
          </defs>

          {/* 3 Support Columns */}
          {/* Left Col */}
          <rect x="35" y="45" width="45" height="195" fill="url(#columnHatch)" stroke="#64748b" strokeWidth="1.5" />
          {/* Middle Col */}
          <rect x="238" y="45" width="45" height="195" fill="url(#columnHatch)" stroke="#64748b" strokeWidth="1.5" />
          {/* Right Col */}
          <rect x="440" y="45" width="45" height="195" fill="url(#columnHatch)" stroke="#64748b" strokeWidth="1.5" />

          {/* Continuous Beam Concrete Body */}
          <rect x="35" y="80" width="450" height="95" fill="#0f172a" stroke="#64748b" strokeWidth="2" opacity="0.9" />

          {/* Continuous Top Main Through Bars (Shape 37) */}
          <path
            d="M 45 150 L 45 92 Q 45 88 49 88 L 471 88 Q 475 88 475 92 L 475 150"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Continuous Bottom Main Through Bars (Shape 37) */}
          <path
            d="M 45 110 L 45 167 Q 45 171 49 171 L 471 171 Q 475 171 475 167 L 475 110"
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Intermediate Support Hogging Negative Rebar (0.3L1 + 0.3L2) */}
          <path d="M 185 96 L 335 96" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

          {/* Confining & Mid Stirrup Ticks */}
          {/* Span 1: End Confining zone 1 (80 to 130) */}
          {[88, 98, 108, 118, 128].map((x) => (
            <line key={`s1-${x}`} x1={x} y1="90" x2={x} y2="169" stroke="#60a5fa" strokeWidth="1.5" />
          ))}
          {/* Span 1: Mid zone (130 to 190) */}
          {[145, 165, 185].map((x) => (
            <line key={`s1m-${x}`} x1={x} y1="90" x2={x} y2="169" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 1" />
          ))}
          {/* Span 1: End Confining zone 2 (190 to 238) */}
          {[198, 208, 218, 228].map((x) => (
            <line key={`s1e-${x}`} x1={x} y1="90" x2={x} y2="169" stroke="#60a5fa" strokeWidth="1.5" />
          ))}

          {/* Span 2 Stirrups */}
          {[290, 300, 310, 320].map((x) => (
            <line key={`s2e1-${x}`} x1={x} y1="90" x2={x} y2="169" stroke="#60a5fa" strokeWidth="1.5" />
          ))}
          {[340, 365, 390].map((x) => (
            <line key={`s2m-${x}`} x1={x} y1="90" x2={x} y2="169" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 1" />
          ))}
          {[400, 410, 420, 430].map((x) => (
            <line key={`s2e2-${x}`} x1={x} y1="90" x2={x} y2="169" stroke="#60a5fa" strokeWidth="1.5" />
          ))}

          {/* Span Dimension Callouts */}
          <line x1="80" y1="65" x2="238" y2="65" stroke="#94a3b8" strokeWidth="1" />
          <text x="159" y="60" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
            Span 1 L1 = {L1} mm
          </text>

          <line x1="283" y1="65" x2="440" y2="65" stroke="#94a3b8" strokeWidth="1" />
          <text x="361" y="60" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
            Span 2 L2 = {L2} mm
          </text>

          {/* Rebar Callouts */}
          <text x={80} y={200} fill="#38bdf8" fontSize="10" fontWeight="bold">
            Top: {topText}
          </text>
          <text x={80} y={215} fill="#34d399" fontSize="10" fontWeight="bold">
            Bottom: {botText}
          </text>
          <text x={260} y={200} fill="#f59e0b" fontSize="10" fontWeight="bold">
            Mid-Support Extra: 3-T16
          </text>
          <text x={width / 2} y={250} fill="#60a5fa" fontSize="10" fontWeight="bold" textAnchor="middle">
            Stirrups: 2L-T{sDia} @ {sEnd} c/c (Confined 2D) / {sMid} c/c (Mid-Span)
          </text>

          <text x={width / 2} y={22} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
            {memberTag} — Continuous Multi-Span Beam IS 13920 Detailing
          </text>
        </svg>
      );
    }

    // Simply Supported Single Span Beam Elevation
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
        <defs>
          <pattern id="colHatchSingle" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Support Columns */}
        <rect x="40" y="45" width="55" height="195" fill="url(#colHatchSingle)" stroke="#64748b" strokeWidth="1.5" />
        <rect x="425" y="45" width="55" height="195" fill="url(#colHatchSingle)" stroke="#64748b" strokeWidth="1.5" />

        {/* Beam Body */}
        <rect x="40" y="75" width="440" height="105" fill="#0f172a" stroke="#64748b" strokeWidth="2" opacity="0.9" />

        {/* Top Main Hanger Bars with 90° Anchors Down */}
        <path
          d="M 52 145 L 52 87 Q 52 83 56 83 L 464 83 Q 468 83 468 87 L 468 145"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Top Extra Bars at Support (0.25L curtailment) */}
        <path d="M 52 135 L 52 95 L 180 95" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
        <path d="M 468 135 L 468 95 L 340 95" fill="none" stroke="#f59e0b" strokeWidth="2.5" />

        {/* Bottom Main Tension Bars with 90° Anchors Up */}
        <path
          d="M 52 110 L 52 170 Q 52 174 56 174 L 464 174 Q 468 174 468 170 L 468 110"
          fill="none"
          stroke="#34d399"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Stirrup Vertical Ticks */}
        {/* Left Confining Zone (2D ~ 95 to 190) */}
        {[102, 116, 130, 144, 158, 172, 186].map((x) => (
          <line key={`st-l-${x}`} x1={x} y1="85" x2={x} y2="172" stroke="#60a5fa" strokeWidth="1.5" />
        ))}
        {/* Mid-Span Zone (190 to 330) */}
        {[210, 235, 260, 285, 310].map((x) => (
          <line key={`st-m-${x}`} x1={x} y1="85" x2={x} y2="172" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 1" />
        ))}
        {/* Right Confining Zone (330 to 425) */}
        {[334, 348, 362, 376, 390, 404, 418].map((x) => (
          <line key={`st-r-${x}`} x1={x} y1="85" x2={x} y2="172" stroke="#60a5fa" strokeWidth="1.5" />
        ))}

        {/* Dimension Lines */}
        <line x1="95" y1="60" x2="425" y2="60" stroke="#94a3b8" strokeWidth="1" />
        <text x={width / 2} y="54" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
          Clear Span L = {L1} mm • Depth D = {D} mm • Width b = {b} mm
        </text>

        {/* Bar Marks & Detailing Legend */}
        <text x={95} y={205} fill="#38bdf8" fontSize="11" fontWeight="bold">
          Top Reinforcement: {topText}
        </text>
        <text x={95} y={222} fill="#34d399" fontSize="11" fontWeight="bold">
          Bottom Reinforcement: {botText}
        </text>
        <text x={95} y={239} fill="#f59e0b" fontSize="10">
          Support Curtailment Extra: 2-T16 (Left & Right 0.25L)
        </text>
        <text x={width / 2} y={262} fill="#60a5fa" fontSize="11" fontWeight="bold" textAnchor="middle">
          Stirrups: 2L-T{sDia} @ {sEnd} c/c (2D Support Zone) / {sMid} c/c (Mid-Span)
        </text>

        <text x={width / 2} y={22} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
          {memberTag} — Simply Supported Beam Detailing
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 3. COLUMNS SCHEMATIC (CROSS-SECTION + ELEVATION)
  // -------------------------------------------------------------
  if (category === 'COLUMN') {
    const b = params.width || 400;
    const D = params.depth || 600;
    const H = params.height || 3600;
    const dia = params.colMainDia || 20;
    const cnt = params.colMainCount || 8;
    const tieDia = params.colTieDia || 8;
    const tieSp = params.colTieSpacing || 150;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
        {/* Left Side: Column Cross-Section (x=50 to 220) */}
        <rect x="50" y="60" width="160" height="170" fill="#0f172a" stroke="#64748b" strokeWidth="2" rx="4" />

        {/* Clear Cover (40mm offset) */}
        <rect x="64" y="74" width="132" height="142" fill="none" stroke="#475569" strokeDasharray="3 3" />

        {/* Outer Rectangular Tie with 135° Hooks */}
        <rect x="66" y="76" width="128" height="138" fill="none" stroke="#38bdf8" strokeWidth="2.5" rx="3" />

        {/* Internal Diamond Tie (for 8+ bar columns) */}
        {cnt >= 8 && (
          <polygon
            points="130,76 194,145 130,214 66,145"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* 4 Corner Main Bars */}
        <circle cx="76" cy="86" r="6" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="184" cy="86" r="6" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="76" cy="204" r="6" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="184" cy="204" r="6" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />

        {/* Side Face Bars (if cnt >= 6 or 8) */}
        {cnt >= 6 && (
          <>
            <circle cx="130" cy="86" r="5.5" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="130" cy="204" r="5.5" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
          </>
        )}
        {cnt >= 8 && (
          <>
            <circle cx="76" cy="145" r="5.5" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="184" cy="145" r="5.5" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
          </>
        )}

        {/* Right Side: Column Elevation & Footing Starter (x=270 to 470) */}
        <rect x="330" y="55" width="80" height="150" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
        {/* Footing Slab outline */}
        <rect x="290" y="205" width="160" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />

        {/* Longitudinal Rebar in Elevation with L-bend in footing */}
        <path d="M 342 55 L 342 225 L 315 225" fill="none" stroke="#34d399" strokeWidth="3" />
        <path d="M 398 55 L 398 225 L 425 225" fill="none" stroke="#34d399" strokeWidth="3" />

        {/* Tie Links in Elevation */}
        {[65, 80, 95, 115, 135, 155, 175, 190].map((y) => (
          <line key={y} x1="334" y1={y} x2="406" y2={y} stroke="#38bdf8" strokeWidth="1.5" />
        ))}

        {/* Callout Texts */}
        <text x="130" y="248" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
          {b}mm × {D}mm Cross Section
        </text>

        <text x="370" y="45" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
          H = {H}mm Elevation
        </text>

        <text x={width / 2} y={268} fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">
          Main Steel: {cnt} Nos Ø{dia}mm • Ties: Ø{tieDia}mm @ {tieSp}mm c/c (100mm Confined)
        </text>

        <text x={width / 2} y={22} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
          {memberTag} — Column Tied Reinforcement Cross-Section & Starter Detail
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 4. SLABS / RCC PARDI / PCC / STAIRCASE SCHEMATICS
  // -------------------------------------------------------------
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full bg-slate-950 rounded-2xl select-none">
      <rect x="50" y="70" width="420" height="120" fill="#0f172a" stroke="#64748b" strokeWidth="2" rx="4" />

      {/* Main Steel Line */}
      <path
        d="M 65 140 L 65 165 L 455 165 L 455 140"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Transverse Circles */}
      {[90, 130, 170, 210, 250, 290, 330, 370, 410, 440].map((cx) => (
        <circle key={cx} cx={cx} cy="155" r="4" fill="#a855f7" stroke="#0f172a" strokeWidth="1.5" />
      ))}

      <text x={width / 2} y={220} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
        {category.replace('_', ' ')} Detailing per IS Standards
      </text>

      <text x={width / 2} y={22} fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
        {memberTag} — Structural Layout Schematic
      </text>
    </svg>
  );
};
