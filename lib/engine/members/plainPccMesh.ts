import { calculateRebarShape, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface PlainPccMeshInput {
  memberTag: string; // e.g. "PCC-1", "GRADE-SLAB-GFL", "PLINTH-FLOOR-1"
  flooringType?: 'PLAIN_PCC_WITH_MESH' | 'GRADE_SLAB' | 'PLINTH_FILLING_MESH' | 'ROAD_PAVEMENT_MESH';
  subType?: string;
  length: number; // mm (in X direction)
  width: number; // mm (in Y direction)
  thickness: number; // mm (PCC thickness, e.g. 100mm, 125mm, 150mm)
  clearCover?: number; // mm (default 30mm or 50mm on ground)

  // Mesh Reinforcement
  meshDiaX?: number; // mm (e.g. 8mm, 10mm)
  meshSpacingX?: number; // mm c/c (e.g. 150mm, 200mm)
  meshDiaY?: number; // mm (e.g. 8mm, 10mm)
  meshSpacingY?: number; // mm c/c (e.g. 150mm, 200mm)

  // Edge Detailing
  hasEdgeBendUp?: boolean;
  edgeBendHeight?: number; // mm

  concreteGrade?: string;
  steelGrade?: string;
}

export function generatePlainPccMeshBBS(input: PlainPccMeshInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 30; // 30mm cover for PCC grade slab
  const grade = input.steelGrade ?? 'Fe500D';

  const diaX = input.meshDiaX || 8;
  const spacingX = input.meshSpacingX || 150;
  const diaY = input.meshDiaY || 8;
  const spacingY = input.meshSpacingY || 150;

  const hasEdgeBend = input.hasEdgeBendUp ?? true;
  const bendHeight = hasEdgeBend ? Math.max(input.thickness - 2 * cover, 50) : 0;

  // 1. Mesh along Length (X direction)
  const spanX = Math.max(input.length - 2 * cover, 100);
  const countX = Math.ceil(Math.max(input.width - 2 * cover, 100) / spacingX) + 1;

  const resMeshX = calculateRebarShape({
    shapeCode: hasEdgeBend ? '37' : '20',
    dia: diaX,
    dimA: spanX,
    dimB: bendHeight,
    steelGrade: grade,
  });

  const totLenX = (resMeshX.cutLengthMm * countX) / 1000;
  const unitWtX = getUnitWeight(diaX);

  items.push({
    barMark: `${input.memberTag}-MX`,
    description: `${input.memberTag} PCC Grade Mesh along Length (${spanX}mm span) @ ${spacingX}mm c/c`,
    shapeCode: hasEdgeBend ? '37' : '20',
    dia: diaX,
    count: countX,
    dimA: spanX,
    dimB: bendHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resMeshX.rawLengthMm,
    calculatedCutLength: resMeshX.cutLengthMm,
    unitWeight: unitWtX,
    totalLengthM: Number(totLenX.toFixed(2)),
    totalWeightKg: Number((totLenX * unitWtX).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Anti-crack / temperature shrinkage single layer steel mesh in plain PCC plinth flooring',
  });

  // 2. Mesh along Width (Y direction)
  const spanY = Math.max(input.width - 2 * cover, 100);
  const countY = Math.ceil(Math.max(input.length - 2 * cover, 100) / spacingY) + 1;

  const resMeshY = calculateRebarShape({
    shapeCode: hasEdgeBend ? '37' : '20',
    dia: diaY,
    dimA: spanY,
    dimB: bendHeight,
    steelGrade: grade,
  });

  const totLenY = (resMeshY.cutLengthMm * countY) / 1000;
  const unitWtY = getUnitWeight(diaY);

  items.push({
    barMark: `${input.memberTag}-MY`,
    description: `${input.memberTag} PCC Grade Mesh along Width (${spanY}mm span) @ ${spacingY}mm c/c`,
    shapeCode: hasEdgeBend ? '37' : '20',
    dia: diaY,
    count: countY,
    dimA: spanY,
    dimB: bendHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resMeshY.rawLengthMm,
    calculatedCutLength: resMeshY.cutLengthMm,
    unitWeight: unitWtY,
    totalLengthM: Number(totLenY.toFixed(2)),
    totalWeightKg: Number((totLenY * unitWtY).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Transverse shrinkage mesh layer tied over 30mm concrete cover spacer blocks',
  });

  return items;
}
