import { calculateRebarShape, getDevelopmentLength, getBendAllowance90, getStirrupHookTail, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface BeamInput {
  memberTag: string; // e.g. "B101", "CB-1", "CANT-B2", "DEEP-B3"
  beamType?: 'SIMPLY_SUPPORTED' | 'CONTINUOUS' | 'CANTILEVER' | 'CONTINUOUS_WITH_CANTILEVER' | 'FIXED' | 'DEEP';
  subType?: string;
  clearSpan: number; // mm (L or Main Span L1)
  width: number; // mm (b)
  depth: number; // mm (D)
  supportWidthLeft?: number; // mm (default 300mm)
  supportWidthRight?: number; // mm (default 300mm)
  clearCover?: number; // mm (default 25mm)

  // Continuous Spans specific
  spanCount?: number; // 2, 3, 4, 5 spans
  span2Length?: number; // mm
  span3Length?: number; // mm
  intermediateSupportWidth?: number; // mm

  // Cantilever specific
  cantileverLengthLeft?: number; // mm
  cantileverLengthRight?: number; // mm

  // Top Reinforcement
  topMainDia?: number; // mm
  topMainCount?: number;
  topMainDia2?: number; // mm (Layer 2 mixed diameter)
  topMainCount2?: number;
  topExtraLeftDia?: number; // mm
  topExtraLeftCount?: number;
  topExtraRightDia?: number;
  topExtraRightCount?: number;
  topExtraMidSupportDia?: number; // mm
  topExtraMidSupportCount?: number;

  // Bottom Reinforcement
  bottomMainDia?: number; // mm
  bottomMainCount?: number;
  bottomMainDia2?: number; // mm (Layer 2 mixed diameter)
  bottomMainCount2?: number;
  bottomExtraMidDia?: number; // mm
  bottomExtraMidCount?: number;

  // Cranked Bars (Bent-up bars)
  hasCrankedBars?: boolean;
  crankedBarDia?: number;
  crankedBarCount?: number;

  // Side-Face Reinforcement (Mandatory if depth > 750mm per IS 456 Cl. 26.5.1.6)
  includeSideFace?: boolean;
  sideFaceDia?: number;
  sideFaceCountEachFace?: number;

  // Stirrups / Shear Links
  stirrupDia?: number; // mm
  stirrupSpacingSupport?: number; // mm c/c
  stirrupSpacingMid?: number; // mm c/c
  stirrupType?: '2_LEG' | '4_LEG';

  isSeismic?: boolean;
  concreteGrade?: string;
  steelGrade?: string;
}

export function generateBeamBBS(input: BeamInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 25; // IS 456 beam cover = 25mm
  const grade = input.steelGrade ?? 'Fe500D';
  const concrete = input.concreteGrade ?? 'M25';
  const isSeismic = input.isSeismic ?? true;
  const type = (input.beamType || input.subType || 'SIMPLY_SUPPORTED').toUpperCase();

  const topDia = input.topMainDia || 16;
  const topCount = input.topMainCount || 2;
  const botDia = input.bottomMainDia || 20;
  const botCount = input.bottomMainCount || 3;
  const stirrupDia = input.stirrupDia || 8;
  const stirrupSpacingSup = input.stirrupSpacingSupport || 100;
  const stirrupSpacingMid = input.stirrupSpacingMid || 175;

  const supLeft = input.supportWidthLeft ?? 300;
  const supRight = input.supportWidthRight ?? 300;
  const Ld = getDevelopmentLength(botDia, concrete, grade);
  const anchorBendDown = Math.max(input.depth - 2 * cover, 150);

  // Calculate total span depending on type
  let totalSpan = input.clearSpan;
  const span2 = input.span2Length || 0;
  const span3 = input.span3Length || 0;
  const cantL = input.cantileverLengthLeft || (type.includes('CANTILEVER') && !type.includes('CONTINUOUS') ? input.clearSpan : 0);
  const cantR = input.cantileverLengthRight || 0;

  if (type.includes('CONTINUOUS')) {
    totalSpan = input.clearSpan + (span2 > 0 ? span2 + 300 : 0) + (span3 > 0 ? span3 + 300 : 0);
  }
  if (cantL > 0 && type.includes('CONTINUOUS')) totalSpan += cantL;
  if (cantR > 0 && type.includes('CONTINUOUS')) totalSpan += cantR;

  // -------------------------------------------------------------
  // 1. CANTILEVER BEAM SPECIFIC DETAILING
  // -------------------------------------------------------------
  if (type === 'CANTILEVER') {
    const cantSpan = input.clearSpan;
    // Top tension steel = cantilever span + support anchor Ld + end 90° bend down
    const cantTopDimA = cantSpan + Ld;
    const resCantTop = calculateRebarShape({
      shapeCode: '21', // L-shape
      dia: topDia,
      dimA: cantTopDimA,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totCantTop = (resCantTop.cutLengthMm * topCount) / 1000;
    const wtCantTop = getUnitWeight(topDia);

    items.push({
      barMark: 'B-CANT-T1',
      description: `${input.memberTag} Cantilever Top Main Tension Bars (Full Span ${cantSpan}mm + Ld ${Ld}mm Anchor)`,
      shapeCode: '21',
      dia: topDia,
      count: topCount,
      dimA: cantTopDimA,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCantTop.rawLengthMm,
      calculatedCutLength: resCantTop.cutLengthMm,
      unitWeight: wtCantTop,
      totalLengthM: Number(totCantTop.toFixed(2)),
      totalWeightKg: Number((totCantTop * wtCantTop).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: `IS 456 Cl. 26.2.1 Cantilever top tension steel anchored ${Ld}mm into support column`,
    });

    // Bottom compression nominal bars
    const cantBotDimA = cantSpan + (supLeft - cover);
    const resCantBot = calculateRebarShape({
      shapeCode: '21',
      dia: botDia,
      dimA: cantBotDimA,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totCantBot = (resCantBot.cutLengthMm * botCount) / 1000;
    const wtCantBot = getUnitWeight(botDia);

    items.push({
      barMark: 'B-CANT-B1',
      description: `${input.memberTag} Cantilever Bottom Compression / Nominal Bars`,
      shapeCode: '21',
      dia: botDia,
      count: botCount,
      dimA: cantBotDimA,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCantBot.rawLengthMm,
      calculatedCutLength: resCantBot.cutLengthMm,
      unitWeight: wtCantBot,
      totalLengthM: Number(totCantBot.toFixed(2)),
      totalWeightKg: Number((totCantBot * wtCantBot).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Cantilever bottom nominal steel anchored into support',
    });

    // Cantilever Stirrups
    const cA = input.width - 2 * cover;
    const cB = input.depth - 2 * cover;
    const cStirrupCount = Math.ceil(cantSpan / stirrupSpacingSup) + 1;
    const resCantStirrup = calculateRebarShape({
      shapeCode: '51',
      dia: stirrupDia,
      dimA: cA,
      dimB: cB,
      steelGrade: grade,
    });
    const totCantStirrup = (resCantStirrup.cutLengthMm * cStirrupCount) / 1000;
    const wtCantStirrup = getUnitWeight(stirrupDia);

    items.push({
      barMark: 'B-CANT-ST',
      description: `${input.memberTag} Cantilever 135° Seismic Stirrups @ ${stirrupSpacingSup}mm c/c`,
      shapeCode: '51',
      dia: stirrupDia,
      count: cStirrupCount,
      dimA: cA,
      dimB: cB,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCantStirrup.rawLengthMm,
      calculatedCutLength: resCantStirrup.cutLengthMm,
      unitWeight: wtCantStirrup,
      totalLengthM: Number(totCantStirrup.toFixed(2)),
      totalWeightKg: Number((totCantStirrup * wtCantStirrup).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 13920 135° seismic closed stirrups throughout cantilever length',
    });

    return items;
  }

  // -------------------------------------------------------------
  // 2. SIMPLY SUPPORTED, CONTINUOUS, FIXED & DEEP BEAM DETAILING
  // -------------------------------------------------------------

  // Top Main Longitudinal Bars
  const topMainDimA = totalSpan + (supLeft - cover) + (supRight - cover);
  const resTopMain = calculateRebarShape({
    shapeCode: '37', // U-shape with 90° end anchors down
    dia: topDia,
    dimA: topMainDimA,
    dimB: anchorBendDown,
    steelGrade: grade,
  });
  const totTopMain = (resTopMain.cutLengthMm * topCount) / 1000;
  const wtTopMain = getUnitWeight(topDia);

  items.push({
    barMark: 'B-T1',
    description: `${input.memberTag} Top Main Hanger / Through Bars`,
    shapeCode: '37',
    dia: topDia,
    count: topCount,
    dimA: topMainDimA,
    dimB: anchorBendDown,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resTopMain.rawLengthMm,
    calculatedCutLength: resTopMain.cutLengthMm,
    unitWeight: wtTopMain,
    totalLengthM: Number(totTopMain.toFixed(2)),
    totalWeightKg: Number((totTopMain * wtTopMain).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `IS 2502 Shape 37, 90° bend down ${anchorBendDown}mm into support columns`,
  });

  // Top Secondary Layer (Layer 2 Mixed Bars)
  const topDia2 = input.topMainDia2 || 12;
  const topCount2 = input.topMainCount2 || 0;
  if (topCount2 > 0) {
    const resTop2 = calculateRebarShape({
      shapeCode: '37',
      dia: topDia2,
      dimA: topMainDimA,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totTop2 = (resTop2.cutLengthMm * topCount2) / 1000;
    const wtTop2 = getUnitWeight(topDia2);
    items.push({
      barMark: 'B-T1b',
      description: `${input.memberTag} Top Secondary Mixed Bars (${topCount2} Nos Ø${topDia2}mm)`,
      shapeCode: '37',
      dia: topDia2,
      count: topCount2,
      dimA: topMainDimA,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTop2.rawLengthMm,
      calculatedCutLength: resTop2.cutLengthMm,
      unitWeight: wtTop2,
      totalLengthM: Number(totTop2.toFixed(2)),
      totalWeightKg: Number((totTop2 * wtTop2).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 2502 Shape 37, mixed top layer rebar (Layer 2)',
    });
  }

  // Bottom Main Longitudinal Bars
  const botMainDimA = totalSpan + (supLeft - cover) + (supRight - cover);
  const resBotMain = calculateRebarShape({
    shapeCode: '37', // U-shape with 90° end anchors up
    dia: botDia,
    dimA: botMainDimA,
    dimB: anchorBendDown,
    steelGrade: grade,
  });
  const totBotMain = (resBotMain.cutLengthMm * botCount) / 1000;
  const wtBotMain = getUnitWeight(botDia);

  items.push({
    barMark: 'B-B1',
    description: `${input.memberTag} Bottom Main Tension Bars`,
    shapeCode: '37',
    dia: botDia,
    count: botCount,
    dimA: botMainDimA,
    dimB: anchorBendDown,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resBotMain.rawLengthMm,
    calculatedCutLength: resBotMain.cutLengthMm,
    unitWeight: wtBotMain,
    totalLengthM: Number(totBotMain.toFixed(2)),
    totalWeightKg: Number((totBotMain * wtBotMain).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `IS 2502 Shape 37, 90° bend up ${anchorBendDown}mm into support columns`,
  });

  // Bottom Secondary Layer (Layer 2 Mixed Bars)
  const botDia2 = input.bottomMainDia2 || 16;
  const botCount2 = input.bottomMainCount2 || 0;
  if (botCount2 > 0) {
    const resBot2 = calculateRebarShape({
      shapeCode: '37',
      dia: botDia2,
      dimA: botMainDimA,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totBot2 = (resBot2.cutLengthMm * botCount2) / 1000;
    const wtBot2 = getUnitWeight(botDia2);
    items.push({
      barMark: 'B-B1b',
      description: `${input.memberTag} Bottom Secondary Mixed Bars (${botCount2} Nos Ø${botDia2}mm)`,
      shapeCode: '37',
      dia: botDia2,
      count: botCount2,
      dimA: botMainDimA,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resBot2.rawLengthMm,
      calculatedCutLength: resBot2.cutLengthMm,
      unitWeight: wtBot2,
      totalLengthM: Number(totBot2.toFixed(2)),
      totalWeightKg: Number((totBot2 * wtBot2).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 2502 Shape 37, mixed bottom layer rebar (Layer 2)',
    });
  }

  // Top Extra Bars at Supports (for Hogging Moments)
  const topExtraLeftCount = input.topExtraLeftCount ?? 2;
  const topExtraLeftDia = input.topExtraLeftDia ?? topDia;
  const topExtraLeftLength = Math.round(input.clearSpan * 0.3) + (supLeft - cover);

  if (topExtraLeftCount > 0) {
    const resTopExtraLeft = calculateRebarShape({
      shapeCode: '21', // L-Bar
      dia: topExtraLeftDia,
      dimA: topExtraLeftLength,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totTopExtraLeft = (resTopExtraLeft.cutLengthMm * topExtraLeftCount) / 1000;
    const wtTopExtraLeft = getUnitWeight(topExtraLeftDia);

    items.push({
      barMark: 'B-T2-L',
      description: `${input.memberTag} Top Extra Bars at Left Support (Curtailment 0.30L)`,
      shapeCode: '21',
      dia: topExtraLeftDia,
      count: topExtraLeftCount,
      dimA: topExtraLeftLength,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopExtraLeft.rawLengthMm,
      calculatedCutLength: resTopExtraLeft.cutLengthMm,
      unitWeight: wtTopExtraLeft,
      totalLengthM: Number(totTopExtraLeft.toFixed(2)),
      totalWeightKg: Number((totTopExtraLeft * wtTopExtraLeft).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Negative hogging moment reinforcement at left support',
    });
  }

  const topExtraRightCount = input.topExtraRightCount ?? 2;
  const topExtraRightDia = input.topExtraRightDia ?? topDia;
  const topExtraRightLength = Math.round(input.clearSpan * 0.3) + (supRight - cover);

  if (topExtraRightCount > 0) {
    const resTopExtraRight = calculateRebarShape({
      shapeCode: '21',
      dia: topExtraRightDia,
      count: topExtraRightCount,
      dimA: topExtraRightLength,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totTopExtraRight = (resTopExtraRight.cutLengthMm * topExtraRightCount) / 1000;
    const wtTopExtraRight = getUnitWeight(topExtraRightDia);

    items.push({
      barMark: 'B-T2-R',
      description: `${input.memberTag} Top Extra Bars at Right Support (Curtailment 0.30L)`,
      shapeCode: '21',
      dia: topExtraRightDia,
      count: topExtraRightCount,
      dimA: topExtraRightLength,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopExtraRight.rawLengthMm,
      calculatedCutLength: resTopExtraRight.cutLengthMm,
      unitWeight: wtTopExtraRight,
      totalLengthM: Number(totTopExtraRight.toFixed(2)),
      totalWeightKg: Number((totTopExtraRight * wtTopExtraRight).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Negative hogging moment reinforcement at right support',
    });
  }

  // Continuous Beam Intermediate Support Top Extra Bars
  if (type.includes('CONTINUOUS') && span2 > 0) {
    const midSupDia = input.topExtraMidSupportDia || topDia;
    const midSupCount = input.topExtraMidSupportCount || 3;
    const midSupLength = Math.round(Math.max(input.clearSpan, span2) * 0.6) + 300; // 0.3L left + 0.3L right

    const resMidSup = calculateRebarShape({
      shapeCode: '20', // Straight bar
      dia: midSupDia,
      dimA: midSupLength,
      steelGrade: grade,
    });
    const totMidSup = (resMidSup.cutLengthMm * midSupCount) / 1000;
    const wtMidSup = getUnitWeight(midSupDia);

    items.push({
      barMark: 'B-T2-MID',
      description: `${input.memberTag} Continuous Intermediate Support Top Extra Bars (0.3L1 + 0.3L2)`,
      shapeCode: '20',
      dia: midSupDia,
      count: midSupCount,
      dimA: midSupLength,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resMidSup.rawLengthMm,
      calculatedCutLength: resMidSup.cutLengthMm,
      unitWeight: wtMidSup,
      totalLengthM: Number(totMidSup.toFixed(2)),
      totalWeightKg: Number((totMidSup * wtMidSup).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Continuous hogging moment rebar across intermediate column support',
    });
  }

  // Side-Face Reinforcement (Mandatory if overall depth D > 750mm per IS 456 Cl. 26.5.1.6)
  const isDeepBeam = input.depth > 750 || input.includeSideFace || type.includes('DEEP');
  if (isDeepBeam) {
    const sideDia = input.sideFaceDia ?? 12;
    const sideCountEachFace = input.sideFaceCountEachFace ?? Math.max(Math.floor((input.depth - 2 * cover) / 300) - 1, 1);
    const totalSideCount = sideCountEachFace * 2;
    const sideLength = totalSpan + (supLeft - cover) + (supRight - cover);

    const resSideFace = calculateRebarShape({
      shapeCode: '21',
      dia: sideDia,
      dimA: sideLength,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totSideFace = (resSideFace.cutLengthMm * totalSideCount) / 1000;
    const wtSideFace = getUnitWeight(sideDia);

    items.push({
      barMark: 'B-SF1',
      description: `${input.memberTag} Side-Face Rebar (IS 456 D>750mm: ${sideCountEachFace}+${sideCountEachFace} bars on 2 faces)`,
      shapeCode: '21',
      dia: sideDia,
      count: totalSideCount,
      dimA: sideLength,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resSideFace.rawLengthMm,
      calculatedCutLength: resSideFace.cutLengthMm,
      unitWeight: wtSideFace,
      totalLengthM: Number(totSideFace.toFixed(2)),
      totalWeightKg: Number((totSideFace * wtSideFace).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Cl. 26.5.1.6 Side-face reinforcement ≥ 0.1% web area to prevent web cracking',
    });
  }

  // Shear Stirrups (IS 13920 seismic ductile confinement: 2*depth at ends)
  const dimA = Math.max(input.width - 2 * cover, 100);
  const dimB = Math.max(input.depth - 2 * cover, 100);
  const confinedZoneLength = Math.min(2 * input.depth, Math.round(totalSpan / 4));
  const middleZoneLength = Math.max(totalSpan - 2 * confinedZoneLength, 0);

  const countConfined = Math.ceil(confinedZoneLength / stirrupSpacingSup) * 2;
  const countMiddle = middleZoneLength > 0 ? Math.ceil(middleZoneLength / stirrupSpacingMid) : 0;
  const totalStirrups = countConfined + countMiddle;

  const resStirrup = calculateRebarShape({
    shapeCode: '51', // Rectangular stirrup with 135° seismic hooks
    dia: stirrupDia,
    dimA,
    dimB,
    steelGrade: grade,
  });

  const totStirrup = (resStirrup.cutLengthMm * totalStirrups) / 1000;
  const wtStirrup = getUnitWeight(stirrupDia);

  items.push({
    barMark: 'B-ST1',
    description: `${input.memberTag} 135° Seismic Stirrups (${countConfined} @ ${stirrupSpacingSup}mm ends, ${countMiddle} @ ${stirrupSpacingMid}mm mid)`,
    shapeCode: '51',
    dia: stirrupDia,
    count: totalStirrups,
    dimA,
    dimB,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resStirrup.rawLengthMm,
    calculatedCutLength: resStirrup.cutLengthMm,
    unitWeight: wtStirrup,
    totalLengthM: Number(totStirrup.toFixed(2)),
    totalWeightKg: Number((totStirrup * wtStirrup).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'IS 13920 Cl. 6.2.2 135° seismic hooks with 10d (min 75mm) tail extension',
  });

  return items;
}
