/**
 * IS 2502:1963 & IS 456:2000 Mathematical Execution Engine
 * Indian Standards Bar Bending Schedule (BBS) core formulas and specifications.
 */

export interface SteelGradeSpec {
  grade: 'Fe250' | 'Fe415' | 'Fe500' | 'Fe500D' | 'Fe550' | 'Fe550D';
  kValueSmall: number; // for dia <= 25mm (mandrel factor)
  kValueLarge: number; // for dia > 25mm
}

export const STEEL_GRADES: Record<string, SteelGradeSpec> = {
  Fe250: { grade: 'Fe250', kValueSmall: 2, kValueLarge: 2 },
  Fe415: { grade: 'Fe415', kValueSmall: 4, kValueLarge: 6 },
  Fe500: { grade: 'Fe500', kValueSmall: 4, kValueLarge: 6 },
  Fe500D: { grade: 'Fe500D', kValueSmall: 4, kValueLarge: 6 },
  Fe550: { grade: 'Fe550', kValueSmall: 4, kValueLarge: 6 },
  Fe550D: { grade: 'Fe550D', kValueSmall: 4, kValueLarge: 6 },
};

export const STANDARD_BAR_DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40] as const;
export type BarDia = typeof STANDARD_BAR_DIAMETERS[number];

/**
 * Calculates theoretical unit weight of rebar in kg/m according to IS 456 / IS 2502.
 * Formula: Weight (kg/m) = (dia^2) / 162.2
 */
export function getUnitWeight(dia: number): number {
  if (dia <= 0) return 0;
  const weight = (dia * dia) / 162.2;
  return Number(weight.toFixed(3));
}

/**
 * Returns standard bend deductions per IS 2502:
 * 45° bend deduction = 1 * dia
 * 90° bend deduction = 2 * dia
 * 135° bend deduction = 3 * dia
 * 180° hook deduction = 4 * dia
 */
export function getBendDeduction(angleDeg: 45 | 90 | 135 | 180, dia: number): number {
  switch (angleDeg) {
    case 45:
      return 1 * dia;
    case 90:
      return 2 * dia;
    case 135:
      return 3 * dia;
    case 180:
      return 4 * dia;
    default:
      return 0;
  }
}

/**
 * Mandrel & Hook Allowances (per IS 2502 Table II):
 * Standard 180° U-hook allowance:
 * - 9*dia for Fe 250 (k=2)
 * - 13*dia for HYSD/TMT <= 25mm (k=4)
 * - 17*dia for TMT > 25mm (k=6)
 * Minimum 75mm.
 */
export function getHookAllowance180(dia: number, grade: string = 'Fe500D'): number {
  let allowance = 13 * dia;
  if (grade === 'Fe250') {
    allowance = 9 * dia;
  } else if (dia > 25) {
    allowance = 17 * dia;
  }
  return Math.max(allowance, 75);
}

/**
 * Standard 90° L-bend allowance (IS 2502 Table II):
 * - 5*dia for Fe 250 (k=2)
 * - 6*dia for HYSD/TMT <= 25mm (k=4)
 * - 7*dia for TMT > 25mm (k=6)
 * Minimum 75mm.
 */
export function getBendAllowance90(dia: number, grade: string = 'Fe500D'): number {
  let allowance = 6 * dia;
  if (grade === 'Fe250') {
    allowance = 5 * dia;
  } else if (dia > 25) {
    allowance = 7 * dia;
  }
  return Math.max(allowance, 75);
}

/**
 * Stirrup/Link 135° hook tail length per IS 13920:2016 (Ductile Detailing):
 * Minimum 10*dia for seismic detailing (IS 13920 Cl. 6.2.2 & IS 456 Cl. 26.2.2.4b).
 * Minimum 8*dia for non-seismic (IS 2502 Table II).
 * Absolute minimum 75mm.
 */
export function getStirrupHookTail(dia: number, isSeismic: boolean = true): number {
  const factor = isSeismic ? 10 : 8;
  return Math.max(factor * dia, 75);
}

