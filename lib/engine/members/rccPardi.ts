import { calculateRebarShape, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface RccPardiInput {
  memberTag: string; // e.g. "PARDI-1", "LIFT-CORE-W1", "BASEMENT-PARDI"
  wallType?: 'RCC_PARDI' | 'LIFT_CORE_WALL' | 'RETAINING_WALL' | 'PARAPET_PARDI';
  subType?: string;
  length: number; // mm (running length L)
  height: number; // mm (overall height H)
  thickness: number; // mm (thickness T, e.g. 150mm, 200mm, 250mm)
  clearCover?: number; // mm (default 30mm for walls, 40mm for liquid/earth face)

  // Vertical Reinforcement (Main)
  vertMainDia?: number; // mm (e.g. 10mm, 12mm)
  vertMainSpacing?: number; // mm c/c (e.g. 150mm)
  vertStarterLapLength?: number; // mm (starter anchorage from slab/footing)

  // Horizontal Distribution Reinforcement
  horizDistDia?: number; // mm (e.g. 8mm, 10mm)
  horizDistSpacing?: number; // mm c/c (e.g. 150mm)

  // End U-Pins / Closing Caps
  includeEndCaps?: boolean;
  endCapDia?: number; // mm

  // Spacer Cross-Ties (Links connecting outer and inner meshes)
  includeCrossTies?: boolean;
  crossTieDia?: number; // mm (e.g. 8mm)
  crossTieSpacing?: number; // mm c/c (e.g. 450mm grid)

  concreteGrade?: string;
  steelGrade?: string;
}

export function generateRccPardiBBS(input: RccPardiInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 30; // 30mm standard wall cover
  const grade = input.steelGrade ?? 'Fe500D';

  const vertDia = input.vertMainDia || 12;
  const vertSpacing = input.vertMainSpacing || 150;
  const horizDia = input.horizDistDia || 10;
  const horizSpacing = input.horizDistSpacing || 150;

  const starterLd = input.vertStarterLapLength || Math.max(45 * vertDia, 450);
  const totalVertLength = input.height + starterLd;

  // 1. Vertical Main Bars — Dual Face (Outer + Inner Mesh = 2 layers)
  const countVertPerFace = Math.ceil(Math.max(input.length - 2 * cover, 100) / vertSpacing) + 1;
  const totalVertCount = countVertPerFace * 2; // 2 faces

  const resVert = calculateRebarShape({
    shapeCode: '21', // L-bar anchoring into footing / slab
    dia: vertDia,
    dimA: input.height,
    dimB: starterLd,
    steelGrade: grade,
  });

  const totVertLen = (resVert.cutLengthMm * totalVertCount) / 1000;
  const unitWtVert = getUnitWeight(vertDia);

  items.push({
    barMark: `${input.memberTag}-V1`,
    description: `${input.memberTag} Vertical Main Rebar (Dual Faces: 2x${countVertPerFace} Nos) @ ${vertSpacing}mm c/c with ${starterLd}mm L-Anchor`,
    shapeCode: '21',
    dia: vertDia,
    count: totalVertCount,
    dimA: input.height,
    dimB: starterLd,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resVert.rawLengthMm,
    calculatedCutLength: resVert.cutLengthMm,
    unitWeight: unitWtVert,
    totalLengthM: Number(totVertLen.toFixed(2)),
    totalWeightKg: Number((totVertLen * unitWtVert).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: true,
    remarks: 'IS 456 / IS 13920 Dual-face vertical reinforcement for RCC pardi / shear wall',
  });

  // 2. Horizontal Distribution Bars — Dual Face (Outer + Inner Mesh = 2 layers)
  const countHorizPerFace = Math.ceil(Math.max(input.height - 2 * cover, 100) / horizSpacing) + 1;
  const totalHorizCount = countHorizPerFace * 2; // 2 faces
  const horizDimA = Math.max(input.length - 2 * cover, 100);
  const endBend = Math.max(input.thickness - 2 * cover, 100);

  const resHoriz = calculateRebarShape({
    shapeCode: '37', // U-shape return bend at wall ends
    dia: horizDia,
    dimA: horizDimA,
    dimB: endBend,
    steelGrade: grade,
  });

  const totHorizLen = (resHoriz.cutLengthMm * totalHorizCount) / 1000;
  const unitWtHoriz = getUnitWeight(horizDia);

  items.push({
    barMark: `${input.memberTag}-H1`,
    description: `${input.memberTag} Horizontal Distribution Bars (Dual Faces: 2x${countHorizPerFace} Nos) @ ${horizSpacing}mm c/c`,
    shapeCode: '37',
    dia: horizDia,
    count: totalHorizCount,
    dimA: horizDimA,
    dimB: endBend,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resHoriz.rawLengthMm,
    calculatedCutLength: resHoriz.cutLengthMm,
    unitWeight: unitWtHoriz,
    totalLengthM: Number(totHorizLen.toFixed(2)),
    totalWeightKg: Number((totHorizLen * unitWtHoriz).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Dual-face horizontal distribution bars with end closing returns',
  });

  // 3. End U-Pins / Boundary Element Caps (at wall edges & openings)
  const capDia = input.endCapDia || horizDia;
  const capCount = countHorizPerFace * 2; // both ends
  const uPinWidth = Math.max(input.thickness - 2 * cover, 80);
  const uPinLeg = Math.max(2 * uPinWidth, 250);

  const resCap = calculateRebarShape({
    shapeCode: '37', // U-Pin
    dia: capDia,
    dimA: uPinWidth,
    dimB: uPinLeg,
    steelGrade: grade,
  });

  const totCapLen = (resCap.cutLengthMm * capCount) / 1000;
  const wtCap = getUnitWeight(capDia);

  items.push({
    barMark: `${input.memberTag}-UPIN`,
    description: `${input.memberTag} End U-Pins / Edge Closing Caps (${capCount} Nos at wall extremities)`,
    shapeCode: '37',
    dia: capDia,
    count: capCount,
    dimA: uPinWidth,
    dimB: uPinLeg,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resCap.rawLengthMm,
    calculatedCutLength: resCap.cutLengthMm,
    unitWeight: wtCap,
    totalLengthM: Number(totCapLen.toFixed(2)),
    totalWeightKg: Number((totCapLen * wtCap).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'IS 13920 Cl. 9.4 Special boundary confinement U-pins closing wall edges',
  });

  // 4. Cross-Ties / Spacers (connecting inner & outer faces)
  const tieDia = input.crossTieDia || 8;
  const wallAreaM2 = (input.length * input.height) / 1000000;
  const crossTieCount = Math.max(Math.ceil(wallAreaM2 * 4), 4); // 4 ties per m²
  const tieLength = Math.max(input.thickness - 2 * cover, 80);

  const resTie = calculateRebarShape({
    shapeCode: '71', // Cross-tie with 135° hooks
    dia: tieDia,
    dimA: tieLength,
    steelGrade: grade,
  });

  const totTieLen = (resTie.cutLengthMm * crossTieCount) / 1000;
  const wtTie = getUnitWeight(tieDia);

  items.push({
    barMark: `${input.memberTag}-TIE`,
    description: `${input.memberTag} Cross-Ties / Spacers @ 450mm staggered grid (${crossTieCount} Nos)`,
    shapeCode: '71',
    dia: tieDia,
    count: crossTieCount,
    dimA: tieLength,
    dimB: 0,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resTie.rawLengthMm,
    calculatedCutLength: resTie.cutLengthMm,
    unitWeight: wtTie,
    totalLengthM: Number(totTieLen.toFixed(2)),
    totalWeightKg: Number((totTieLen * wtTie).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Cross-ties maintaining separation and lateral stability between dual pardi faces',
  });

  return items;
}
