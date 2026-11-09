import { calculateRebarShape, roundUpTo25mm, getUnitWeight } from '../is2502';

export interface FootingInput {
  memberTag: string; // e.g. "F1", "STEP-F2", "STRAP-F3", "COMB-F4", "RAFT-1", "PC-4P"
  footingType?: 'ISOLATED' | 'STEPPED' | 'SLOPED_TRAPEZOIDAL' | 'STRAP' | 'COMBINED' | 'RAFT' | 'PILE_CAP';
  subType?: string;
  length: number; // mm (X-direction)
  width: number; // mm (Y-direction)
  depth: number; // mm (overall depth D)
  clearCover?: number; // mm (default 50mm foundation cover)

  // Stepped Footing specific
  stepLength2?: number; // mm (upper step)
  stepWidth2?: number; // mm (upper step)
  stepDepth1?: number; // mm (lower step depth)
  stepDepth2?: number; // mm (upper step depth)

  // Sloped / Trapezoidal Footing specific
  edgeDepth?: number; // mm (edge thickness d_edge)
  pedestalLength?: number; // mm
  pedestalWidth?: number; // mm

  // Strap Footing specific
  strapBeamLength?: number; // mm (distance between footings)
  strapBeamWidth?: number; // mm
  strapBeamDepth?: number; // mm
  strapTopDia?: number; // mm
  strapTopCount?: number;
  strapBottomDia?: number; // mm
  strapBottomCount?: number;
  strapStirrupDia?: number; // mm
  strapStirrupSpacing?: number; // mm

  // Pile Cap specific
  pileCount?: 2 | 3 | 4 | 5 | 6 | 8;
  pileDia?: number; // mm (e.g. 500mm)
  pileSpacing?: number; // mm (e.g. 1500mm 3*pileDia)

  // Bottom Reinforcement
  bottomDiaX?: number; // mm
  bottomSpacingX?: number; // mm c/c
  bottomDiaY?: number; // mm
  bottomSpacingY?: number; // mm c/c
  // For alternate naming
  bottomMeshXDia?: number;
  bottomMeshXSpacing?: number;
  bottomMeshYDia?: number;
  bottomMeshYSpacing?: number;

  // Top Reinforcement (Raft / Combined / Pile Cap / Stepped)
  hasTopMesh?: boolean;
  topDiaX?: number; // mm
  topSpacingX?: number; // mm
  topDiaY?: number; // mm
  topSpacingY?: number; // mm
  topMeshXDia?: number;
  topMeshXSpacing?: number;
  topMeshYDia?: number;
  topMeshYSpacing?: number;

  // Chairs for Rafts / Slabs / Heavy Footings
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

  const bendUpHeight = Math.max(input.depth - 2 * cover, 150);

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

  // 4. Strap Beam Rebar (if STRAP FOOTING)
  if (type.includes('STRAP')) {
    const sBLen = input.strapBeamLength || 4000;
    const sBWid = input.strapBeamWidth || 350;
    const sBDep = input.strapBeamDepth || 600;
    const sTopCount = input.strapTopCount || 4;
    const sTopDia = input.strapTopDia || 20;
    const sBotCount = input.strapBottomCount || 3;
    const sBotDia = input.strapBottomDia || 16;
    const sStirrupDia = input.strapStirrupDia || 8;
    const sStirrupSpacing = input.strapStirrupSpacing || 150;

    // Strap Beam Top Tension Bars
    const resStrapTop = calculateRebarShape({ shapeCode: '21', dia: sTopDia, dimA: sBLen, dimB: sBDep - 2 * cover, steelGrade: grade });
    const totStrapTop = (resStrapTop.cutLengthMm * sTopCount) / 1000;
    const wtStrapTop = getUnitWeight(sTopDia);
    items.push({
      barMark: `${input.memberTag}-STRAP-T1`,
      description: `${input.memberTag} Strap Beam Top Main Tension Bars (${sTopCount} Nos)`,
      shapeCode: '21',
      dia: sTopDia,
      count: sTopCount,
      dimA: sBLen,
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
      remarks: 'Strap beam hogging moment tension reinforcement anchored into footings',
    });

    // Strap Beam Bottom Bars
    const resStrapBot = calculateRebarShape({ shapeCode: '20', dia: sBotDia, dimA: sBLen, steelGrade: grade });
    const totStrapBot = (resStrapBot.cutLengthMm * sBotCount) / 1000;
    const wtStrapBot = getUnitWeight(sBotDia);
    items.push({
      barMark: `${input.memberTag}-STRAP-B1`,
      description: `${input.memberTag} Strap Beam Bottom Nominal Bars (${sBotCount} Nos)`,
      shapeCode: '20',
      dia: sBotDia,
      count: sBotCount,
      dimA: sBLen,
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
      remarks: 'Strap beam bottom compression steel',
    });

    // Strap Beam Stirrups
    const sA = sBWid - 2 * cover;
    const sB = sBDep - 2 * cover;
    const sStirrupCount = Math.ceil(sBLen / sStirrupSpacing) + 1;
    const resStrapStirrup = calculateRebarShape({ shapeCode: '51', dia: sStirrupDia, dimA: sA, dimB: sB, steelGrade: grade });
    const totStrapStirrup = (resStrapStirrup.cutLengthMm * sStirrupCount) / 1000;
    const wtStrapStirrup = getUnitWeight(sStirrupDia);
    items.push({
      barMark: `${input.memberTag}-STRAP-ST`,
      description: `${input.memberTag} Strap Beam 135° Shear Stirrups @ ${sStirrupSpacing}mm c/c`,
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
  }

  // 5. Top Reinforcement (for Rafts, Combined Footings, Pile Caps)
  const needsTopMesh = input.hasTopMesh || type.includes('RAFT') || type.includes('COMB') || type.includes('PILE');
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
  const hasChairs = input.includeChairs || input.chairCount || type.includes('RAFT') || type.includes('COMB');
  if (hasChairs && (needsTopMesh || input.chairCount)) {
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
