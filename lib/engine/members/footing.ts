import { calculateRebarShape, roundUpTo25mm, getUnitWeight } from '../is2502';

export interface FootingInput {
  memberTag: string; // e.g. "FTG-01", "STEP-F2", "STRAP-01", "COMB-01", "RAFT-01", "PC-01"
  footingType?: 'ISOLATED' | 'STEPPED' | 'SLOPED_TRAPEZOIDAL' | 'STRAP' | 'COMBINED' | 'RAFT' | 'PILE_CAP';
  subType?: string;
  length: number; // mm (X-direction)
  width: number; // mm (Y-direction)
  depth: number; // mm (overall depth D)
  clearCover?: number; // mm (default 50mm foundation cover per IS 456)

  // Stepped Footing specific
  stepLength2?: number; // mm (upper step)
  stepWidth2?: number; // mm (upper step)
  stepDepth1?: number; // mm (lower step depth)
  stepDepth2?: number; // mm (upper step depth)

  // Sloped / Trapezoidal Footing specific
  edgeDepth?: number; // mm (edge thickness d_edge, min 150mm per IS 456 Cl. 34.1.2)
  pedestalLength?: number; // mm
  pedestalWidth?: number; // mm

  // Strap Footing specific (Footing 1 + Footing 2 + Strap Beam)
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

  strapBeamLength?: number; // mm (distance / clear span between footings)
  strapBeamWidth?: number; // mm
  strapBeamDepth?: number; // mm
  strapTopDia?: number; // mm
  strapTopCount?: number;
  strapBottomDia?: number; // mm
  strapBottomCount?: number;
  strapStirrupDia?: number; // mm
  strapStirrupSpacing?: number; // mm

  // Combined Footing specific
  col1WidthX?: number;
  col1WidthY?: number;
  col1Offset?: number; // mm from left edge
  col2WidthX?: number;
  col2WidthY?: number;
  col2Offset?: number; // mm from right edge
  colSpacing?: number; // mm center-to-center
  colDowelDia?: number;
  colDowelCount?: number;

  // Pile Foundation & Pile Cap specific
  pileCount?: number; // 1, 2, 3, 4, 5, 6
  pileShape?: 'CIRCULAR' | 'RECTANGULAR';
  pileDia?: number; // mm (diameter or side width)
  pileLength?: number; // mm (depth of piles into ground)
  pileVerticalDia?: number;
  pileVerticalCount?: number;
  pileSpiralDia?: number;
  pileSpiralPitch?: number;
  pileCapShape?: 'SQUARE' | 'RECTANGULAR' | 'TRIANGULAR' | 'CIRCULAR';
  pileCapLength?: number;
  pileCapWidth?: number;
  pileCapDepth?: number;

  // Bottom Reinforcement
  bottomDiaX?: number; // mm
  bottomSpacingX?: number; // mm c/c
  bottomDiaY?: number; // mm
  bottomSpacingY?: number; // mm c/c
  bottomMeshXDia?: number;
  bottomMeshXSpacing?: number;
  bottomMeshYDia?: number;
  bottomMeshYSpacing?: number;

  // Top Reinforcement (Raft / Combined / Double Mat)
  hasTopMesh?: boolean;
  topDiaX?: number; // mm
  topSpacingX?: number; // mm
  topDiaY?: number; // mm
  topSpacingY?: number; // mm
  topMeshXDia?: number;
  topMeshXSpacing?: number;
  topMeshYDia?: number;
  topMeshYSpacing?: number;

  // Chairs for Rafts / Heavy Double Mats
  includeChairs?: boolean;
  chairDia?: number; // mm
  chairCount?: number;
  chairSpacing?: number; // mm c/c
  chairHeight?: number;
  chairHead?: number;
  chairFoot?: number;

  concreteGrade?: string;
  steelGrade?: string;
}

export interface GeneratedRebarItem {
  barMark: string;
  description: string;
  shapeCode: string;
  dia: number;
  count: number;
  dimA: number;
  dimB: number;
  dimC: number;
  dimD: number;
  dimE: number;
  rawCutLength: number;
  calculatedCutLength: number;
  unitWeight: number;
  totalLengthM: number;
  totalWeightKg: number;
  isPayable: boolean;
  isChair: boolean;
  isLap: boolean;
  remarks: string;
}

