import { calculateRebarShape, getDevelopmentLength, roundUpTo25mm, getUnitWeight } from '../is2502';
import { GeneratedRebarItem } from './footing';

export interface StaircaseInput {
  memberTag: string; // e.g. "STR-1", "DOGLEG-ST1", "OPEN-WELL-1"
  staircaseType?: 'DOGLEGGED' | 'STRAIGHT_FLIGHT' | 'OPEN_WELL' | 'CANTILEVER_STEP';
  subType?: string;
  tread?: number; // mm
  treadLength?: number;
  riser?: number; // mm
  riserHeight?: number;
  numberOfSteps?: number; // count
  stepsCount?: number;
  waistThickness: number; // mm (e.g. 150mm, 175mm)
  flightWidth: number; // mm (e.g. 1200mm)
  landing1Length?: number; // mm (mid landing)
  landing2Length?: number; // mm (upper landing)
  clearCover?: number; // mm (default 20mm)

  // Reinforcement
  mainBarDia?: number; // mm (e.g. 10mm, 12mm)
  mainBarSpacing?: number; // mm c/c (e.g. 125mm, 150mm)
  distBarDia?: number; // mm (e.g. 8mm)
  distBarSpacing?: number; // mm c/c (e.g. 150mm, 175mm)

  // Cantilever Floating Step specific
  cantileverStepLength?: number; // mm (projection from stringer wall)
  cantileverStepRiser?: number;
  cantileverStepTread?: number;

  steelGrade?: string;
  concreteGrade?: string;
}

