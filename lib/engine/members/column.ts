import { calculateRebarShape, getDevelopmentLength, getStirrupHookTail, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface ColumnInput {
  memberTag: string; // e.g. "COL-01", "C2-GFL", "CIRC-C3", "PED-1"
  columnShape?: 'RECTANGULAR' | 'CIRCULAR' | 'L_SHAPED' | 'T_SHAPED';
  subType?: string;
  width?: number; // mm (b) or Diameter for circular
  depth?: number; // mm (D)
  clearHeight?: number; // mm (floor to ceiling)
  floorHeight?: number; // mm
  footingDepth?: number; // mm
  floorThickness?: number; // mm
  clearCover?: number; // mm (default 40mm per IS 456)

  // Longitudinal Bars (Uniform or Mixed Corner & Face Bars)
  mainBarDia?: number; // mm
  mainBarCount?: number;
  cornerDia?: number; // mm (Corner Bars Diameter)
  cornerCount?: number; // default 4
  sideDia?: number; // mm (Side/Face Bars Diameter)
  sideCount?: number; // count of side bars

  isStarterBar?: boolean;
  footingLAnchor?: number; // mm (min 300mm per IS 456)
  lapLengthType?: 'STANDARD_LD' | 'STAGGERED_1_3LD' | 'COMPRESSION_30D';

  // Lateral Ties / Links
  tieDia?: number; // mm
  tieSpacingNormal?: number; // mm c/c (e.g. 150mm)
  tieSpacingConfined?: number; // mm c/c (e.g. 100mm for IS 13920 end zone)
  tieSpacingMid?: number; // mm
  tieSpacingEnd?: number; // mm
  tieType?: 'RECT_2_LEG' | 'RECT_4_LEG' | 'RECT_PLUS_DIAMOND' | 'CIRCULAR_HOOP' | 'HELICAL_SPIRAL' | 'DIAMOND_COMBINED';
  spiralPitch?: number; // mm

  isSeismic?: boolean;
  concreteGrade?: string;
  steelGrade?: string;
}

export function generateColumnBBS(input: ColumnInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 40; // IS 456 column cover = 40mm
  const grade = input.steelGrade ?? 'Fe500D';
  const concrete = input.concreteGrade ?? 'M25';
  const shape = (input.columnShape || input.subType || 'RECTANGULAR').toUpperCase();

  const colWidth = input.width || 400;
  const colDepth = input.depth || input.width || 400;
  const colHeight = input.clearHeight || input.floorHeight || 3000;

  // Corner bars vs. Face/Side bars
  const cornerDia = input.cornerDia || input.mainBarDia || 20;
  const cornerCount = input.cornerCount !== undefined ? input.cornerCount : (shape.includes('CIRCULAR') ? (input.mainBarCount || 6) : 4);
  const sideDia = input.sideDia || input.mainBarDia || cornerDia;
  const sideCount = input.sideCount !== undefined ? input.sideCount : (input.mainBarCount ? Math.max(input.mainBarCount - cornerCount, 0) : 0);

  const tieDia = input.tieDia || 8;
  const tieSpaceConfined = input.tieSpacingConfined || input.tieSpacingEnd || 100;
  const tieSpaceNormal = input.tieSpacingNormal || input.tieSpacingMid || 150;
  const tieType = (input.tieType || 'RECT_PLUS_DIAMOND').toUpperCase();

  // 1. Lap Length Calculation (IS 13920 Cl. 7.2.1 specifies 1.3 Ld staggered lap)
  const baseLdCorner = getDevelopmentLength(cornerDia, concrete, grade);
  const lapLengthCorner = input.lapLengthType === 'STANDARD_LD' ? baseLdCorner : Math.round(1.3 * baseLdCorner);

  const isStarter = input.isStarterBar || input.footingDepth !== undefined || colHeight < 2000;
  const footingLAnchor = isStarter ? Math.max(input.footingLAnchor || (input.footingDepth ? input.footingDepth - 100 : 350), 300) : 0;
  const straightLength = colHeight + lapLengthCorner + (input.floorThickness || 150);

  // Corner Bars
  if (isStarter || footingLAnchor > 0) {
    const resCorner = calculateRebarShape({
      shapeCode: '21',
      dia: cornerDia,
      dimA: straightLength,
      dimB: footingLAnchor,
      steelGrade: grade,
    });
    const totCorner = (resCorner.cutLengthMm * cornerCount) / 1000;
    const wtCorner = getUnitWeight(cornerDia);

    items.push({
      barMark: `${input.memberTag}-C-M1`,
      description: `${input.memberTag} Column Corner Longitudinal Bars (${cornerCount} Nos Ø${cornerDia}mm) with ${footingLAnchor}mm Starter L-Bend into Footing`,
      shapeCode: '21',
      dia: cornerDia,
      count: cornerCount,
      dimA: straightLength,
      dimB: footingLAnchor,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCorner.rawLengthMm,
      calculatedCutLength: resCorner.cutLengthMm,
      unitWeight: wtCorner,
      totalLengthM: Number(totCorner.toFixed(2)),
      totalWeightKg: Number((totCorner * wtCorner).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: true,
      remarks: `IS 456 / IS 13920 Starter bars with ${lapLengthCorner}mm lap (1.3Ld)`,
    });
  } else {
    const resCorner = calculateRebarShape({
      shapeCode: '20',
      dia: cornerDia,
      dimA: straightLength,
      steelGrade: grade,
    });
    const totCorner = (resCorner.cutLengthMm * cornerCount) / 1000;
    const wtCorner = getUnitWeight(cornerDia);

    items.push({
      barMark: `${input.memberTag}-C-M1`,
      description: `${input.memberTag} Column Corner Longitudinal Bars (${cornerCount} Nos Ø${cornerDia}mm)`,
      shapeCode: '20',
      dia: cornerDia,
      count: cornerCount,
      dimA: straightLength,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCorner.rawLengthMm,
      calculatedCutLength: resCorner.cutLengthMm,
      unitWeight: wtCorner,
      totalLengthM: Number(totCorner.toFixed(2)),
      totalWeightKg: Number((totCorner * wtCorner).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: true,
      remarks: `IS 13920 Cl. 7.2.1 1.3Ld staggered lap splice (${lapLengthCorner}mm)`,
    });
  }

  // Side / Face Bars (if different diameter or explicitly specified)
  if (sideCount > 0) {
    const baseLdSide = getDevelopmentLength(sideDia, concrete, grade);
    const lapLengthSide = input.lapLengthType === 'STANDARD_LD' ? baseLdSide : Math.round(1.3 * baseLdSide);
    const sideStraightLength = colHeight + lapLengthSide + (input.floorThickness || 150);

    if (isStarter || footingLAnchor > 0) {
      const resSide = calculateRebarShape({
        shapeCode: '21',
        dia: sideDia,
        dimA: sideStraightLength,
        dimB: footingLAnchor,
        steelGrade: grade,
      });
      const totSide = (resSide.cutLengthMm * sideCount) / 1000;
      const wtSide = getUnitWeight(sideDia);

      items.push({
        barMark: `${input.memberTag}-C-M2`,
        description: `${input.memberTag} Column Face / Side Longitudinal Bars (${sideCount} Nos Ø${sideDia}mm)`,
        shapeCode: '21',
        dia: sideDia,
        count: sideCount,
        dimA: sideStraightLength,
        dimB: footingLAnchor,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resSide.rawLengthMm,
        calculatedCutLength: resSide.cutLengthMm,
        unitWeight: wtSide,
        totalLengthM: Number(totSide.toFixed(2)),
        totalWeightKg: Number((totSide * wtSide).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: true,
        remarks: 'Column face reinforcement for intermediate bars',
      });
    } else {
      const resSide = calculateRebarShape({
        shapeCode: '20',
        dia: sideDia,
        dimA: sideStraightLength,
        steelGrade: grade,
      });
      const totSide = (resSide.cutLengthMm * sideCount) / 1000;
      const wtSide = getUnitWeight(sideDia);

      items.push({
        barMark: `${input.memberTag}-C-M2`,
        description: `${input.memberTag} Column Face / Side Longitudinal Bars (${sideCount} Nos Ø${sideDia}mm)`,
        shapeCode: '20',
        dia: sideDia,
        count: sideCount,
        dimA: sideStraightLength,
        dimB: 0,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resSide.rawLengthMm,
        calculatedCutLength: resSide.cutLengthMm,
        unitWeight: wtSide,
        totalLengthM: Number(totSide.toFixed(2)),
        totalWeightKg: Number((totSide * wtSide).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: true,
        remarks: 'Column face reinforcement for intermediate bars',
      });
    }
  }

  // 3. Lateral Confinement Links / Stirrups
  const l0 = Math.max(colWidth, colDepth, Math.round(colHeight / 6), 450);
  const midZoneLength = Math.max(colHeight - 2 * l0, 0);

  const countConfined = Math.ceil(l0 / tieSpaceConfined) * 2;
  const countMid = midZoneLength > 0 ? Math.ceil(midZoneLength / tieSpaceNormal) : 0;
  const totalOuterTies = countConfined + countMid;

  if (shape.includes('CIRCULAR') || tieType.includes('HELICAL') || tieType.includes('CIRCULAR')) {
    // Circular Hoop or Helical Spiral
    const coreDia = Math.max(colWidth - 2 * cover, 150);

    if (tieType.includes('HELICAL') || tieType.includes('SPIRAL')) {
      const pitch = input.spiralPitch || 75; // mm pitch
      const turns = Math.ceil(colHeight / pitch);
      const resSpiral = calculateRebarShape({
        shapeCode: '86', // Helical Spiral
        dia: tieDia,
        dimA: coreDia,
        dimB: pitch,
        dimC: colHeight,
        turns: turns,
        steelGrade: grade,
      });
      const totSpiral = resSpiral.cutLengthMm / 1000;
      const wtSpiral = getUnitWeight(tieDia);

      items.push({
        barMark: `${input.memberTag}-C-T1-SPIRAL`,
        description: `${input.memberTag} Continuous Helical Spiral (Core Ø${coreDia}mm @ ${pitch}mm pitch, ${turns} turns, Ø${tieDia}mm)`,
        shapeCode: '86',
        dia: tieDia,
        count: 1,
        dimA: coreDia,
        dimB: pitch,
        dimC: turns,
        dimD: 0,
        dimE: 0,
        rawCutLength: resSpiral.rawLengthMm,
        calculatedCutLength: resSpiral.cutLengthMm,
        unitWeight: wtSpiral,
        totalLengthM: Number(totSpiral.toFixed(2)),
        totalWeightKg: Number((totSpiral * wtSpiral).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'IS 13920 Cl. 7.6.1 Continuous circular spiral with 1.5 extra turns at ends',
      });
    } else {
      // Circular Hoops with 135° Seismic Hooks
      const resHoop = calculateRebarShape({
        shapeCode: '61', // Circular Link
        dia: tieDia,
        dimA: coreDia,
        steelGrade: grade,
      });
      const totHoop = (resHoop.cutLengthMm * totalOuterTies) / 1000;
      const wtHoop = getUnitWeight(tieDia);

      items.push({
        barMark: `${input.memberTag}-C-T1-HOOP`,
        description: `${input.memberTag} Circular Hoops with 135° Seismic Hooks (Ø${coreDia}mm core, Ø${tieDia}mm)`,
        shapeCode: '61',
        dia: tieDia,
        count: totalOuterTies,
        dimA: coreDia,
        dimB: 0,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resHoop.rawLengthMm,
        calculatedCutLength: resHoop.cutLengthMm,
        unitWeight: wtHoop,
        totalLengthM: Number(totHoop.toFixed(2)),
        totalWeightKg: Number((totHoop * wtHoop).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'Circular ties with 135° seismic hooks for circular column',
      });
    }
  } else {
    // Rectangular Ties
    const outerA = colWidth - 2 * cover;
    const outerB = colDepth - 2 * cover;

    const resOuter = calculateRebarShape({
      shapeCode: '51',
      dia: tieDia,
      dimA: outerA,
      dimB: outerB,
      steelGrade: grade,
    });
    const totOuter = (resOuter.cutLengthMm * totalOuterTies) / 1000;
    const wtOuter = getUnitWeight(tieDia);

    items.push({
      barMark: `${input.memberTag}-C-T1`,
      description: `${input.memberTag} Outer Rectangular Ties with 135° Seismic Hooks (${countConfined} in lo=${l0}mm, ${countMid} mid, Ø${tieDia}mm)`,
      shapeCode: '51',
      dia: tieDia,
      count: totalOuterTies,
      dimA: outerA,
      dimB: outerB,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resOuter.rawLengthMm,
      calculatedCutLength: resOuter.cutLengthMm,
      unitWeight: wtOuter,
      totalLengthM: Number(totOuter.toFixed(2)),
      totalWeightKg: Number((totOuter * wtOuter).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: `IS 13920 Cl. 7.4 135° seismic hook tail ≥ ${getStirrupHookTail(tieDia)}mm`,
    });

    // Internal diamond tie or cross tie
    if (tieType.includes('DIAMOND') && (cornerCount + sideCount) >= 8) {
      const diaA = Math.round(Math.sqrt(Math.pow(outerA / 2, 2) + Math.pow(outerB / 2, 2)));
      const resDia = calculateRebarShape({
        shapeCode: '81', // Diamond Tie
        dia: tieDia,
        dimA: diaA,
        dimB: diaA,
        steelGrade: grade,
      });
      const totDia = (resDia.cutLengthMm * totalOuterTies) / 1000;

      items.push({
        barMark: `${input.memberTag}-C-T2-DIA`,
        description: `${input.memberTag} Internal Diamond Ties with 135° Seismic Hooks (Ø${tieDia}mm)`,
        shapeCode: '81',
        dia: tieDia,
        count: totalOuterTies,
        dimA: diaA,
        dimB: diaA,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resDia.rawLengthMm,
        calculatedCutLength: resDia.cutLengthMm,
        unitWeight: wtOuter,
        totalLengthM: Number(totDia.toFixed(2)),
        totalWeightKg: Number((totDia * wtOuter).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'IS 13920 internal diamond tie restraining intermediate face bars',
      });
    } else if (tieType === 'RECT_4_LEG' || (cornerCount + sideCount) >= 8) {
      // 4-leg cross tie
      const resCrossTie = calculateRebarShape({
        shapeCode: '71',
        dia: tieDia,
        dimA: outerA,
        steelGrade: grade,
      });
      const totCrossTie = (resCrossTie.cutLengthMm * totalOuterTies) / 1000;

      items.push({
        barMark: `${input.memberTag}-C-T2-TIE`,
        description: `${input.memberTag} Internal Cross-Ties with 135° Seismic Hooks (Ø${tieDia}mm)`,
        shapeCode: '71',
        dia: tieDia,
        count: totalOuterTies,
        dimA: outerA,
        dimB: 0,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resCrossTie.rawLengthMm,
        calculatedCutLength: resCrossTie.cutLengthMm,
        unitWeight: wtOuter,
        totalLengthM: Number(totCrossTie.toFixed(2)),
        totalWeightKg: Number((totCrossTie * wtOuter).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'IS 13920 Cl. 7.4.2 Cross-tie restraining intermediate face bars',
      });
    }
  }

  return items;
}
