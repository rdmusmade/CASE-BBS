import { calculateRebarShape, getDevelopmentLength, getBendAllowance90, getStirrupHookTail, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface ContinuousSpanConfig {
  spanIndex: number;
  spanLength: number; // mm clear span
  width?: number; // mm
  depth?: number; // mm
  topMainDia?: number; // mm
  topMainCount?: number;
  bottomMainDia?: number; // mm
  bottomMainCount?: number;
  stirrupSpacingSupport?: number; // mm
  stirrupSpacingMid?: number; // mm
  endType?: 'SUPPORTED' | 'CANTILEVER';
}

export interface BeamInput {
  memberTag: string; // e.g. "BM-01", "CANT-BM-01", "CONT-BM-01"
  beamType?: 'SIMPLY_SUPPORTED' | 'CANTILEVER' | 'CONTINUOUS';
  subType?: string;
  clearSpan: number; // mm (Span 1 or Main Span L1)
  width: number; // mm (b)
  depth: number; // mm (D)
  supportWidthLeft?: number; // mm (default 300mm)
  supportWidthRight?: number; // mm (default 300mm)
  clearCover?: number; // mm (default 25mm per IS 456)

  // Continuous Multi-Span dynamic list
  spans?: ContinuousSpanConfig[];
  span2Length?: number; // mm
  span3Length?: number; // mm
  intermediateSupportWidth?: number; // mm

  // Cantilever specific
  cantileverLengthRight?: number; // mm

  // Top Reinforcement (Layer 1 + Mixed Layer 2)
  topMainDia?: number; // mm
  topMainCount?: number;
  topMainDia2?: number; // mm (Layer 2 mixed diameter)
  topMainCount2?: number;
  topExtraLeftDia?: number; // mm
  topExtraLeftCount?: number;
  topExtraRightDia?: number; // mm
  topExtraRightCount?: number;
  topExtraMidSupportDia?: number; // mm
  topExtraMidSupportCount?: number;

  // Bottom Reinforcement (Layer 1 + Mixed Layer 2)
  bottomMainDia?: number; // mm
  bottomMainCount?: number;
  bottomMainDia2?: number; // mm (Layer 2 mixed diameter)
  bottomMainCount2?: number;
  bottomExtraMidDia?: number; // mm
  bottomExtraMidCount?: number;

  // Cranked Bars (Bent-up bars at 45°)
  hasCrankedBars?: boolean;
  crankedBarDia?: number;
  crankedBarCount?: number;

  // Side-Face Reinforcement (Mandatory if depth > 750mm per IS 456 Cl. 26.5.1.6)
  includeSideFace?: boolean;
  sideFaceDia?: number;
  sideFaceCountEachFace?: number;

  // Stirrups / Shear Links
  stirrupDia?: number; // mm
  stirrupSpacingSupport?: number; // mm c/c (2D confinement zone)
  stirrupSpacingMid?: number; // mm c/c (Mid-span zone)
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

  // Exactly 3 primary beam types per user requirement
  let type: 'SIMPLY_SUPPORTED' | 'CANTILEVER' | 'CONTINUOUS' = 'SIMPLY_SUPPORTED';
  const rawType = (input.beamType || input.subType || 'SIMPLY_SUPPORTED').toUpperCase();
  if (rawType.includes('CANTILEVER') && !rawType.includes('CONTINUOUS')) {
    type = 'CANTILEVER';
  } else if (rawType.includes('CONT')) {
    type = 'CONTINUOUS';
  }

  const topDia = input.topMainDia || 16;
  const topCount = input.topMainCount || 2;
  const topDia2 = input.topMainDia2 || 0;
  const topCount2 = input.topMainCount2 || 0;

  const botDia = input.bottomMainDia || 20;
  const botCount = input.bottomMainCount || 3;
  const botDia2 = input.bottomMainDia2 || 0;
  const botCount2 = input.bottomMainCount2 || 0;

  const stirrupDia = input.stirrupDia || 8;
  const stirrupSpacingSup = input.stirrupSpacingSupport || 100;
  const stirrupSpacingMid = input.stirrupSpacingMid || 175;

  const supLeft = input.supportWidthLeft ?? 300;
  const supRight = input.supportWidthRight ?? 300;
  const Ld = getDevelopmentLength(botDia, concrete, grade);
  const anchorBendDown = Math.max(input.depth - 2 * cover, 150);

  // -------------------------------------------------------------
  // 1. CANTILEVER BEAM SPECIFIC DETAILING
  // -------------------------------------------------------------
  if (type === 'CANTILEVER') {
    const cantSpan = input.clearSpan;
    // IS 456: Cantilever top tension steel must be anchored into fixed support for Ld,
    // plus run full cantilever span, plus 90° bend down at free tip
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
      barMark: `${input.memberTag}-T1`,
      description: `${input.memberTag} Cantilever Top Main Tension Bars (${topCount} Nos Ø${topDia}mm: Span ${cantSpan}mm + Ld ${Ld}mm Support Anchor)`,
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
      remarks: `IS 456 Cl. 26.2.1 Cantilever top tension steel anchored ${Ld}mm into fixed support column/wall`,
    });

    // Secondary top mixed bars (if any)
    if (topCount2 > 0 && topDia2 > 0) {
      const resCantTop2 = calculateRebarShape({
        shapeCode: '21',
        dia: topDia2,
        dimA: cantTopDimA,
        dimB: anchorBendDown,
        steelGrade: grade,
      });
      const totCantTop2 = (resCantTop2.cutLengthMm * topCount2) / 1000;
      const wtCantTop2 = getUnitWeight(topDia2);
      items.push({
        barMark: `${input.memberTag}-T1b`,
        description: `${input.memberTag} Cantilever Top Secondary Mixed Bars (${topCount2} Nos Ø${topDia2}mm)`,
        shapeCode: '21',
        dia: topDia2,
        count: topCount2,
        dimA: cantTopDimA,
        dimB: anchorBendDown,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resCantTop2.rawLengthMm,
        calculatedCutLength: resCantTop2.cutLengthMm,
        unitWeight: wtCantTop2,
        totalLengthM: Number(totCantTop2.toFixed(2)),
        totalWeightKg: Number((totCantTop2 * wtCantTop2).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'Cantilever top secondary layer mixed rebar',
      });
    }

    // Bottom compression nominal bars anchored into fixed support
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
      barMark: `${input.memberTag}-B1`,
      description: `${input.memberTag} Cantilever Bottom Nominal / Compression Bars (${botCount} Nos Ø${botDia}mm)`,
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
      barMark: `${input.memberTag}-ST`,
      description: `${input.memberTag} Cantilever 135° Seismic Stirrups (Ø${stirrupDia}mm @ ${stirrupSpacingSup}mm c/c)`,
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
  // 2. CONTINUOUS MULTI-SPAN BEAM DETAILING
  // -------------------------------------------------------------
  if (type === 'CONTINUOUS') {
    // Collect all spans
    const spansList: ContinuousSpanConfig[] = input.spans && input.spans.length > 0
      ? input.spans
      : [
          { spanIndex: 1, spanLength: input.clearSpan, topMainDia: topDia, topMainCount: topCount, bottomMainDia: botDia, bottomMainCount: botCount },
          ...(input.span2Length ? [{ spanIndex: 2, spanLength: input.span2Length, topMainDia: topDia, topMainCount: topCount, bottomMainDia: botDia, bottomMainCount: botCount }] : []),
          ...(input.span3Length ? [{ spanIndex: 3, spanLength: input.span3Length, topMainDia: topDia, topMainCount: topCount, bottomMainDia: botDia, bottomMainCount: botCount }] : []),
        ];

    const intSup = input.intermediateSupportWidth || 300;
    const totalClearLength = spansList.reduce((acc, s) => acc + s.spanLength, 0) + (spansList.length - 1) * intSup;
    const contTotalLen = totalClearLength + (supLeft - cover) + (supRight - cover);

    // Continuous Top Through Bars (Shape 37)
    const resTopCont = calculateRebarShape({
      shapeCode: '37',
      dia: topDia,
      dimA: contTotalLen,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totTopCont = (resTopCont.cutLengthMm * topCount) / 1000;
    const wtTopCont = getUnitWeight(topDia);

    items.push({
      barMark: `${input.memberTag}-T1`,
      description: `${input.memberTag} Continuous Top Main Through Bars (${topCount} Nos Ø${topDia}mm across ${spansList.length} Spans)`,
      shapeCode: '37',
      dia: topDia,
      count: topCount,
      dimA: contTotalLen,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopCont.rawLengthMm,
      calculatedCutLength: resTopCont.cutLengthMm,
      unitWeight: wtTopCont,
      totalLengthM: Number(totTopCont.toFixed(2)),
      totalWeightKg: Number((totTopCont * wtTopCont).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: `Continuous through rebar spanning ${spansList.length} spans with 90° anchors into end supports`,
    });

    // Intermediate Support Hogging Negative Moment Rebar (Over supports, 0.30L1 + intSup + 0.30L2)
    for (let i = 0; i < spansList.length - 1; i++) {
      const sLeft = spansList[i].spanLength;
      const sRight = spansList[i + 1].spanLength;
      const extraLen = Math.round(0.30 * sLeft + intSup + 0.30 * sRight);
      const hogCount = input.topExtraMidSupportCount || 3;
      const hogDia = input.topExtraMidSupportDia || topDia;

      const resHog = calculateRebarShape({ shapeCode: '20', dia: hogDia, dimA: extraLen, steelGrade: grade });
      const totHog = (resHog.cutLengthMm * hogCount) / 1000;
      const wtHog = getUnitWeight(hogDia);

      items.push({
        barMark: `${input.memberTag}-T-SUP${i + 1}`,
        description: `${input.memberTag} Top Extra Hogging Rebar at Intermediate Support ${i + 1} (${hogCount} Nos Ø${hogDia}mm, ${extraLen}mm)`,
        shapeCode: '20',
        dia: hogDia,
        count: hogCount,
        dimA: extraLen,
        dimB: 0,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resHog.rawLengthMm,
        calculatedCutLength: resHog.cutLengthMm,
        unitWeight: wtHog,
        totalLengthM: Number(totHog.toFixed(2)),
        totalWeightKg: Number((totHog * wtHog).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'SP 34 Cl. 8.2 Top negative moment rebar curtailment at intermediate support',
      });
    }

    // Bottom Rebar & Stirrups per Span
    spansList.forEach((sp, idx) => {
      const sNum = idx + 1;
      const bDia = sp.bottomMainDia || botDia;
      const bCnt = sp.bottomMainCount || botCount;
      const isEndSpan = idx === 0 || idx === spansList.length - 1;
      const botSpanA = sp.spanLength + (isEndSpan ? (supLeft - cover) : intSup);

      const resBot = calculateRebarShape({
        shapeCode: isEndSpan ? '37' : '20',
        dia: bDia,
        dimA: botSpanA,
        dimB: isEndSpan ? anchorBendDown : 0,
        steelGrade: grade,
      });
      const totBot = (resBot.cutLengthMm * bCnt) / 1000;
      const wtBot = getUnitWeight(bDia);

      items.push({
        barMark: `${input.memberTag}-SP${sNum}-B1`,
        description: `${input.memberTag} Span ${sNum} Bottom Tension Bars (${bCnt} Nos Ø${bDia}mm, span ${sp.spanLength}mm)`,
        shapeCode: isEndSpan ? '37' : '20',
        dia: bDia,
        count: bCnt,
        dimA: botSpanA,
        dimB: isEndSpan ? anchorBendDown : 0,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resBot.rawLengthMm,
        calculatedCutLength: resBot.cutLengthMm,
        unitWeight: wtBot,
        totalLengthM: Number(totBot.toFixed(2)),
        totalWeightKg: Number((totBot * wtBot).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: `Positive moment rebar for continuous span ${sNum}`,
      });

      // Stirrups for this span
      const sWidth = sp.width || input.width;
      const sDepth = sp.depth || input.depth;
      const sA = sWidth - 2 * cover;
      const sB = sDepth - 2 * cover;
      const spSup = sp.stirrupSpacingSupport || stirrupSpacingSup;
      const spMid = sp.stirrupSpacingMid || stirrupSpacingMid;

      const confLen = 2 * sDepth;
      const midLen = Math.max(sp.spanLength - 2 * confLen, 0);
      const confCount = Math.ceil(confLen / spSup) * 2;
      const midCount = Math.ceil(midLen / spMid);
      const totalStirrups = confCount + midCount;

      const resStirrup = calculateRebarShape({ shapeCode: '51', dia: stirrupDia, dimA: sA, dimB: sB, steelGrade: grade });
      const totStirrup = (resStirrup.cutLengthMm * totalStirrups) / 1000;
      const wtStirrup = getUnitWeight(stirrupDia);

      items.push({
        barMark: `${input.memberTag}-SP${sNum}-ST`,
        description: `${input.memberTag} Span ${sNum} 135° Seismic Stirrups (${totalStirrups} Nos: ${confCount} @ ${spSup}mm ends, ${midCount} @ ${spMid}mm mid)`,
        shapeCode: '51',
        dia: stirrupDia,
        count: totalStirrups,
        dimA: sA,
        dimB: sB,
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
        remarks: `IS 13920 135° seismic links for span ${sNum}`,
      });
    });

    return items;
  }

  // -------------------------------------------------------------
  // 3. SIMPLY SUPPORTED BEAM DETAILING
  // -------------------------------------------------------------

  // Top Main Longitudinal Bars
  const topMainDimA = input.clearSpan + (supLeft - cover) + (supRight - cover);
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
    barMark: `${input.memberTag}-T1`,
    description: `${input.memberTag} Top Main Hanger / Through Bars (${topCount} Nos Ø${topDia}mm)`,
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
  if (topCount2 > 0 && topDia2 > 0) {
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
      barMark: `${input.memberTag}-T1b`,
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
      remarks: 'Top secondary layer mixed diameter bars',
    });
  }

  // Bottom Main Longitudinal Bars
  const botMainDimA = input.clearSpan + (supLeft - cover) + (supRight - cover);
  const resBotMain = calculateRebarShape({
    shapeCode: '37',
    dia: botDia,
    dimA: botMainDimA,
    dimB: anchorBendDown,
    steelGrade: grade,
  });
  const totBotMain = (resBotMain.cutLengthMm * botCount) / 1000;
  const wtBotMain = getUnitWeight(botDia);

  items.push({
    barMark: `${input.memberTag}-B1`,
    description: `${input.memberTag} Bottom Main Tension Bars (${botCount} Nos Ø${botDia}mm)`,
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
    remarks: `IS 2502 Shape 37, 90° bend up ${anchorBendDown}mm at supports`,
  });

  // Bottom Secondary Layer (Layer 2 Mixed Bars)
  if (botCount2 > 0 && botDia2 > 0) {
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
      barMark: `${input.memberTag}-B1b`,
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
      remarks: 'Bottom secondary layer mixed diameter tension bars',
    });
  }

  // Bottom Extra Bars at Mid-Span (Curtailment 0.70L per SP 34)
  if (input.bottomExtraMidCount && input.bottomExtraMidCount > 0) {
    const bExtraDia = input.bottomExtraMidDia || botDia;
    const bExtraCount = input.bottomExtraMidCount;
    const bExtraLen = Math.round(0.70 * input.clearSpan);
    const resBExtra = calculateRebarShape({
      shapeCode: '20', // Straight bar
      dia: bExtraDia,
      dimA: bExtraLen,
      steelGrade: grade,
    });
    const totBExtra = (resBExtra.cutLengthMm * bExtraCount) / 1000;
    const wtBExtra = getUnitWeight(bExtraDia);
    items.push({
      barMark: `${input.memberTag}-B2-MID`,
      description: `${input.memberTag} Bottom Extra Bars at Mid-Span (${bExtraCount} Nos Ø${bExtraDia}mm, Curtailment 0.70L)`,
      shapeCode: '20',
      dia: bExtraDia,
      count: bExtraCount,
      dimA: bExtraLen,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resBExtra.rawLengthMm,
      calculatedCutLength: resBExtra.cutLengthMm,
      unitWeight: wtBExtra,
      totalLengthM: Number(totBExtra.toFixed(2)),
      totalWeightKg: Number((totBExtra * wtBExtra).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'SP 34 Cl. 8.1 Positive moment curtailment bar at mid-span',
    });
  }

  // Bent-Up / Cranked Bars (45° Crank per IS 456 Cl. 26.5.1.1)
  if (input.hasCrankedBars && input.crankedBarCount && input.crankedBarCount > 0) {
    const cDia = input.crankedBarDia || botDia;
    const cCount = input.crankedBarCount;
    const crankRise = Math.max(input.depth - 2 * cover - cDia, 100);
    const resCrank = calculateRebarShape({
      shapeCode: '41',
      dia: cDia,
      dimA: botMainDimA,
      dimB: crankRise,
      steelGrade: grade,
    });
    const totCrank = (resCrank.cutLengthMm * cCount) / 1000;
    const wtCrank = getUnitWeight(cDia);
    items.push({
      barMark: `${input.memberTag}-CR1`,
      description: `${input.memberTag} Bent-up / Cranked Bars (45° Crank, Rise ${crankRise}mm, ${cCount} Nos Ø${cDia}mm)`,
      shapeCode: '41',
      dia: cDia,
      count: cCount,
      dimA: botMainDimA,
      dimB: crankRise,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCrank.rawLengthMm,
      calculatedCutLength: resCrank.cutLengthMm,
      unitWeight: wtCrank,
      totalLengthM: Number(totCrank.toFixed(2)),
      totalWeightKg: Number((totCrank * wtCrank).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Cl. 26.5.1.1 45° cranked shear rebar',
    });
  }

  // Top Extra Bars at Support (Curtailment 0.30L per SP 34)
  const topExtraDia = input.topExtraLeftDia || topDia;
  const topExtraCountL = input.topExtraLeftCount || 0;
  const topExtraCountR = input.topExtraRightCount || 0;
  const topExtraLen = Math.round(0.30 * input.clearSpan + (supLeft - cover));

  if (topExtraCountL > 0) {
    const resTopExtraL = calculateRebarShape({
      shapeCode: '21',
      dia: topExtraDia,
      dimA: topExtraLen,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totL = (resTopExtraL.cutLengthMm * topExtraCountL) / 1000;
    const wtL = getUnitWeight(topExtraDia);
    items.push({
      barMark: `${input.memberTag}-T2-L`,
      description: `${input.memberTag} Top Extra Bars at Left Support (Curtailment 0.30L, ${topExtraCountL} Nos Ø${topExtraDia}mm)`,
      shapeCode: '21',
      dia: topExtraDia,
      count: topExtraCountL,
      dimA: topExtraLen,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopExtraL.rawLengthMm,
      calculatedCutLength: resTopExtraL.cutLengthMm,
      unitWeight: wtL,
      totalLengthM: Number(totL.toFixed(2)),
      totalWeightKg: Number((totL * wtL).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Negative moment support top reinforcement',
    });
  }

  if (topExtraCountR > 0) {
    const resTopExtraR = calculateRebarShape({
      shapeCode: '21',
      dia: topExtraDia,
      dimA: topExtraLen,
      dimB: anchorBendDown,
      steelGrade: grade,
    });
    const totR = (resTopExtraR.cutLengthMm * topExtraCountR) / 1000;
    const wtR = getUnitWeight(topExtraDia);
    items.push({
      barMark: `${input.memberTag}-T2-R`,
      description: `${input.memberTag} Top Extra Bars at Right Support (Curtailment 0.30L, ${topExtraCountR} Nos Ø${topExtraDia}mm)`,
      shapeCode: '21',
      dia: topExtraDia,
      count: topExtraCountR,
      dimA: topExtraLen,
      dimB: anchorBendDown,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopExtraR.rawLengthMm,
      calculatedCutLength: resTopExtraR.cutLengthMm,
      unitWeight: wtR,
      totalLengthM: Number(totR.toFixed(2)),
      totalWeightKg: Number((totR * wtR).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'Negative moment support top reinforcement',
    });
  }

  // Side-Face Reinforcement (Mandatory if D > 750mm per IS 456 Cl. 26.5.1.6)
  if (input.depth > 750 || input.includeSideFace) {
    const sfDia = input.sideFaceDia || 12;
    const sfCountEach = input.sideFaceCountEachFace || Math.max(Math.floor((input.depth - 750) / 300) + 1, 1);
    const sfTotalCount = sfCountEach * 2;
    const sfDimA = topMainDimA;
    const resSF = calculateRebarShape({
      shapeCode: '20',
      dia: sfDia,
      dimA: sfDimA,
      steelGrade: grade,
    });
    const totSF = (resSF.cutLengthMm * sfTotalCount) / 1000;
    const wtSF = getUnitWeight(sfDia);
    items.push({
      barMark: `${input.memberTag}-SF1`,
      description: `${input.memberTag} Side-Face Rebar (IS 456 D>750mm: ${sfCountEach}+${sfCountEach} bars on 2 faces, Ø${sfDia}mm)`,
      shapeCode: '20',
      dia: sfDia,
      count: sfTotalCount,
      dimA: sfDimA,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resSF.rawLengthMm,
      calculatedCutLength: resSF.cutLengthMm,
      unitWeight: wtSF,
      totalLengthM: Number(totSF.toFixed(2)),
      totalWeightKg: Number((totSF * wtSF).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Cl. 26.5.1.6 side-face rebar against lateral torsional buckling',
    });
  }

  // Stirrups: Outer Rectangular Closed Link (Shape 51)
  const stirrupA = input.width - 2 * cover;
  const stirrupB = input.depth - 2 * cover;

  // Support Confinement Zone (2D at each support)
  const confZoneLen = isSeismic ? 2 * input.depth : 1.5 * input.depth;
  const numStirrupsSupZone = Math.ceil(confZoneLen / stirrupSpacingSup);
  const midZoneLen = Math.max(input.clearSpan - 2 * confZoneLen, 0);
  const numStirrupsMidZone = Math.ceil(midZoneLen / stirrupSpacingMid);
  const totalStirrups = 2 * numStirrupsSupZone + numStirrupsMidZone;

  const resStirrup = calculateRebarShape({
    shapeCode: '51',
    dia: stirrupDia,
    dimA: stirrupA,
    dimB: stirrupB,
    steelGrade: grade,
  });
  const totStirrup = (resStirrup.cutLengthMm * totalStirrups) / 1000;
  const wtStirrup = getUnitWeight(stirrupDia);

  items.push({
    barMark: `${input.memberTag}-ST1`,
    description: `${input.memberTag} 135° Seismic Stirrups (${2 * numStirrupsSupZone} @ ${stirrupSpacingSup}mm ends, ${numStirrupsMidZone} @ ${stirrupSpacingMid}mm mid, Ø${stirrupDia}mm)`,
    shapeCode: '51',
    dia: stirrupDia,
    count: totalStirrups,
    dimA: stirrupA,
    dimB: stirrupB,
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
    remarks: `IS 13920 Cl. 6.3 135° seismic closed link with hook tail ≥ ${getStirrupHookTail(stirrupDia)}mm`,
  });

  // 4-Leg Stirrup Inner Tie (if 4_LEG selected)
  if (input.stirrupType === '4_LEG') {
    const innerA = Math.round(stirrupA / 2);
    const resInnerTie = calculateRebarShape({
      shapeCode: '51',
      dia: stirrupDia,
      dimA: innerA,
      dimB: stirrupB,
      steelGrade: grade,
    });
    const totInner = (resInnerTie.cutLengthMm * totalStirrups) / 1000;

    items.push({
      barMark: `${input.memberTag}-ST2-INNER`,
      description: `${input.memberTag} Inner 2-Leg Stirrup (4-Leg Shear System: ${innerA}x${stirrupB}mm, Ø${stirrupDia}mm)`,
      shapeCode: '51',
      dia: stirrupDia,
      count: totalStirrups,
      dimA: innerA,
      dimB: stirrupB,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resInnerTie.rawLengthMm,
      calculatedCutLength: resInnerTie.cutLengthMm,
      unitWeight: wtStirrup,
      totalLengthM: Number(totInner.toFixed(2)),
      totalWeightKg: Number((totInner * wtStirrup).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 13920 Cl. 6.3.2 inner closed hoop for 4-leg shear reinforcement',
    });
  }

  return items;
}