export function generateStaircaseBBS(input: StaircaseInput): GeneratedRebarItem[] {
  const items: GeneratedRebarItem[] = [];
  const cover = input.clearCover ?? 20;
  const grade = input.steelGrade ?? 'Fe500D';
  const concrete = input.concreteGrade ?? 'M25';
  const type = (input.staircaseType || input.subType || 'DOGLEGGED').toUpperCase();

  const tread = input.treadLength || input.tread || 275;
  const riser = input.riserHeight || input.riser || 150;
  const steps = input.stepsCount || input.numberOfSteps || 10;
  const land1 = input.landing1Length ?? 1200;
  const land2 = input.landing2Length ?? 1200;

  const mainDia = input.mainBarDia || 12;
  const mainSpacing = input.mainBarSpacing || 150;
  const distDia = input.distBarDia || 8;
  const distSpacing = input.distBarSpacing || 175;

  const Ld = getDevelopmentLength(mainDia, concrete, grade);

  // Geometric flight calculations
  const totalTreadLength = steps * tread;
  const totalRiserHeight = (steps + 1) * riser;
  const inclinedFlightLength = Math.round(Math.sqrt(Math.pow(totalTreadLength, 2) + Math.pow(totalRiserHeight, 2)));

  const countMain = Math.ceil(Math.max(input.flightWidth - 2 * cover, 100) / mainSpacing) + 1;

  // 1. Waist Slab Bottom Main Bar (Cross-Over Kink into Top of Mid-Landing)
  // SP:34 / IS 456 Detailing Rule: Lower waist slab bottom rebar CANNOT bend around re-entrant corner;
  // it MUST continue straight into the top zone of landing slab for full development length Ld.
  const resWaistMain = calculateRebarShape({
    shapeCode: '21', // L-Bar
    dia: mainDia,
    dimA: inclinedFlightLength + land1,
    dimB: Ld,
    steelGrade: grade,
  });

  const totWaistMain = (resWaistMain.cutLengthMm * countMain) / 1000;
  const wtWaistMain = getUnitWeight(mainDia);

  items.push({
    barMark: 'STR-M1',
    description: `${input.memberTag} Waist Slab Bottom Main (Inclined Flight ${inclinedFlightLength}mm + Landing ${land1}mm + Ld ${Ld}mm Top Cross-over)`,
    shapeCode: '21',
    dia: mainDia,
    count: countMain,
    dimA: inclinedFlightLength + land1,
    dimB: Ld,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resWaistMain.rawLengthMm,
    calculatedCutLength: resWaistMain.cutLengthMm,
    unitWeight: wtWaistMain,
    totalLengthM: Number(totWaistMain.toFixed(2)),
    totalWeightKg: Number((totWaistMain * wtWaistMain).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'SP:34 Cl. 10.3 Bottom tension steel extended straight into top of landing to prevent corner concrete spalling',
  });

  // 2. Landing Top Reinforcement & Re-entrant Corner Tie-Back (Cross-Over Top Bar)
  const resLandingMain = calculateRebarShape({
    shapeCode: '21',
    dia: mainDia,
    dimA: land2 + Ld,
    dimB: Ld,
    steelGrade: grade,
  });

  const totLandingMain = (resLandingMain.cutLengthMm * countMain) / 1000;
  const wtLandingMain = getUnitWeight(mainDia);

  items.push({
    barMark: 'STR-M2',
    description: `${input.memberTag} Upper Landing Top Main & Corner Anchorage (Landing ${land2}mm + 2xLd ${2 * Ld}mm)`,
    shapeCode: '21',
    dia: mainDia,
    count: countMain,
    dimA: land2 + Ld,
    dimB: Ld,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resLandingMain.rawLengthMm,
    calculatedCutLength: resLandingMain.cutLengthMm,
    unitWeight: wtLandingMain,
    totalLengthM: Number(totLandingMain.toFixed(2)),
    totalWeightKg: Number((totLandingMain * wtLandingMain).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Upper landing negative bending reinforcement tied to flight top mesh',
  });

  // 3. Flight Waist Slab Distribution Bars (Tied under steps)
  const distLength = Math.max(input.flightWidth - 2 * cover, 100);
  const countFlightDist = Math.ceil(inclinedFlightLength / distSpacing) + 1;

  const resFlightDist = calculateRebarShape({
    shapeCode: '20', // Straight Bar
    dia: distDia,
    dimA: distLength,
    steelGrade: grade,
  });

  const totFlightDist = (resFlightDist.cutLengthMm * countFlightDist) / 1000;
  const wtFlightDist = getUnitWeight(distDia);

  items.push({
    barMark: 'STR-D1',
    description: `${input.memberTag} Waist Slab Distribution Bars @ ${distSpacing}mm c/c (${distLength}mm length)`,
    shapeCode: '20',
    dia: distDia,
    count: countFlightDist,
    dimA: distLength,
    dimB: 0,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resFlightDist.rawLengthMm,
    calculatedCutLength: resFlightDist.cutLengthMm,
    unitWeight: wtFlightDist,
    totalLengthM: Number(totFlightDist.toFixed(2)),
    totalWeightKg: Number((totFlightDist * wtFlightDist).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Transverse distribution steel tied along inclined waist slab',
  });

  // 4. Landing Slab Distribution Bars (Mid & Upper Landing)
  const totalLandingDistLength = land1 + land2;
  const countLandingDist = Math.ceil(totalLandingDistLength / distSpacing) + 2;

  const resLandingDist = calculateRebarShape({
    shapeCode: '20',
    dia: distDia,
    dimA: distLength,
    steelGrade: grade,
  });

  const totLandingDist = (resLandingDist.cutLengthMm * countLandingDist) / 1000;
  const wtLandingDist = getUnitWeight(distDia);

  items.push({
    barMark: 'STR-D2',
    description: `${input.memberTag} Landing Slabs Distribution Bars @ ${distSpacing}mm c/c`,
    shapeCode: '20',
    dia: distDia,
    count: countLandingDist,
    dimA: distLength,
    dimB: 0,
    dimC: 0,
    dimD: 0,
    dimE: 0,
    rawCutLength: resLandingDist.rawLengthMm,
    calculatedCutLength: resLandingDist.cutLengthMm,
    unitWeight: wtLandingDist,
    totalLengthM: Number(totLandingDist.toFixed(2)),
    totalWeightKg: Number((totLandingDist * wtLandingDist).toFixed(2)),
    isPayable: true,
    isChair: false,
    isLap: false,
    remarks: 'Landing slab transverse distribution steel tied to bottom and top meshes',
  });

  return items;
}