/**
 * IS 2502 Clause 5.1.1 Rounding Rule:
 * Calculated cut lengths MUST automatically round UP to the next whole 25mm increment.
 */
export function roundUpTo25mm(lengthMm: number): number {
  if (lengthMm <= 0) return 0;
  return Math.ceil(lengthMm / 25) * 25;
}

/**
 * Standard Development Length (Ld) per IS 456 Cl 26.2.1:
 * For Fe500 in M25 concrete: Ld ≈ 45*dia to 50*dia in tension, 36*dia in compression.
 */
export function getDevelopmentLength(dia: number, concreteGrade: string = 'M25', steelGrade: string = 'Fe500D'): number {
  // Common empirical practice factor
  if (steelGrade.includes('500') || steelGrade.includes('550')) {
    if (concreteGrade === 'M20') return 57 * dia;
    if (concreteGrade === 'M25') return 49 * dia;
    if (concreteGrade === 'M30') return 45 * dia;
    if (concreteGrade === 'M35') return 40 * dia;
    return 45 * dia;
  }
  return 40 * dia;
}

export interface ShapeCalculationInput {
  shapeCode: string;
  dia: number;
  count?: number;
  dimA?: number; // mm
  dimB?: number; // mm
  dimC?: number; // mm
  dimD?: number; // mm
  dimE?: number; // mm
  steelGrade?: string;
  isSeismic?: boolean;
  clearCover?: number;
  pitch?: number; // for helical spiral
  turns?: number; // for helical spiral
}

export interface ShapeCalculationResult {
  rawCutLength: number; // mm exact
  rawLengthMm: number; // alias for rawCutLength
  roundedCutLength: number; // mm rounded up to 25mm
  cutLengthMm: number; // alias for roundedCutLength
  unitWeight: number; // kg/m
  totalWeightPerBar: number; // kg
  bendDeductionTotal: number; // mm
  formulaDescription: string;
  shapeName: string;
}

/**
 * Master Shape Calculation Engine for IS 2502 Shape Codes
 */
