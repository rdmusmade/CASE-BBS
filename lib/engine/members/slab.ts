import { calculateRebarShape, getDevelopmentLength, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface SlabInput {
  memberTag: string; // e.g. "S1", "SLAB-TWO-WAY", "BALC-1", "CHAJJA-1"
  slabType?: 'ONE_WAY' | 'TWO_WAY' | 'TWO_WAY_RESTRAINED' | 'FLAT_SLAB' | 'CANTILEVER' | 'CANTILEVER_BALCONY' | 'SUNSHADE_CHAJJA';
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

  // Cranked / Alternate Bent-up bars
  useAlternateCrank?: boolean;

  // Top Extra / Support Hogging Bars
  hasTopExtraAtSupports?: boolean;
  topExtraDia?: number; // mm
  topExtraSpacing?: number; // mm

  // For Cantilever Slab
  cantileverBackSpan?: number; // mm (anchorage >= 1.5 * cantilever span)

  // For Flat Slabs / Top Mesh Chairs
  topMeshChairCount?: number;
  hasDropPanel?: boolean;
  dropThickness?: number; // mm

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
  const type = (input.slabType || input.subType || 'TWO_WAY').toUpperCase();

  const lx = input.shortSpanLx || input.lx || 3500;
  const ly = input.longSpanLy || input.ly || 4500;

  const mainDia = input.shortMainDia || input.mainBarDia || 10;
  const mainSpacing = input.shortMainSpacing || input.mainBarSpacing || 150;
  const distDia = input.longMainDia || input.distBarDia || 8;
  const distSpacing = input.longMainSpacing || input.distBarSpacing || 175;

  const bendUpHeight = Math.max(input.thickness - 2 * cover, 75);

  // -------------------------------------------------------------
  // 1. CANTILEVER BALCONY / SUNSHADE CHAJJA SLAB
  // -------------------------------------------------------------
  if (type.includes('CANTILEVER') || type.includes('SUNSHADE') || type.includes('CHAJJA')) {
    const cantSpan = lx;
    const backSpan = input.cantileverBackSpan || Math.max(Math.round(1.5 * cantSpan), getDevelopmentLength(mainDia, concrete, grade));
    const cantileverTotalLength = cantSpan + supWidthX + backSpan;
    const countMain = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;

    // Top Main Tension Bar (Anchored 1.5x backspan into adjacent slab)
    const resCantMain = calculateRebarShape({
      shapeCode: '21', // L-Bar (bent down at free outer edge)
      dia: mainDia,
      dimA: cantileverTotalLength,
      dimB: bendUpHeight,
      steelGrade: grade,
    });
    const totCantMain = (resCantMain.cutLengthMm * countMain) / 1000;
    const wtCantMain = getUnitWeight(mainDia);

    items.push({
      barMark: 'S-CANT-T1',
      description: `${input.memberTag} Cantilever Top Main Tension Rebar (Span ${cantSpan}mm + 1.5x Backspan ${backSpan}mm) @ ${mainSpacing}mm c/c`,
      shapeCode: '21',
      dia: mainDia,
      count: countMain,
      dimA: cantileverTotalLength,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resCantMain.rawLengthMm,
      calculatedCutLength: resCantMain.cutLengthMm,
      unitWeight: wtCantMain,
      totalLengthM: Number(totCantMain.toFixed(2)),
      totalWeightKg: Number((totCantMain * wtCantMain).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Cl. 26.2.1 Cantilever top tension steel anchored 1.5x backspan into floor slab',
    });

    // Distribution Bars along Cantilever Width
    const distLength = ly + 2 * (supWidthY - cover);
    const countDist = Math.ceil(cantSpan / distSpacing) + 1;
    const resDist = calculateRebarShape({
      shapeCode: '20',
      dia: distDia,
      dimA: distLength,
      steelGrade: grade,
    });
    const totDist = (resDist.cutLengthMm * countDist) / 1000;
    const wtDist = getUnitWeight(distDia);

    items.push({
      barMark: 'S-CANT-D1',
      description: `${input.memberTag} Cantilever Distribution Bars @ ${distSpacing}mm c/c`,
      shapeCode: '20',
      dia: distDia,
      count: countDist,
      dimA: distLength,
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
      remarks: 'Transverse distribution steel tied beneath top tension mesh',
    });

    return items;
  }

  // -------------------------------------------------------------
  // 2. ONE-WAY & TWO-WAY SLABS (IS 456 Cl. 26.5.2 & Table 26)
  // -------------------------------------------------------------

  // Short Span Bottom Main Reinforcement (B1)
  const spanX = lx + 2 * (supWidthX - cover);
  const countX = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;
  const resMainX = calculateRebarShape({
    shapeCode: '37', // U-bar with 90° bend up at wall supports
    dia: mainDia,
    dimA: spanX,
    dimB: bendUpHeight,
    steelGrade: grade,
  });
  const totMainX = (resMainX.cutLengthMm * countX) / 1000;
  const wtMainX = getUnitWeight(mainDia);

  items.push({
    barMark: 'S-B1-SHORT',
    description: `${input.memberTag} Short-Span Bottom Main Rebar (${lx}mm clear span) @ ${mainSpacing}mm c/c`,
    shapeCode: '37',
    dia: mainDia,
    count: countX,
    dimA: spanX,
    dimB: bendUpHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resMainX.rawLengthMm,
    calculatedCutLength: resMainX.cutLengthMm,
    unitWeight: wtMainX,
    totalLengthM: Number(totMainX.toFixed(2)),
    totalWeightKg: Number((totMainX * wtMainX).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'IS 456 Cl. 26.5.2 Primary bending reinforcement along short span',
  });

  // Long Span Bottom Reinforcement (B2)
  const spanY = ly + 2 * (supWidthY - cover);
  const countY = Math.ceil(Math.max(lx - 2 * cover, 100) / distSpacing) + 1;
  const resMainY = calculateRebarShape({
    shapeCode: '37',
    dia: distDia,
    dimA: spanY,
    dimB: bendUpHeight,
    steelGrade: grade,
  });
  const totMainY = (resMainY.cutLengthMm * countY) / 1000;
  const wtMainY = getUnitWeight(distDia);

  items.push({
    barMark: 'S-B2-LONG',
    description: `${input.memberTag} Long-Span Rebar (${ly}mm clear span) @ ${distSpacing}mm c/c`,
    shapeCode: '37',
    dia: distDia,
    count: countY,
    dimA: spanY,
    dimB: bendUpHeight,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resMainY.rawLengthMm,
    calculatedCutLength: resMainY.cutLengthMm,
    unitWeight: wtMainY,
    totalLengthM: Number(totMainY.toFixed(2)),
    totalWeightKg: Number((totMainY * wtMainY).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Secondary/Long-span distribution reinforcement',
  });

  // Top Extra Bars over Continuous Supports (Curtailment 0.25L / 0.3L)
  if (input.hasTopExtraAtSupports || type.includes('RESTRAINED') || type.includes('TWO_WAY')) {
    const topExtraLength = Math.round(lx * 0.3) + supWidthX;
    const topExtraCount = Math.ceil(Math.max(ly - 2 * cover, 100) / mainSpacing) + 1;

    const resTopExtra = calculateRebarShape({
      shapeCode: '21',
      dia: mainDia,
      dimA: topExtraLength,
      dimB: bendUpHeight,
      steelGrade: grade,
    });
    const totTopExtra = (resTopExtra.cutLengthMm * topExtraCount) / 1000;
    const wtTopExtra = getUnitWeight(mainDia);

    items.push({
      barMark: 'S-T1-EXTRA',
      description: `${input.memberTag} Top Support Negative Moment Rebar (Curtailment 0.30Lx)`,
      shapeCode: '21',
      dia: mainDia,
      count: topExtraCount,
      dimA: topExtraLength,
      dimB: bendUpHeight,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: resTopExtra.rawLengthMm,
      calculatedCutLength: resTopExtra.cutLengthMm,
      unitWeight: wtTopExtra,
      totalLengthM: Number(totTopExtra.toFixed(2)),
      totalWeightKg: Number((totTopExtra * wtTopExtra).toFixed(2)),
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: 'IS 456 Table 26 Negative moment steel at continuous slab supports',
    });
  }

  // Top Mesh Spacer Chairs (for Flat Slabs / Two-Way Slabs)
  const chairCount = input.topMeshChairCount || (type.includes('FLAT') ? Math.max(Math.ceil((lx * ly) / 2000000), 4) : 0);
  if (chairCount > 0) {
    const cHeight = Math.max(input.thickness - 2 * cover - mainDia - distDia - 10, 60);
    const resChair = calculateRebarShape({
      shapeCode: 'CHAIR',
      dia: 8,
      dimA: 150,
      dimB: cHeight,
      dimC: 100,
      steelGrade: grade,
    });
    const totChair = (resChair.cutLengthMm * chairCount) / 1000;
    const wtChair = getUnitWeight(8);

    items.push({
      barMark: 'S-CHAIR',
      description: `${input.memberTag} Slab Top Mesh Spacer Chairs (Height ${cHeight}mm)`,
      shapeCode: 'CHAIR',
      dia: 8,
      count: chairCount,
      dimA: 150,
      dimB: cHeight,
      dimC: 100,
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
      remarks: 'Spacer chairs to support top negative rebar mesh during concreting',
    });
  }

  return items;
}