export function generateFootingBBS(input: FootingInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 50; // IS 456 foundation cover = 50mm
  const grade = input.steelGrade ?? 'Fe500D';
  const type = (input.footingType || input.subType || 'ISOLATED').toUpperCase();

  const diaX = input.bottomDiaX || input.bottomMeshXDia || 12;
  const spacingX = input.bottomSpacingX || input.bottomMeshXSpacing || 150;
  const diaY = input.bottomDiaY || input.bottomMeshYDia || 12;
  const spacingY = input.bottomSpacingY || input.bottomMeshYSpacing || 150;

  const topDiaX = input.topDiaX || input.topMeshXDia || 12;
  const topSpacingX = input.topSpacingX || input.topMeshXSpacing || 200;
  const topDiaY = input.topDiaY || input.topMeshYDia || 12;
  const topSpacingY = input.topSpacingY || input.topMeshYSpacing || 200;

  const isSloped = type.includes('SLOPED') || type.includes('TRAPEZOIDAL');
  // IS 456 Cl. 34.1.2: edge thickness d_edge shall not be less than 150mm
  const edgeDepth = Math.max(input.edgeDepth || 200, 150);
  const bendUpHeight = isSloped
    ? Math.max(edgeDepth - 2 * cover, 100)
    : Math.max(input.depth - 2 * cover, 150);

  // -------------------------------------------------------------
  // 1. STRAP FOOTING (FOOTING 1 + FOOTING 2 + STRAP BEAM)
  // -------------------------------------------------------------
  if (type.includes('STRAP')) {
    // Footing 1 (Trapezoidal / Rectangular)
    const f1L = input.f1Length || input.length || 2000;
    const f1W = input.f1Width || input.width || 2000;
    const f1D = input.f1Depth || input.depth || 500;
    const f1DiaX = input.f1DiaX || diaX;
    const f1SpX = input.f1SpacingX || spacingX;
    const f1DiaY = input.f1DiaY || diaY;
    const f1SpY = input.f1SpacingY || spacingY;
    const f1Bend = Math.max(f1D - 2 * cover, 150);

    const f1SpanX = Math.max(f1L - 2 * cover, 100);
    const f1CountX = Math.ceil(Math.max(f1W - 2 * cover, 100) / f1SpX) + 1;
    const resF1X = calculateRebarShape({ shapeCode: '37', dia: f1DiaX, dimA: f1SpanX, dimB: f1Bend, steelGrade: grade });
    const totF1X = (resF1X.cutLengthMm * f1CountX) / 1000;
    const wtF1X = getUnitWeight(f1DiaX);

    items.push({
      barMark: `${input.memberTag}-F1-B1`,
      description: `${input.memberTag} Footing 1 Bottom Main along Length (${f1SpanX}mm) @ ${f1SpX}mm c/c`,
      shapeCode: '37',
      dia: f1DiaX,
      count: f1CountX,
      dimA: f1SpanX,
      dimB: f1Bend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resF1X.rawLengthMm,
      calculatedCutLength: resF1X.cutLengthMm,
      unitWeight: wtF1X,
      totalLengthM: Number(totF1X.toFixed(2)),
      totalWeightKg: Number((totF1X * wtF1X).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Footing 1 Bottom Mesh along Length',
    });

    const f1SpanY = Math.max(f1W - 2 * cover, 100);
    const f1CountY = Math.ceil(Math.max(f1L - 2 * cover, 100) / f1SpY) + 1;
    const resF1Y = calculateRebarShape({ shapeCode: '37', dia: f1DiaY, dimA: f1SpanY, dimB: f1Bend, steelGrade: grade });
    const totF1Y = (resF1Y.cutLengthMm * f1CountY) / 1000;
    const wtF1Y = getUnitWeight(f1DiaY);

    items.push({
      barMark: `${input.memberTag}-F1-B2`,
      description: `${input.memberTag} Footing 1 Bottom Main along Width (${f1SpanY}mm) @ ${f1SpY}mm c/c`,
      shapeCode: '37',
      dia: f1DiaY,
      count: f1CountY,
      dimA: f1SpanY,
      dimB: f1Bend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resF1Y.rawLengthMm,
      calculatedCutLength: resF1Y.cutLengthMm,
      unitWeight: wtF1Y,
      totalLengthM: Number(totF1Y.toFixed(2)),
      totalWeightKg: Number((totF1Y * wtF1Y).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Footing 1 Bottom Mesh along Width',
    });

    // Footing 2 (Trapezoidal / Rectangular)
    const f2L = input.f2Length || input.length || 2400;
    const f2W = input.f2Width || input.width || 2400;
    const f2D = input.f2Depth || input.depth || 600;
    const f2DiaX = input.f2DiaX || diaX;
    const f2SpX = input.f2SpacingX || spacingX;
    const f2DiaY = input.f2DiaY || diaY;
    const f2SpY = input.f2SpacingY || spacingY;
    const f2Bend = Math.max(f2D - 2 * cover, 150);

    const f2SpanX = Math.max(f2L - 2 * cover, 100);
    const f2CountX = Math.ceil(Math.max(f2W - 2 * cover, 100) / f2SpX) + 1;
    const resF2X = calculateRebarShape({ shapeCode: '37', dia: f2DiaX, dimA: f2SpanX, dimB: f2Bend, steelGrade: grade });
    const totF2X = (resF2X.cutLengthMm * f2CountX) / 1000;
    const wtF2X = getUnitWeight(f2DiaX);

    items.push({
      barMark: `${input.memberTag}-F2-B1`,
      description: `${input.memberTag} Footing 2 Bottom Main along Length (${f2SpanX}mm) @ ${f2SpX}mm c/c`,
      shapeCode: '37',
      dia: f2DiaX,
      count: f2CountX,
      dimA: f2SpanX,
      dimB: f2Bend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resF2X.rawLengthMm,
      calculatedCutLength: resF2X.cutLengthMm,
      unitWeight: wtF2X,
      totalLengthM: Number(totF2X.toFixed(2)),
      totalWeightKg: Number((totF2X * wtF2X).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Footing 2 Bottom Mesh along Length',
    });

    const f2SpanY = Math.max(f2W - 2 * cover, 100);
    const f2CountY = Math.ceil(Math.max(f2L - 2 * cover, 100) / f2SpY) + 1;
    const resF2Y = calculateRebarShape({ shapeCode: '37', dia: f2DiaY, dimA: f2SpanY, dimB: f2Bend, steelGrade: grade });
    const totF2Y = (resF2Y.cutLengthMm * f2CountY) / 1000;
    const wtF2Y = getUnitWeight(f2DiaY);

    items.push({
      barMark: `${input.memberTag}-F2-B2`,
      description: `${input.memberTag} Footing 2 Bottom Main along Width (${f2SpanY}mm) @ ${f2SpY}mm c/c`,
      shapeCode: '37',
      dia: f2DiaY,
      count: f2CountY,
      dimA: f2SpanY,
      dimB: f2Bend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resF2Y.rawLengthMm,
      calculatedCutLength: resF2Y.cutLengthMm,
      unitWeight: wtF2Y,
      totalLengthM: Number(totF2Y.toFixed(2)),
      totalWeightKg: Number((totF2Y * wtF2Y).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Footing 2 Bottom Mesh along Width',
    });

    // Connecting Strap Beam
    const sBLen = input.strapBeamLength || 3500;
    const sBWid = input.strapBeamWidth || 350;
    const sBDep = input.strapBeamDepth || 600;
    const sTopCount = input.strapTopCount || 4;
    const sTopDia = input.strapTopDia || 20;
    const sBotCount = input.strapBottomCount || 3;
    const sBotDia = input.strapBottomDia || 16;
    const sStirrupDia = input.strapStirrupDia || 8;
    const sStirrupSpacing = input.strapStirrupSpacing || 150;

    // Strap Beam Total Length = clear span + embedment inside both footings
    const sBTotalLength = sBLen + Math.min(f1L, 1000) + Math.min(f2L, 1000);

    // Strap Beam Top Tension Bars
    const resStrapTop = calculateRebarShape({
      shapeCode: '21',
      dia: sTopDia,
      dimA: sBTotalLength,
      dimB: sBDep - 2 * cover,
      steelGrade: grade,
    });
    const totStrapTop = (resStrapTop.cutLengthMm * sTopCount) / 1000;
    const wtStrapTop = getUnitWeight(sTopDia);
    items.push({
      barMark: `${input.memberTag}-STRAP-T1`,
      description: `${input.memberTag} Connecting Strap Beam Top Main Tension Bars (${sTopCount} Nos Ø${sTopDia}mm)`,
      shapeCode: '21',
      dia: sTopDia,
      count: sTopCount,
      dimA: sBTotalLength,
      dimB: sBDep - 2 * cover,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resStrapTop.rawLengthMm,
      calculatedCutLength: resStrapTop.cutLengthMm,
      unitWeight: wtStrapTop,
      totalLengthM: Number(totStrapTop.toFixed(2)),
      totalWeightKg: Number((totStrapTop * wtStrapTop).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Strap beam hogging moment tension reinforcement anchored into both footings',
    });

    // Strap Beam Bottom Bars
    const resStrapBot = calculateRebarShape({ shapeCode: '20', dia: sBotDia, dimA: sBTotalLength, steelGrade: grade });
    const totStrapBot = (resStrapBot.cutLengthMm * sBotCount) / 1000;
    const wtStrapBot = getUnitWeight(sBotDia);
    items.push({
      barMark: `${input.memberTag}-STRAP-B1`,
      description: `${input.memberTag} Connecting Strap Beam Bottom Nominal Bars (${sBotCount} Nos Ø${sBotDia}mm)`,
      shapeCode: '20',
      dia: sBotDia,
      count: sBotCount,
      dimA: sBTotalLength,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resStrapBot.rawLengthMm,
      calculatedCutLength: resStrapBot.cutLengthMm,
      unitWeight: wtStrapBot,
      totalLengthM: Number(totStrapBot.toFixed(2)),
      totalWeightKg: Number((totStrapBot * wtStrapBot).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Strap beam bottom compression nominal steel',
    });

    // Strap Beam Stirrups
    const sA = sBWid - 2 * cover;
    const sB = sBDep - 2 * cover;
    const sStirrupCount = Math.ceil(sBTotalLength / sStirrupSpacing) + 1;
    const resStrapStirrup = calculateRebarShape({ shapeCode: '51', dia: sStirrupDia, dimA: sA, dimB: sB, steelGrade: grade });
    const totStrapStirrup = (resStrapStirrup.cutLengthMm * sStirrupCount) / 1000;
    const wtStrapStirrup = getUnitWeight(sStirrupDia);
    items.push({
      barMark: `${input.memberTag}-STRAP-ST`,
      description: `${input.memberTag} Connecting Strap Beam 135° Shear Stirrups (Ø${sStirrupDia}mm @ ${sStirrupSpacing}mm c/c)`,
      shapeCode: '51',
      dia: sStirrupDia,
      count: sStirrupCount,
      dimA: sA,
      dimB: sB,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resStrapStirrup.rawLengthMm,
      calculatedCutLength: resStrapStirrup.cutLengthMm,
      unitWeight: wtStrapStirrup,
      totalLengthM: Number(totStrapStirrup.toFixed(2)),
      totalWeightKg: Number((totStrapStirrup * wtStrapStirrup).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 13920 135° seismic closed stirrups for strap beam',
    });

    return items;
  }

  // -------------------------------------------------------------
  // 2. PILE FOUNDATION & PILE CAP BBS
  // -------------------------------------------------------------
  if (type.includes('PILE')) {
    const pCount = input.pileCount || 4;
    const pShape = input.pileShape || 'CIRCULAR';
    const pDia = input.pileDia || 500;
    const pLen = input.pileLength || 10000; // 10m default depth
    const pVertDia = input.pileVerticalDia || 16;
    const pVertCount = input.pileVerticalCount || 6;
    const pSpiralDia = input.pileSpiralDia || 8;
    const pPitch = input.pileSpiralPitch || 150;

    const capL = input.pileCapLength || input.length || 2400;
    const capW = input.pileCapWidth || input.width || 2400;
    const capD = input.pileCapDepth || input.depth || 800;

    // Pile Cap Bottom Mat (Length X)
    const capSpanX = Math.max(capL - 2 * cover, 100);
    const capBend = Math.max(capD - 2 * cover, 150);
    const capCountX = Math.ceil(Math.max(capW - 2 * cover, 100) / spacingX) + 1;
    const resCapX = calculateRebarShape({ shapeCode: '37', dia: diaX, dimA: capSpanX, dimB: capBend, steelGrade: grade });
    const totCapX = (resCapX.cutLengthMm * capCountX) / 1000;
    const wtCapX = getUnitWeight(diaX);
    items.push({
      barMark: `${input.memberTag}-CAP-B1`,
      description: `${input.memberTag} Pile Cap Bottom Mat along Length (${capSpanX}mm) @ ${spacingX}mm c/c`,
      shapeCode: '37',
      dia: diaX,
      count: capCountX,
      dimA: capSpanX,
      dimB: capBend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCapX.rawLengthMm,
      calculatedCutLength: resCapX.cutLengthMm,
      unitWeight: wtCapX,
      totalLengthM: Number(totCapX.toFixed(2)),
      totalWeightKg: Number((totCapX * wtCapX).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Pile cap heavy tension reinforcement',
    });

    // Pile Cap Bottom Mat (Width Y)
    const capSpanY = Math.max(capW - 2 * cover, 100);
    const capCountY = Math.ceil(Math.max(capL - 2 * cover, 100) / spacingY) + 1;
    const resCapY = calculateRebarShape({ shapeCode: '37', dia: diaY, dimA: capSpanY, dimB: capBend, steelGrade: grade });
    const totCapY = (resCapY.cutLengthMm * capCountY) / 1000;
    const wtCapY = getUnitWeight(diaY);
    items.push({
      barMark: `${input.memberTag}-CAP-B2`,
      description: `${input.memberTag} Pile Cap Bottom Mat along Width (${capSpanY}mm) @ ${spacingY}mm c/c`,
      shapeCode: '37',
      dia: diaY,
      count: capCountY,
      dimA: capSpanY,
      dimB: capBend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCapY.rawLengthMm,
      calculatedCutLength: resCapY.cutLengthMm,
      unitWeight: wtCapY,
      totalLengthM: Number(totCapY.toFixed(2)),
      totalWeightKg: Number((totCapY * wtCapY).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Pile cap transverse bottom reinforcement',
    });

    // Pile Cap Top Mesh (if present)
    if (input.hasTopMesh) {
      const topCountX = Math.ceil(Math.max(capW - 2 * cover, 100) / topSpacingX) + 1;
      const resTopX = calculateRebarShape({ shapeCode: '37', dia: topDiaX, dimA: capSpanX, dimB: capBend, steelGrade: grade });
      const totTopX = (resTopX.cutLengthMm * topCountX) / 1000;
      const wtTopX = getUnitWeight(topDiaX);
      items.push({
        barMark: `${input.memberTag}-CAP-T1`,
        description: `${input.memberTag} Pile Cap Top Mat along Length (${capSpanX}mm) @ ${topSpacingX}mm c/c`,
        shapeCode: '37',
        dia: topDiaX,
        count: topCountX,
        dimA: capSpanX,
        dimB: capBend,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resTopX.rawLengthMm,
        calculatedCutLength: resTopX.cutLengthMm,
        unitWeight: wtTopX,
        totalLengthM: Number(totTopX.toFixed(2)),
        totalWeightKg: Number((totTopX * wtTopX).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'Pile cap top mesh',
      });
    }

    // Piles Reinforcement (for all N piles)
    // Vertical Main Bars with Cap Dowel L-Bend (50d or 600mm embedment into pile cap)
    const pileDowelL = Math.max(capD - 2 * cover, 600);
    const pileTotalVertLength = pLen + pileDowelL;
    const resPileVert = calculateRebarShape({
      shapeCode: '21',
      dia: pVertDia,
      dimA: pLen,
      dimB: pileDowelL,
      steelGrade: grade,
    });
    const totalVertBars = pCount * pVertCount;
    const totPileVertM = (resPileVert.cutLengthMm * totalVertBars) / 1000;
    const wtPileVert = getUnitWeight(pVertDia);
    items.push({
      barMark: `${input.memberTag}-PILE-V1`,
      description: `${input.memberTag} Pile Vertical Longitudinal Bars (${pCount} Piles × ${pVertCount} Nos = ${totalVertBars} Nos Ø${pVertDia}mm)`,
      shapeCode: '21',
      dia: pVertDia,
      count: totalVertBars,
      dimA: pLen,
      dimB: pileDowelL,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resPileVert.rawLengthMm,
      calculatedCutLength: resPileVert.cutLengthMm,
      unitWeight: wtPileVert,
      totalLengthM: Number(totPileVertM.toFixed(2)),
      totalWeightKg: Number((totPileVertM * wtPileVert).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: `Longitudinal cage anchored ${pileDowelL}mm into pile cap`,
    });

    // Piles Lateral Ties / Helical Spiral
    if (pShape === 'CIRCULAR') {
      const coreDia = pDia - 2 * cover;
      const turns = Math.ceil(pLen / pPitch);
      const resSpiral = calculateRebarShape({
        shapeCode: '86',
        dia: pSpiralDia,
        dimA: coreDia,
        dimB: pPitch,
        dimC: pLen,
        turns,
        steelGrade: grade,
      });
      const totSpiralM = (resSpiral.cutLengthMm * pCount) / 1000;
      const wtSpiral = getUnitWeight(pSpiralDia);
      items.push({
        barMark: `${input.memberTag}-PILE-SPIRAL`,
        description: `${input.memberTag} Pile Helical Spiral Links (Ø${pSpiralDia}mm @ ${pPitch}mm pitch, ${pCount} Piles)`,
        shapeCode: '86',
        dia: pSpiralDia,
        count: pCount,
        dimA: coreDia,
        dimB: pPitch,
        dimC: pLen,
        dimD: 0,
        dimE: 0,
        rawCutLength: resSpiral.rawLengthMm,
        calculatedCutLength: resSpiral.cutLengthMm,
        unitWeight: wtSpiral,
        totalLengthM: Number(totSpiralM.toFixed(2)),
        totalWeightKg: Number((totSpiralM * wtSpiral).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: `Continuous helical spiral for ${pCount} circular bored piles`,
      });
    } else {
      // Rectangular Pile Ties
      const tieA = pDia - 2 * cover;
      const tiesPerPile = Math.ceil(pLen / pPitch) + 1;
      const totalTies = pCount * tiesPerPile;
      const resTies = calculateRebarShape({ shapeCode: '51', dia: pSpiralDia, dimA: tieA, dimB: tieA, steelGrade: grade });
      const totTiesM = (resTies.cutLengthMm * totalTies) / 1000;
      const wtTies = getUnitWeight(pSpiralDia);
      items.push({
        barMark: `${input.memberTag}-PILE-TIE`,
        description: `${input.memberTag} Rectangular Pile Closed Lateral Ties (Ø${pSpiralDia}mm @ ${pPitch}mm c/c)`,
        shapeCode: '51',
        dia: pSpiralDia,
        count: totalTies,
        dimA: tieA,
        dimB: tieA,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resTies.rawLengthMm,
        calculatedCutLength: resTies.cutLengthMm,
        unitWeight: wtTies,
        totalLengthM: Number(totTiesM.toFixed(2)),
        totalWeightKg: Number((totTiesM * wtTies).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'Rectangular pile lateral confining ties',
      });
    }

    return items;
  }

  // -------------------------------------------------------------
  // 3. ISOLATED, STEPPED, SLOPED / TRAPEZOIDAL, COMBINED, RAFT
  // -------------------------------------------------------------

  // 1. Primary Bottom Mesh Along Length (X direction)
  const spanX = Math.max(input.length - 2 * cover, 100);
  const countX = Math.ceil(Math.max(input.width - 2 * cover, 100) / spacingX) + 1;
  const resBottomX = calculateRebarShape({
    shapeCode: '37', // U-bar with 2 bends of 90°
    dia: diaX,
    dimA: spanX,
    dimB: bendUpHeight,
    steelGrade: grade,
  });

  const totLenX = (resBottomX.cutLengthMm * countX) / 1000;
  const unitWtX = getUnitWeight(diaX);

  items.push({
    barMark: `${input.memberTag}-B1`,
    description: `${input.memberTag} Bottom Main along Length (${spanX}mm span) @ ${spacingX}mm c/c`,
    shapeCode: '37',
    dia: diaX,
    count: countX,
    dimA: spanX,
    dimB: bendUpHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resBottomX.rawLengthMm,
    calculatedCutLength: resBottomX.cutLengthMm,
    unitWeight: unitWtX,
    totalLengthM: Number(totLenX.toFixed(2)),
    totalWeightKg: Number((totLenX * unitWtX).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `IS 2502 Shape 37, 90° bend up ${bendUpHeight}mm at both ends`,
  });

  // 2. Primary Bottom Mesh Along Width (Y direction)
  const spanY = Math.max(input.width - 2 * cover, 100);
  const countY = Math.ceil(Math.max(input.length - 2 * cover, 100) / spacingY) + 1;
  const resBottomY = calculateRebarShape({
    shapeCode: '37',
    dia: diaY,
    dimA: spanY,
    dimB: bendUpHeight,
    steelGrade: grade,
  });

  const totLenY = (resBottomY.cutLengthMm * countY) / 1000;
  const unitWtY = getUnitWeight(diaY);

  items.push({
    barMark: `${input.memberTag}-B2`,
    description: `${input.memberTag} Bottom Main along Width (${spanY}mm span) @ ${spacingY}mm c/c`,
    shapeCode: '37',
    dia: diaY,
    count: countY,
    dimA: spanY,
    dimB: bendUpHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resBottomY.rawLengthMm,
    calculatedCutLength: resBottomY.cutLengthMm,
    unitWeight: unitWtY,
    totalLengthM: Number(totLenY.toFixed(2)),
    totalWeightKg: Number((totLenY * unitWtY).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `IS 2502 Shape 37, 90° bend up ${bendUpHeight}mm at both ends`,
  });

  // 3. Stepped Footing Upper Step Mesh (if STEPPED)
  if (type.includes('STEP')) {
    const sLen2 = input.stepLength2 || Math.round(input.length * 0.6);
    const sWid2 = input.stepWidth2 || Math.round(input.width * 0.6);
    const sDepth2 = input.stepDepth2 || Math.round(input.depth * 0.5);
    const stepBend = Math.max(sDepth2 - cover, 100);

    const sSpanX = Math.max(sLen2 - 2 * cover, 100);
    const sCountX = Math.ceil(Math.max(sWid2 - 2 * cover, 100) / spacingX) + 1;
    const resStepX = calculateRebarShape({ shapeCode: '37', dia: diaX, dimA: sSpanX, dimB: stepBend, steelGrade: grade });
    const sTotLenX = (resStepX.cutLengthMm * sCountX) / 1000;

    items.push({
      barMark: `${input.memberTag}-STEP-T1`,
      description: `${input.memberTag} Upper Step Mesh along Length (${sSpanX}mm) @ ${spacingX}mm c/c`,
      shapeCode: '37',
      dia: diaX,
      count: sCountX,
      dimA: sSpanX,
      dimB: stepBend,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resStepX.rawLengthMm,
      calculatedCutLength: resStepX.cutLengthMm,
      unitWeight: unitWtX,
      totalLengthM: Number(sTotLenX.toFixed(2)),
      totalWeightKg: Number((sTotLenX * unitWtX).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Upper step reinforcement cage',
    });
  }

  // 4. Combined Footing Column Starter Dowels
  if (type.includes('COMB')) {
    const cDowelDia = input.colDowelDia || 16;
    const cDowelCount = input.colDowelCount || 8; // 4 bars per column × 2 columns
    const cDowelL = Math.max(input.depth - cover, 400);
    const cDowelFoot = 300;
    const resDowel = calculateRebarShape({ shapeCode: '21', dia: cDowelDia, dimA: cDowelL + 600, dimB: cDowelFoot, steelGrade: grade });
    const totDowel = (resDowel.cutLengthMm * cDowelCount) / 1000;
    const wtDowel = getUnitWeight(cDowelDia);

    items.push({
      barMark: `${input.memberTag}-COL-DOWEL`,
      description: `${input.memberTag} Combined Footing Column Starter Dowels (${cDowelCount} Nos Ø${cDowelDia}mm for 2 Columns)`,
      shapeCode: '21',
      dia: cDowelDia,
      count: cDowelCount,
      dimA: cDowelL + 600,
      dimB: cDowelFoot,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resDowel.rawLengthMm,
      calculatedCutLength: resDowel.cutLengthMm,
      unitWeight: wtDowel,
      totalLengthM: Number(totDowel.toFixed(2)),
      totalWeightKg: Number((totDowel * wtDowel).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Column 1 and Column 2 starter bars anchored into combined footing',
    });
  }

  // 5. Top Reinforcement (ONLY for Rafts, Combined Footings, or if user explicitly requested hasTopMesh)
  // For trapezoidal/sloped footing, top reinforcement is strictly NOT needed per user requirement
  const needsTopMesh = !isSloped && (input.hasTopMesh || type.includes('RAFT') || type.includes('COMB'));
  if (needsTopMesh) {
    const topCountX = Math.ceil(Math.max(input.width - 2 * cover, 100) / topSpacingX) + 1;
    const resTopX = calculateRebarShape({
      shapeCode: '37',
      dia: topDiaX,
      dimA: spanX,
      dimB: bendUpHeight,
      steelGrade: grade,
    });
    const totTopX = (resTopX.cutLengthMm * topCountX) / 1000;
    const wtTopX = getUnitWeight(topDiaX);

    items.push({
      barMark: `${input.memberTag}-T1`,
      description: `${input.memberTag} Top Mat along Length (${spanX}mm) @ ${topSpacingX}mm c/c`,
      shapeCode: '37',
      dia: topDiaX,
      count: topCountX,
      dimA: spanX,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopX.rawLengthMm,
      calculatedCutLength: resTopX.cutLengthMm,
      unitWeight: wtTopX,
      totalLengthM: Number(totTopX.toFixed(2)),
      totalWeightKg: Number((totTopX * wtTopX).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Top mat longitudinal reinforcement for hogging moments',
    });

    const topCountY = Math.ceil(Math.max(input.length - 2 * cover, 100) / topSpacingY) + 1;
    const resTopY = calculateRebarShape({
      shapeCode: '37',
      dia: topDiaY,
      dimA: spanY,
      dimB: bendUpHeight,
      steelGrade: grade,
    });
    const totTopY = (resTopY.cutLengthMm * topCountY) / 1000;
    const wtTopY = getUnitWeight(topDiaY);

    items.push({
      barMark: `${input.memberTag}-T2`,
      description: `${input.memberTag} Top Mat along Width (${spanY}mm) @ ${topSpacingY}mm c/c`,
      shapeCode: '37',
      dia: topDiaY,
      count: topCountY,
      dimA: spanY,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopY.rawLengthMm,
      calculatedCutLength: resTopY.cutLengthMm,
      unitWeight: wtTopY,
      totalLengthM: Number(totTopY.toFixed(2)),
      totalWeightKg: Number((totTopY * wtTopY).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Top mat transverse reinforcement',
    });
  }

  // 6. Raft / Foundation Spacer Chairs (3D Stand)
  // Per user instruction: Spacer chairs MUST ONLY be included if necessary (when top mesh exists, e.g. Raft or Double Mat)
  const hasChairs = needsTopMesh && (input.includeChairs || type.includes('RAFT') || input.chairCount);
  if (hasChairs) {
    const cDia = input.chairDia || 12;
    const areaM2 = (input.length * input.width) / 1000000;
    const chairCount = input.chairCount || Math.max(Math.ceil(areaM2 * 1.0), 4); // 1 chair per m²
    const cHeight = input.chairHeight || Math.max(input.depth - 2 * cover - diaX - topDiaX - 25, 200);
    const cHead = input.chairHead || 300;
    const cFoot = input.chairFoot || 200;

    const resChair = calculateRebarShape({
      shapeCode: 'CHAIR',
      dia: cDia,
      dimA: cHead,
      dimB: cHeight,
      dimC: cFoot,
      steelGrade: grade,
    });

    const totChair = (resChair.cutLengthMm * chairCount) / 1000;
    const wtChair = getUnitWeight(cDia);

    items.push({
      barMark: `${input.memberTag}-CH1`,
      description: `${input.memberTag} Raft spacer chairs @ 1.0m grid (Head ${cHead}, Leg ${cHeight}, Foot ${cFoot})`,
      shapeCode: 'CHAIR',
      dia: cDia,
      count: chairCount,
      dimA: cHead,
      dimB: cHeight,
      dimC: cFoot,
      dimD: 0,
      dimE: 0,
      rawCutLength: resChair.rawLengthMm,
      calculatedCutLength: resChair.cutLengthMm,
      unitWeight: wtChair,
      totalLengthM: Number(totChair.toFixed(2)),
      totalWeightKg: Number((totChair * wtChair).toFixed(2)),
      isPayable: true,
      isChair: true,
      isLap: false,
      remarks: 'IS 2502 3D Raft Chair Spacer to maintain top-bottom mesh separation',
    });
  }

  return items;
}
