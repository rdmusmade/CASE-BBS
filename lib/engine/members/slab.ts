import { calculateRebarShape, getDevelopmentLength, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface SlabInput {
  memberTag: string; // e.g. "SLB-01", "SLAB-1WAY", "SLAB-2WAY", "DOUBLE-JALI-01"
  slabType?: 'ONE_WAY' | 'TWO_WAY' | 'DOUBLE_JALI' | 'SINGLE_JALI' | 'CANTILEVER';
  subType?: string;
  shortSpanLx?: number; // mm (lx)
  longSpanLy?: number; // mm (ly)
  lx?: number;
  ly?: number;
  thickness: number; // mm
  clearCover?: number; // mm (default 20mm per IS 456)
  supportWidth?: number; // mm
  supportWidthX?: number;
  supportWidthY?: number;

  // Reinforcement
  mainBarDia?: number; // mm
  mainBarSpacing?: number; // mm c/c
  shortMainDia?: number;
  shortMainSpacing?: number;
  distBarDia?: number; // mm
  distBarSpacing?: number; // mm c/c
  longMainDia?: number;
  longMainSpacing?: number;

  // Cranked / Alternate Bent-up bars (for TWO_WAY)
  useAlternateCrank?: boolean;

  // Top Reinforcement / Support Hogging Bars
  hasTopExtraAtSupports?: boolean;
  topExtraDia?: number; // mm
  topExtraSpacing?: number; // mm

  // Double Jali specific (Top mesh)
  topMeshDiaX?: number;
  topMeshSpacingX?: number;
  topMeshDiaY?: number;
  topMeshSpacingY?: number;

  // 3D Spacer Chairs (ONLY for DOUBLE_JALI)
  includeChairs?: boolean;
  chairDia?: number; // mm
  chairCount?: number;

  // Cantilever specific
  cantileverBackSpan?: number;

  steelGrade?: string;
  concreteGrade?: string;
}

export function generateSlabBBS(input: SlabInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 20; // IS 456 slab cover = 20mm
  const grade = input.steelGrade ?? 'Fe500D';
  const concrete = input.concreteGrade ?? 'M25';
  const supWidthX = input.supportWidthX || input.supportWidth || 230;
  const supWidthY = input.supportWidthY || input.supportWidth || 230;

  // Standardized to user's 4 core types: ONE_WAY, TWO_WAY, DOUBLE_JALI, SINGLE_JALI
  const rawType = (input.slabType || input.subType || 'TWO_WAY').toUpperCase();
  let type: 'ONE_WAY' | 'TWO_WAY' | 'DOUBLE_JALI' | 'SINGLE_JALI' | 'CANTILEVER' = 'TWO_WAY';
  if (rawType.includes('ONE') || rawType.includes('1_WAY')) type = 'ONE_WAY';
  else if (rawType.includes('DOUBLE') || rawType.includes('DOUBLE_JALI')) type = 'DOUBLE_JALI';
  else if (rawType.includes('SINGLE') || rawType.includes('SINGLE_JALI') || rawType.includes('PCC')) type = 'SINGLE_JALI';
  else if (rawType.includes('CANTILEVER')) type = 'CANTILEVER';
  else type = 'TWO_WAY';

  const lx = input.shortSpanLx || input.lx || 3500;
  const ly = input.longSpanLy || input.ly || 4500;

  const mainDia = input.shortMainDia || input.mainBarDia || 10;
  const mainSpacing = input.shortMainSpacing || input.mainBarSpacing || 150;
  const distDia = input.longMainDia || input.distBarDia || 8;
  const distSpacing = input.longMainSpacing || input.distBarSpacing || 175;

  const bendUpHeight = Math.max(input.thickness - 2 * cover, 50);

  // -------------------------------------------------------------
  // 1. SINGLE JALI (SIMPLE SINGLE MESH / PCC SLAB)
  // -------------------------------------------------------------
  if (type === 'SINGLE_JALI') {
    // Bottom Mesh along Short Span (Lx)
    const dimAx = lx + 2 * (supWidthX - cover);
    const countX = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;
    const resX = calculateRebarShape({ shapeCode: '20', dia: mainDia, dimA: dimAx, steelGrade: grade });
    const totX = (resX.cutLengthMm * countX) / 1000;
    const wtX = getUnitWeight(mainDia);

    items.push({
      barMark: `${input.memberTag}-SJ-X`,
      description: `${input.memberTag} Single Jali Mesh along Short Span (${dimAx}mm) @ ${mainSpacing}mm c/c`,
      shapeCode: '20',
      dia: mainDia,
      count: countX,
      dimA: dimAx,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resX.rawLengthMm,
      calculatedCutLength: resX.cutLengthMm,
      unitWeight: wtX,
      totalLengthM: Number(totX.toFixed(2)),
      totalWeightKg: Number((totX * wtX).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Single layer bottom welded wire mesh / rebar for grade slab',
    });

    // Bottom Mesh along Long Span (Ly)
    const dimAy = ly + 2 * (supWidthY - cover);
    const countY = Math.ceil(Math.max(lx - 2 * cover, 100) / distSpacing) + 1;
    const resY = calculateRebarShape({ shapeCode: '20', dia: distDia, dimA: dimAy, steelGrade: grade });
    const totY = (resY.cutLengthMm * countY) / 1000;
    const wtY = getUnitWeight(distDia);

    items.push({
      barMark: `${input.memberTag}-SJ-Y`,
      description: `${input.memberTag} Single Jali Mesh along Long Span (${dimAy}mm) @ ${distSpacing}mm c/c`,
      shapeCode: '20',
      dia: distDia,
      count: countY,
      dimA: dimAy,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resY.rawLengthMm,
      calculatedCutLength: resY.cutLengthMm,
      unitWeight: wtY,
      totalLengthM: Number(totY.toFixed(2)),
      totalWeightKg: Number((totY * wtY).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Single layer distribution / shrinkage steel (NO spacer chairs needed)',
    });

    return items;
  }

  // -------------------------------------------------------------
  // 2. DOUBLE JALI (TOP MAT + BOTTOM MAT + 3D SPACER CHAIRS)
  // -------------------------------------------------------------
  if (type === 'DOUBLE_JALI') {
    // 1. Bottom Mat X
    const dimAx = lx + 2 * (supWidthX - cover);
    const countX = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;
    const resBotX = calculateRebarShape({ shapeCode: '37', dia: mainDia, dimA: dimAx, dimB: bendUpHeight, steelGrade: grade });
    const totBotX = (resBotX.cutLengthMm * countX) / 1000;
    const wtBotX = getUnitWeight(mainDia);

    items.push({
      barMark: `${input.memberTag}-B1-X`,
      description: `${input.memberTag} Bottom Mat along Short Span (${dimAx}mm) @ ${mainSpacing}mm c/c`,
      shapeCode: '37',
      dia: mainDia,
      count: countX,
      dimA: dimAx,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resBotX.rawLengthMm,
      calculatedCutLength: resBotX.cutLengthMm,
      unitWeight: wtBotX,
      totalLengthM: Number(totBotX.toFixed(2)),
      totalWeightKg: Number((totBotX * wtBotX).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Double Jali bottom layer tension reinforcement',
    });

    // 2. Bottom Mat Y
    const dimAy = ly + 2 * (supWidthY - cover);
    const countY = Math.ceil(Math.max(lx - 2 * cover, 100) / distSpacing) + 1;
    const resBotY = calculateRebarShape({ shapeCode: '37', dia: distDia, dimA: dimAy, dimB: bendUpHeight, steelGrade: grade });
    const totBotY = (resBotY.cutLengthMm * countY) / 1000;
    const wtBotY = getUnitWeight(distDia);

    items.push({
      barMark: `${input.memberTag}-B2-Y`,
      description: `${input.memberTag} Bottom Mat along Long Span (${dimAy}mm) @ ${distSpacing}mm c/c`,
      shapeCode: '37',
      dia: distDia,
      count: countY,
      dimA: dimAy,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resBotY.rawLengthMm,
      calculatedCutLength: resBotY.cutLengthMm,
      unitWeight: wtBotY,
      totalLengthM: Number(totBotY.toFixed(2)),
      totalWeightKg: Number((totBotY * wtBotY).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Double Jali bottom transverse reinforcement',
    });

    // 3. Top Mat X
    const topDiaX = input.topMeshDiaX || mainDia;
    const topSpX = input.topMeshSpacingX || mainSpacing;
    const countTopX = Math.ceil(Math.max(ly - 2 * cover, 100) / topSpX) + 1;
    const resTopX = calculateRebarShape({ shapeCode: '37', dia: topDiaX, dimA: dimAx, dimB: bendUpHeight, steelGrade: grade });
    const totTopX = (resTopX.cutLengthMm * countTopX) / 1000;
    const wtTopX = getUnitWeight(topDiaX);

    items.push({
      barMark: `${input.memberTag}-T1-X`,
      description: `${input.memberTag} Top Mat along Short Span (${dimAx}mm) @ ${topSpX}mm c/c`,
      shapeCode: '37',
      dia: topDiaX,
      count: countTopX,
      dimA: dimAx,
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
      remarks: 'Double Jali top mesh reinforcement for moment reversal & crack control',
    });

    // 4. Top Mat Y
    const topDiaY = input.topMeshDiaY || distDia;
    const topSpY = input.topMeshSpacingY || distSpacing;
    const countTopY = Math.ceil(Math.max(lx - 2 * cover, 100) / topSpY) + 1;
    const resTopY = calculateRebarShape({ shapeCode: '37', dia: topDiaY, dimA: dimAy, dimB: bendUpHeight, steelGrade: grade });
    const totTopY = (resTopY.cutLengthMm * countTopY) / 1000;
    const wtTopY = getUnitWeight(topDiaY);

    items.push({
      barMark: `${input.memberTag}-T2-Y`,
      description: `${input.memberTag} Top Mat along Long Span (${dimAy}mm) @ ${topSpY}mm c/c`,
      shapeCode: '37',
      dia: topDiaY,
      count: countTopY,
      dimA: dimAy,
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
      remarks: 'Double Jali top transverse reinforcement',
    });

    // 5. 3D Spacer Chairs (MANDATORY for Double Jali to support top cage)
    const areaM2 = (lx * ly) / 1000000;
    const chairCount = input.chairCount || Math.max(Math.ceil(areaM2 * 1.0), 4);
    const chairDia = input.chairDia || 10;
    const chairHeight = Math.max(input.thickness - 2 * cover - mainDia - topDiaX - 10, 60);

    const resChair = calculateRebarShape({
      shapeCode: 'CHAIR',
      dia: chairDia,
      dimA: 250, // head
      dimB: chairHeight, // height
      dimC: 150, // foot
      steelGrade: grade,
    });
    const totChair = (resChair.cutLengthMm * chairCount) / 1000;
    const wtChair = getUnitWeight(chairDia);

    items.push({
      barMark: `${input.memberTag}-CH1`,
      description: `${input.memberTag} 3D Spacer Chairs (${chairCount} Nos Ø${chairDia}mm @ 1.0m grid, Height ${chairHeight}mm)`,
      shapeCode: 'CHAIR',
      dia: chairDia,
      count: chairCount,
      dimA: 250,
      dimB: chairHeight,
      dimC: 150,
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
      remarks: 'IS 2502 3D spacer chair to hold top mesh in Double Jali',
    });

    return items;
  }

  // -------------------------------------------------------------
  // 3. ONE-WAY SLAB (MAIN REBAR + TRANSVERSE DISTRIBUTION)
  // -------------------------------------------------------------
  if (type === 'ONE_WAY') {
    const dimAx = lx + 2 * (supWidthX - cover);
    const totalMainCount = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;

    // Bottom Main Tension Bars
    const resMain = calculateRebarShape({ shapeCode: '37', dia: mainDia, dimA: dimAx, dimB: bendUpHeight, steelGrade: grade });
    const totMain = (resMain.cutLengthMm * totalMainCount) / 1000;
    const wtMain = getUnitWeight(mainDia);

    items.push({
      barMark: `${input.memberTag}-B1`,
      description: `${input.memberTag} One-Way Bottom Main Tension Bars (${dimAx}mm span) @ ${mainSpacing}mm c/c`,
      shapeCode: '37',
      dia: mainDia,
      count: totalMainCount,
      dimA: dimAx,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resMain.rawLengthMm,
      calculatedCutLength: resMain.cutLengthMm,
      unitWeight: wtMain,
      totalLengthM: Number(totMain.toFixed(2)),
      totalWeightKg: Number((totMain * wtMain).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Primary flexural steel along short span',
    });

    // Distribution Bars along Ly
    const dimAy = ly + 2 * (supWidthY - cover);
    const countDist = Math.ceil(Math.max(lx - 2 * cover, 100) / distSpacing) + 1;
    const resDist = calculateRebarShape({ shapeCode: '20', dia: distDia, dimA: dimAy, steelGrade: grade });
    const totDist = (resDist.cutLengthMm * countDist) / 1000;
    const wtDist = getUnitWeight(distDia);

    items.push({
      barMark: `${input.memberTag}-D1`,
      description: `${input.memberTag} One-Way Distribution Bars (${dimAy}mm span) @ ${distSpacing}mm c/c`,
      shapeCode: '20',
      dia: distDia,
      count: countDist,
      dimA: dimAy,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resDist.rawLengthMm,
      calculatedCutLength: resDist.cutLengthMm,
      unitWeight: wtDist,
      totalLengthM: Number(totDist.toFixed(2)),
      totalWeightKg: Number((totDist * wtDist).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Cl. 26.5.2.1 distribution steel for shrinkage and temperature (No chairs)',
    });

    // Top Extra at Supports (if requested)
    if (input.hasTopExtraAtSupports) {
      const topExtraDia = input.topExtraDia || mainDia;
      const topExtraSp = input.topExtraSpacing || mainSpacing;
      const topExtraLen = Math.round(0.25 * lx + (supWidthX - cover));
      const countTop = Math.ceil(Math.max(ly - 2 * cover, 100) / topExtraSp) + 1;

      const resTop = calculateRebarShape({ shapeCode: '21', dia: topExtraDia, dimA: topExtraLen, dimB: bendUpHeight, steelGrade: grade });
      const totTop = (resTop.cutLengthMm * 2 * countTop) / 1000;
      const wtTop = getUnitWeight(topExtraDia);

      items.push({
        barMark: `${input.memberTag}-T1-SUP`,
        description: `${input.memberTag} Top Extra Bars at Supports (${2 * countTop} Nos: Left & Right, ${topExtraLen}mm) @ ${topExtraSp}mm c/c`,
        shapeCode: '21',
        dia: topExtraDia,
        count: 2 * countTop,
        dimA: topExtraLen,
        dimB: bendUpHeight,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resTop.rawLengthMm,
        calculatedCutLength: resTop.cutLengthMm,
        unitWeight: wtTop,
        totalLengthM: Number(totTop.toFixed(2)),
        totalWeightKg: Number((totTop * wtTop).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'Negative moment support steel (0.25Lx curtailment)',
      });
    }

    return items;
  }

  // -------------------------------------------------------------
  // 4. TWO-WAY SLAB (IS 456 Cl. D-1 Restrained or Unrestrained)
  // -------------------------------------------------------------
  const dimAx = lx + 2 * (supWidthX - cover);
  const totalMainCount = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;

  if (input.useAlternateCrank) {
    const halfCount = Math.ceil(totalMainCount / 2);
    const otherHalf = totalMainCount - halfCount;

    // Straight Bars (50% of bars)
    const resStraight = calculateRebarShape({ shapeCode: '37', dia: mainDia, dimA: dimAx, dimB: bendUpHeight, steelGrade: grade });
    const totStr = (resStraight.cutLengthMm * halfCount) / 1000;
    const wtStr = getUnitWeight(mainDia);

    items.push({
      barMark: `${input.memberTag}-B1a-STR`,
      description: `${input.memberTag} Short-Span Bottom Straight Bars (${halfCount} Nos) @ 2x${mainSpacing}mm c/c`,
      shapeCode: '37',
      dia: mainDia,
      count: halfCount,
      dimA: dimAx,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resStraight.rawLengthMm,
      calculatedCutLength: resStraight.cutLengthMm,
      unitWeight: wtStr,
      totalLengthM: Number(totStr.toFixed(2)),
      totalWeightKg: Number((totStr * wtStr).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: '50% bottom straight bars in alternate crank system',
    });

    // 45° Cranked Bars (50% of bars bent up at 0.15Lx)
    const crankRise = Math.max(input.thickness - 2 * cover - mainDia, 50);
    const resCrank = calculateRebarShape({ shapeCode: '41', dia: mainDia, dimA: dimAx, dimB: crankRise, steelGrade: grade });
    const totCrk = (resCrank.cutLengthMm * otherHalf) / 1000;

    items.push({
      barMark: `${input.memberTag}-B1b-CRK`,
      description: `${input.memberTag} Short-Span 45° Cranked Bars (${otherHalf} Nos, Rise ${crankRise}mm) @ 2x${mainSpacing}mm c/c`,
      shapeCode: '41',
      dia: mainDia,
      count: otherHalf,
      dimA: dimAx,
      dimB: crankRise,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCrank.rawLengthMm,
      calculatedCutLength: resCrank.cutLengthMm,
      unitWeight: wtStr,
      totalLengthM: Number(totCrk.toFixed(2)),
      totalWeightKg: Number((totCrk * wtStr).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Cl. 26.5.1.1 45° crank bent up at 0.15Lx from face of support',
    });
  } else {
    // 100% Straight bars
    const resMain = calculateRebarShape({ shapeCode: '37', dia: mainDia, dimA: dimAx, dimB: bendUpHeight, steelGrade: grade });
    const totMain = (resMain.cutLengthMm * totalMainCount) / 1000;
    const wtMain = getUnitWeight(mainDia);

    items.push({
      barMark: `${input.memberTag}-B1`,
      description: `${input.memberTag} Short-Span Bottom Main Rebar (${dimAx}mm span) @ ${mainSpacing}mm c/c`,
      shapeCode: '37',
      dia: mainDia,
      count: totalMainCount,
      dimA: dimAx,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resMain.rawLengthMm,
      calculatedCutLength: resMain.cutLengthMm,
      unitWeight: wtMain,
      totalLengthM: Number(totMain.toFixed(2)),
      totalWeightKg: Number((totMain * wtMain).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Short-span positive moment reinforcement',
    });
  }

  // Long-Span Reinforcement (Ly)
  const dimAy = ly + 2 * (supWidthY - cover);
  const countLong = Math.ceil(Math.max(lx - 2 * cover, 100) / distSpacing) + 1;
  const resLong = calculateRebarShape({ shapeCode: '37', dia: distDia, dimA: dimAy, dimB: bendUpHeight, steelGrade: grade });
  const totLong = (resLong.cutLengthMm * countLong) / 1000;
  const wtLong = getUnitWeight(distDia);

  items.push({
    barMark: `${input.memberTag}-B2-LONG`,
    description: `${input.memberTag} Long-Span Rebar (${dimAy}mm span) @ ${distSpacing}mm c/c`,
    shapeCode: '37',
    dia: distDia,
    count: countLong,
    dimA: dimAy,
    dimB: bendUpHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resLong.rawLengthMm,
    calculatedCutLength: resLong.cutLengthMm,
    unitWeight: wtLong,
    totalLengthM: Number(totLong.toFixed(2)),
    totalWeightKg: Number((totLong * wtLong).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Long-span bottom reinforcement',
  });

  // Top Negative Moment Bars at Supports (if not using cranked or if explicitly enabled)
  if (input.hasTopExtraAtSupports || !input.useAlternateCrank) {
    const topExtraDia = input.topExtraDia || mainDia;
    const topExtraSp = input.topExtraSpacing || mainSpacing;
    const topExtraLen = Math.round(0.30 * lx + (supWidthX - cover));
    const countTop = Math.ceil(Math.max(ly - 2 * cover, 100) / topExtraSp) + 1;

    const resTop = calculateRebarShape({ shapeCode: '21', dia: topExtraDia, dimA: topExtraLen, dimB: bendUpHeight, steelGrade: grade });
    const totTop = (resTop.cutLengthMm * 2 * countTop) / 1000;
    const wtTop = getUnitWeight(topExtraDia);

    items.push({
      barMark: `${input.memberTag}-T1-EXTRA`,
      description: `${input.memberTag} Top Support Negative Moment Rebar (${2 * countTop} Nos, Curtailment 0.30Lx) @ ${topExtraSp}mm c/c`,
      shapeCode: '21',
      dia: topExtraDia,
      count: 2 * countTop,
      dimA: topExtraLen,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTop.rawLengthMm,
      calculatedCutLength: resTop.cutLengthMm,
      unitWeight: wtTop,
      totalLengthM: Number(totTop.toFixed(2)),
      totalWeightKg: Number((totTop * wtTop).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Negative moment support steel (0.30Lx curtailment)',
    });
  }

  return items;
}
