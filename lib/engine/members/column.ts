import { calculateRebarShape, getDevelopmentLength, getStirrupHookTail, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface ColumnInput {
  memberTag: string; // e.g. "C1", "C2-GFL", "CIRC-C3", "PED-1"
  columnShape?: 'RECTANGULAR' | 'CIRCULAR' | 'L_SHAPED' | 'T_SHAPED';
  subType?: string;
  width?: number; // mm (b) or Diameter for circular
  depth?: number; // mm (D)
  clearHeight?: number; // mm (floor to ceiling)
  floorHeight?: number; // mm
  footingDepth?: number; // mm
  floorThickness?: number; // mm
  clearCover?: number; // mm (default 40mm)

  // Longitudinal Bars
  mainBarDia?: number; // mm
  mainBarCount?: number;
  cornerDia?: number; // mm
  cornerCount?: number;
  sideDia?: number; // mm
  sideCount?: number;

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

  const mainDia = input.mainBarDia || input.cornerDia || 20;
  const totalMainCount = input.mainBarCount || ((input.cornerCount || 4) + (input.sideCount || 0));

  const tieDia = input.tieDia || 8;
  const tieSpaceConfined = input.tieSpacingConfined || input.tieSpacingEnd || 100;
  const tieSpaceNormal = input.tieSpacingNormal || input.tieSpacingMid || 150;
  const tieType = (input.tieType || 'RECT_PLUS_DIAMOND').toUpperCase();

  // 1. Lap Length Calculation (IS 13920 Cl. 7.2.1 specifies 1.3 Ld staggered lap)
  const baseLd = getDevelopmentLength(mainDia, concrete, grade);
  const lapLength = input.lapLengthType === 'STANDARD_LD' ? baseLd : Math.round(1.3 * baseLd);

  // 2. Longitudinal Main Reinforcement
  const isStarter = input.isStarterBar || input.footingDepth !== undefined || colHeight < 2000;
  const footingLAnchor = isStarter ? Math.max(input.footingLAnchor || (input.footingDepth ? input.footingDepth - 100 : 350), 300) : 0;
  const straightLength = colHeight + lapLength + (input.floorThickness || 150);

  if (isStarter || footingLAnchor > 0) {
    const resMain = calculateRebarShape({
      shapeCode: '21', // L-Bar with 90° footing anchor
      dia: mainDia,
      dimA: straightLength,
      dimB: footingLAnchor,
      steelGrade: grade,
    });
    const totMain = (resMain.cutLengthMm * totalMainCount) / 1000;
    const wtMain = getUnitWeight(mainDia);

    items.push({
      barMark: 'C-M1',
      description: `${input.memberTag} Column Main Bars with ${footingLAnchor}mm Starter L-Bend into Footing (${totalMainCount} Nos)`,
      shapeCode: '21',
      dia: mainDia,
      count: totalMainCount,
      dimA: straightLength,
      dimB: footingLAnchor,
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
      isLap: true,
      remarks: `IS 456 Cl. 26.2.1 / IS 13920 Cl. 7.2.1 Starter bars with ${lapLength}mm staggered lap (1.3Ld)`,
    });
  } else {
    const resMain = calculateRebarShape({
      shapeCode: '20', // Straight Bar with Lap
      dia: mainDia,
      dimA: straightLength,
      steelGrade: grade,
    });
    const totMain = (resMain.cutLengthMm * totalMainCount) / 1000;
    const wtMain = getUnitWeight(mainDia);

    items.push({
      barMark: 'C-M1',
      description: `${input.memberTag} Column Main Longitudinal Bars (${totalMainCount} Nos)`,
      shapeCode: '20',
      dia: mainDia,
      count: totalMainCount,
      dimA: straightLength,
      dimB: 0,
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
      isLap: true,
      remarks: `IS 13920 Cl. 7.2.1 1.3Ld staggered lap splice (${lapLength}mm)`,
    });
  }

  // 3. Lateral Confinement Links / Stirrups
  // Confining Zone Length lo = max(width, depth, clearHeight/6, 450mm) per IS 13920 Cl. 7.6.1
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
        dimC: turns,
        steelGrade: grade,
      });
      const totSpiral = resSpiral.cutLengthMm / 1000;
      const wtSpiral = getUnitWeight(tieDia);

      items.push({
        barMark: 'C-T1-SPIRAL',
        description: `${input.memberTag} Continuous Helical Spiral (Core Ø${coreDia}mm @ ${pitch}mm pitch, ${turns} turns)`,
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
        barMark: 'C-T1-HOOP',
        description: `${input.memberTag} Circular Hoops with 135° Seismic Hooks (Ø${coreDia}mm core)`,
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
        remarks: 'IS 13920 135° seismic closed circular hoops with 10d tail',
      });
    }
  } else {
    // Rectangular Outer Ties (IS 2502 Shape 51)
    const dimA = Math.max(colWidth - 2 * cover, 100);
    const dimB = Math.max(colDepth - 2 * cover, 100);

    const resOuterTie = calculateRebarShape({
      shapeCode: '51',
      dia: tieDia,
      dimA,
      dimB,
      steelGrade: grade,
    });
    const totOuterTie = (resOuterTie.cutLengthMm * totalOuterTies) / 1000;
    const wtOuterTie = getUnitWeight(tieDia);

    items.push({
      barMark: 'C-T1',
      description: `${input.memberTag} Outer Rectangular Ties with 135° Seismic Hooks (${countConfined} in lo=${l0}mm, ${countMid} mid)`,
      shapeCode: '51',
      dia: tieDia,
      count: totalOuterTies,
      dimA,
      dimB,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resOuterTie.rawLengthMm,
      calculatedCutLength: resOuterTie.cutLengthMm,
      unitWeight: wtOuterTie,
      totalLengthM: Number(totOuterTie.toFixed(2)),
      totalWeightKg: Number((totOuterTie * wtOuterTie).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 13920 Cl. 7.6.1 135° seismic hooks with ≥10d (min 75mm) tail extension',
    });

    // Internal Diamond / Cross Ties (if 8 or more bars or RECT_PLUS_DIAMOND)
    if (totalMainCount >= 8 || tieType.includes('DIAMOND')) {
      const resDiamond = calculateRebarShape({
        shapeCode: '81', // Diamond / Rhombus Tie
        dia: tieDia,
        dimA,
        dimB,
        steelGrade: grade,
      });
      const totDiamond = (resDiamond.cutLengthMm * totalOuterTies) / 1000;
      const wtDiamond = getUnitWeight(tieDia);

      items.push({
        barMark: 'C-T2-DIA',
        description: `${input.memberTag} Internal Diamond Ties with 135° Seismic Hooks`,
        shapeCode: '81',
        dia: tieDia,
        count: totalOuterTies,
        dimA,
        dimB,
        dimC: 0,
        dimD: 0,
        dimE: 0,
        rawCutLength: resDiamond.rawLengthMm,
        calculatedCutLength: resDiamond.cutLengthMm,
        unitWeight: wtDiamond,
        totalLengthM: Number(totDiamond.toFixed(2)),
        totalWeightKg: Number((totDiamond * wtDiamond).toFixed(2)),
        isPayable: true,
        isChair: false,
        isLap: false,
        remarks: 'IS 13920 Cl. 7.6.2 Diamond tie restraining intermediate longitudinal column bars',
      });
    }
  }

  return items;
}
