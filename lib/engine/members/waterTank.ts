import { calculateRebarShape, getDevelopmentLength, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface WaterTankInput {
  memberTag: string; // e.g. "UGWT-WALL", "RET-WALL-RW1"
  structureType: 'UNDERGROUND_WATER_TANK' | 'OVERHEAD_WATER_TANK' | 'CANTILEVER_RETAINING_WALL' | 'COUNTERFORT_RETAINING_WALL';
  wallLength: number; // mm (e.g. 6000mm)
  wallHeight: number; // mm (e.g. 3500mm)
  wallThickness: number; // mm (e.g. 250mm or 300mm)
  liquidFaceCover?: number; // mm (default 40mm per IS 3370)
  outerFaceCover?: number; // mm (default 30mm)
  
  // Vertical Reinforcement (Liquid / Water Face & Earth/Outer Face)
  verticalDiaWaterFace: number; // mm (e.g. 12mm or 16mm)
  verticalSpacingWaterFace: number; // mm c/c (e.g. 150mm)
  verticalDiaOuterFace: number; // mm (e.g. 10mm or 12mm)
  verticalSpacingOuterFace: number; // mm c/c (e.g. 150mm)
  
  // Horizontal Reinforcement (Hoop / Distribution)
  horizontalDiaWaterFace: number; // mm (e.g. 10mm)
  horizontalSpacingWaterFace: number; // mm c/c (e.g. 150mm)
  horizontalDiaOuterFace: number; // mm (e.g. 10mm)
  horizontalSpacingOuterFace: number; // mm c/c (e.g. 150mm)
  
  // Base Kicker Starter Bars
  kickerHeight?: number; // mm (default 150mm)
  hasBaseKickerLap?: boolean;
  
  concreteGrade?: string; // e.g. "M30" (IS 3370 min M30 for prestressed/reinforced water tanks)
  steelGrade?: string;
}

export function generateWaterTankBBS(input: WaterTankInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const liquidCover = input.liquidFaceCover ?? 40; // IS 3370 Cl. 8.2 minimum liquid face cover = 40mm
  const outerCover = input.outerFaceCover ?? 30;
  const grade = input.steelGrade ?? 'Fe500D';
  const concrete = input.concreteGrade ?? 'M30';
  const Ld = getDevelopmentLength(input.verticalDiaWaterFace, concrete, grade);
  const kickerHeight = input.kickerHeight ?? 150;

  // Base bend into raft/base slab (foot)
  const baseFoot = Math.max(300, Math.round(input.wallThickness * 1.5));

  // 1. Water Face Vertical Main Reinforcement (L-shape anchored into base slab)
  const vertCutWaterFace = input.wallHeight + baseFoot + (input.hasBaseKickerLap ? Ld : 0);
  const countVertWater = Math.ceil(Math.max(input.wallLength - 2 * liquidCover, 100) / input.verticalSpacingWaterFace) + 1;

  const resVertWater = calculateRebarShape({
    shapeCode: '21', // L-Bar
    dia: input.verticalDiaWaterFace,
    dimA: input.wallHeight,
    dimB: baseFoot,
    steelGrade: grade,
  });

  items.push({
    barMark: 'WT-V1',
    description: `${input.memberTag} Vertical Main Steel (Liquid Face - IS 3370)`,
    shapeCode: '21',
    dia: input.verticalDiaWaterFace,
    count: countVertWater,
    dimA: input.wallHeight,
    dimB: baseFoot,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resVertWater.rawCutLength,
    calculatedCutLength: resVertWater.roundedCutLength,
    unitWeight: resVertWater.unitWeight,
    totalLengthM: Number(((countVertWater * resVertWater.roundedCutLength) / 1000).toFixed(2)),
    totalWeightKg: Number(((countVertWater * resVertWater.roundedCutLength * resVertWater.unitWeight) / 1000).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `Liquid Face: Spacing ${input.verticalSpacingWaterFace}mm c/c, Clear Cover ${liquidCover}mm (IS 3370 liquid-retaining)`,
  });

  // 2. Outer / Earth Face Vertical Reinforcement (Dual Face Symmetric if Thickness > 200mm)
  const isDualFace = input.wallThickness >= 200;
  if (isDualFace) {
    const countVertOuter = Math.ceil(Math.max(input.wallLength - 2 * outerCover, 100) / input.verticalSpacingOuterFace) + 1;
    const resVertOuter = calculateRebarShape({
      shapeCode: '21',
      dia: input.verticalDiaOuterFace,
      dimA: input.wallHeight,
      dimB: baseFoot,
      steelGrade: grade,
    });

    items.push({
      barMark: 'WT-V2',
      description: `${input.memberTag} Vertical Main Steel (Outer / Earth Face - Dual Cage)`,
      shapeCode: '21',
      dia: input.verticalDiaOuterFace,
      count: countVertOuter,
      dimA: input.wallHeight,
      dimB: baseFoot,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resVertOuter.rawCutLength,
      calculatedCutLength: resVertOuter.roundedCutLength,
      unitWeight: resVertOuter.unitWeight,
      totalLengthM: Number(((countVertOuter * resVertOuter.roundedCutLength) / 1000).toFixed(2)),
      totalWeightKg: Number(((countVertOuter * resVertOuter.roundedCutLength * resVertOuter.unitWeight) / 1000).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: `Outer Face: Dual-face symmetric cage for wall thickness ${input.wallThickness}mm (>=200mm)`,
    });
  }

  // 3. Horizontal Ring / Distribution Steel (Liquid Face)
  const countHorizWater = Math.ceil(Math.max(input.wallHeight - 2 * liquidCover, 100) / input.horizontalSpacingWaterFace) + 1;
  const horizCutWater = Math.max(input.wallLength - 2 * liquidCover, 100);

  const resHorizWater = calculateRebarShape({
    shapeCode: '20',
    dia: input.horizontalDiaWaterFace,
    dimA: horizCutWater,
    steelGrade: grade,
  });

  items.push({
    barMark: 'WT-H1',
    description: `${input.memberTag} Horizontal Hoop / Temp Steel (Liquid Face)`,
    shapeCode: '20',
    dia: input.horizontalDiaWaterFace,
    count: countHorizWater,
    dimA: horizCutWater,
    dimB: 0,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resHorizWater.rawCutLength,
    calculatedCutLength: resHorizWater.roundedCutLength,
    unitWeight: resHorizWater.unitWeight,
    totalLengthM: Number(((countHorizWater * resHorizWater.roundedCutLength) / 1000).toFixed(2)),
    totalWeightKg: Number(((countHorizWater * resHorizWater.roundedCutLength * resHorizWater.unitWeight) / 1000).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `Horizontal distribution @ ${input.horizontalSpacingWaterFace}mm c/c (Min 0.35% steel ratio)`,
  });

  // 4. Horizontal Ring / Distribution Steel (Outer Face)
  if (isDualFace) {
    const countHorizOuter = Math.ceil(Math.max(input.wallHeight - 2 * outerCover, 100) / input.horizontalSpacingOuterFace) + 1;
    const horizCutOuter = Math.max(input.wallLength - 2 * outerCover, 100);

    const resHorizOuter = calculateRebarShape({
      shapeCode: '20',
      dia: input.horizontalDiaOuterFace,
      dimA: horizCutOuter,
      steelGrade: grade,
    });

    items.push({
      barMark: 'WT-H2',
      description: `${input.memberTag} Horizontal Hoop / Temp Steel (Outer Face)`,
      shapeCode: '20',
      dia: input.horizontalDiaOuterFace,
      count: countHorizOuter,
      dimA: horizCutOuter,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resHorizOuter.rawCutLength,
      calculatedCutLength: resHorizOuter.roundedCutLength,
      unitWeight: resHorizOuter.unitWeight,
      totalLengthM: Number(((countHorizOuter * resHorizOuter.roundedCutLength) / 1000).toFixed(2)),
      totalWeightKg: Number(((countHorizOuter * resHorizOuter.roundedCutLength * resHorizOuter.unitWeight) / 1000).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: `Outer face horizontal distribution @ ${input.horizontalSpacingOuterFace}mm c/c`,
    });
  }

  // 5. Corner Junction U-Binders / Links (Shape 37)
  const cornerSpan = Math.min(input.wallThickness * 2, 600);
  const cornerCount = (countHorizWater * 2); // 4 corners / junctions
  const resCorner = calculateRebarShape({
    shapeCode: '37',
    dia: input.horizontalDiaWaterFace,
    dimA: cornerSpan,
    dimB: Math.max(input.wallThickness - liquidCover - outerCover, 150),
    steelGrade: grade,
  });

  items.push({
    barMark: 'WT-CN1',
    description: `${input.memberTag} Corner Wall Junction Moment Ties / U-Binders`,
    shapeCode: '37',
    dia: input.horizontalDiaWaterFace,
    count: cornerCount,
    dimA: cornerSpan,
    dimB: Math.max(input.wallThickness - liquidCover - outerCover, 150),
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resCorner.rawCutLength,
    calculatedCutLength: resCorner.roundedCutLength,
    unitWeight: resCorner.unitWeight,
    totalLengthM: Number(((cornerCount * resCorner.roundedCutLength) / 1000).toFixed(2)),
    totalWeightKg: Number(((cornerCount * resCorner.roundedCutLength * resCorner.unitWeight) / 1000).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: `Corner moment continuity ties per IS 3370 Part 2`,
  });

  return items;
}