export function calculateRebarShape(input: ShapeCalculationInput): ShapeCalculationResult {
  const { shapeCode, dia, dimA = 0, dimB = 0, dimC = 0, dimD = 0, dimE = 0, steelGrade = 'Fe500D', isSeismic = true } = input;
  const unitWeight = getUnitWeight(dia);

  let rawCutLength = 0;
  let bendDeductions = 0;
  let formulaDescription = '';
  let shapeName = '';

  const hook180 = getHookAllowance180(dia, steelGrade);
  const bend90 = getBendAllowance90(dia, steelGrade);
  const hookTail135 = getStirrupHookTail(dia, isSeismic);

  switch (shapeCode.toUpperCase()) {
    // Shape 20: Straight Bar
    case '20':
    case 'STRAIGHT':
      rawCutLength = dimA;
      bendDeductions = 0;
      shapeName = 'IS 2502 Shape 20: Straight Bar';
      formulaDescription = `L = A = ${dimA} mm`;
      break;

    // Shape 21: One 90° L-bend (L-bar / Starter bar)
    case '21':
    case 'L_BAR':
      bendDeductions = getBendDeduction(90, dia);
      rawCutLength = dimA + dimB - bendDeductions;
      shapeName = 'IS 2502 Shape 21: L-Bar with 90° Bend';
      formulaDescription = `L = A + B - 2d = ${dimA} + ${dimB} - ${bendDeductions} = ${rawCutLength} mm`;
      break;

    // Shape 22: Bar with standard 180° hook at one end
    case '22':
      rawCutLength = dimA + hook180;
      shapeName = 'IS 2502 Shape 22: Straight with 180° Hook';
      formulaDescription = `L = A + Hook180 = ${dimA} + ${hook180} = ${rawCutLength} mm`;
      break;

    // Shape 37: U-Bar with two 90° bends
    case '37':
    case 'U_BAR':
      bendDeductions = 2 * getBendDeduction(90, dia);
      rawCutLength = dimA + 2 * dimB - bendDeductions;
      shapeName = 'IS 2502 Shape 37: U-Bar (Two 90° Bends)';
      formulaDescription = `L = A + 2B - 4d = ${dimA} + 2(${dimB}) - ${bendDeductions} = ${rawCutLength} mm`;
      break;

    // Shape 38: U-Bar with 180° hooks
    case '38':
      rawCutLength = dimA + 2 * dimB + 2 * hook180 - 2 * getBendDeduction(90, dia);
      shapeName = 'IS 2502 Shape 38: U-Bar with 180° Hooks';
      formulaDescription = `L = A + 2B + 2*Hook - 4d = ${rawCutLength} mm`;
      break;

    // Shape 41: Cranked / Bent-up bar (45° crank)
    case '41':
    case 'CRANK': {
      // 45° crank allowance = +0.42 * D_crank per crank
      const crankDepth = dimC > 0 ? dimC : 100;
      const crankAllowance = 0.42 * crankDepth;
      const totalBendsDeduction = 4 * getBendDeduction(45, dia); // 4 bends of 45°
      rawCutLength = dimA + 2 * dimB + 2 * crankAllowance - totalBendsDeduction;
      bendDeductions = totalBendsDeduction;
      shapeName = 'IS 2502 Shape 41: Cranked Beam/Slab Bar (45° Crank)';
      formulaDescription = `L = A + 2B + 2(0.42*D_crank) - 4(1d) = ${dimA} + 2(${dimB}) + ${Number((2 * crankAllowance).toFixed(1))} - ${totalBendsDeduction} = ${Number(rawCutLength.toFixed(1))} mm`;
      break;
    }

    // Shape 51: Rectangular Column/Beam Stirrup with 135° seismic hooks
    case '51':
    case 'STIRRUP_RECT': {
      // Outer dims A (width) and B (depth)
      // 3 x 90° corner bends (3 * 2d = 6d) and 2 x 135° hook bends (2 * 3d = 6d) -> Total deductions = 12d (or IS standard 2(A+B) + 2*hookTail - 24mm clearance)
      const cornerDeductions = 3 * getBendDeduction(90, dia) + 2 * getBendDeduction(135, dia);
      rawCutLength = 2 * (dimA + dimB) + 2 * hookTail135 - cornerDeductions;
      bendDeductions = cornerDeductions;
      shapeName = 'IS 2502 Shape 51: Rectangular Stirrup / Tie (135° Seismic Hooks)';
      formulaDescription = `L = 2(A+B) + 2*HookTail(135°) - Deductions = 2(${dimA}+${dimB}) + 2(${hookTail135}) - ${cornerDeductions} = ${rawCutLength} mm`;
      break;
    }

    // Shape 61: Circular link / Circular Column tie
    case '61':
    case 'CIRCULAR_LINK': {
      const coreDia = dimA;
      const circumference = Math.PI * coreDia;
      const lapOrHook = Math.max(getDevelopmentLength(dia, 'M25', steelGrade), 2 * hookTail135);
      rawCutLength = circumference + lapOrHook;
      shapeName = 'IS 2502 Shape 61: Circular Tie / Spiral Link';
      formulaDescription = `L = π*D + Lap = π*${coreDia} + ${lapOrHook} = ${Number(rawCutLength.toFixed(1))} mm`;
      break;
    }

    // Shape 71: 4-Leg Stirrup Internal Cross Tie / Cap
    case '71':
    case 'INNER_TIE': {
      bendDeductions = 2 * getBendDeduction(135, dia);
      rawCutLength = dimA + 2 * hookTail135 - bendDeductions;
      shapeName = 'IS 2502 Shape 71: Cross Tie / Internal Link (135° Hooks)';
      formulaDescription = `L = A + 2*HookTail - 2(3d) = ${dimA} + 2(${hookTail135}) - ${bendDeductions} = ${rawCutLength} mm`;
      break;
    }

    // Shape 81: Diamond / Rhombus Tie
    case '81':
    case 'DIAMOND_TIE': {
      const legLength = Math.sqrt(Math.pow(dimA / 2, 2) + Math.pow(dimB / 2, 2));
      const totalPerimeter = 4 * legLength;
      bendDeductions = 3 * getBendDeduction(90, dia) + 2 * getBendDeduction(135, dia);
      rawCutLength = totalPerimeter + 2 * hookTail135 - bendDeductions;
      shapeName = 'IS 2502 Shape 81: Diamond / Internal Column Tie';
      formulaDescription = `L = 4*√( (A/2)² + (B/2)² ) + 2*Hook - Deductions = ${Number(rawCutLength.toFixed(1))} mm`;
      break;
    }

    // Shape 86: Helical Spiral Column Rebar
    case '86':
    case 'SPIRAL': {
      const coreDia = dimA; // mm
      const pitch = input.pitch || dimB || 75; // mm
      const height = dimC || 3000; // mm column clear height
      const turns = input.turns || Math.ceil(height / pitch);
      const circumference = Math.PI * coreDia;
      // Formula: L = N * sqrt((pi*D_core)^2 + P^2) + 2*pi*D_core (anchorage 2 extra turns at top/bottom) + 2*L_tail
      const lengthPerTurn = Math.sqrt(Math.pow(circumference, 2) + Math.pow(pitch, 2));
      const extraAnchorageTurns = 2 * circumference; // 1 extra turn each top & bottom
      rawCutLength = turns * lengthPerTurn + extraAnchorageTurns + 2 * hookTail135;
      shapeName = 'IS 2502 Shape 86: Continuous Helical Spiral';
      formulaDescription = `L = N*√( (πD)² + P² ) + 2πD + 2*Hook = ${turns}*${Number(lengthPerTurn.toFixed(1))} + ${Number(extraAnchorageTurns.toFixed(1))} + ${2 * hookTail135} = ${Number(rawCutLength.toFixed(1))} mm`;
      break;
    }

    // Raft / Slab Spacer Chair Bar
    case 'CHAIR': {
      // Chair: Head (dimA = 200mm default), Height (dimB = leg height), Foot (dimC = 150mm default)
      const head = dimA > 0 ? dimA : 200;
      const height = dimB > 0 ? dimB : 150;
      const foot = dimC > 0 ? dimC : 150;
      bendDeductions = 4 * getBendDeduction(90, dia); // 4 right angle bends
      rawCutLength = head + 2 * height + 2 * foot - bendDeductions;
      shapeName = 'Raft / Mat Foundation Spacer Chair Bar';
      formulaDescription = `L = Head + 2*Height + 2*Foot - 4(2d) = ${head} + 2(${height}) + 2(${foot}) - ${bendDeductions} = ${rawCutLength} mm`;
      break;
    }

    default:
      // Fallback: sum of all provided dimensions minus 90° bends
      rawCutLength = dimA + dimB + dimC + dimD + dimE;
      shapeName = `Custom Rebar (Shape ${shapeCode})`;
      formulaDescription = `L = Sum of leg lengths = ${rawCutLength} mm`;
      break;
  }

  // IS 2502 Cl. 5.1.1: Round UP to next whole 25mm increment
  const roundedCutLength = roundUpTo25mm(rawCutLength);
  const totalWeightPerBar = Number(((roundedCutLength / 1000) * unitWeight).toFixed(3));

  return {
    rawCutLength: Number(rawCutLength.toFixed(1)),
    rawLengthMm: Number(rawCutLength.toFixed(1)),
    roundedCutLength,
    cutLengthMm: roundedCutLength,
    unitWeight,
    totalWeightPerBar,
    bendDeductionTotal: bendDeductions,
    formulaDescription,
    shapeName,
  };
}
