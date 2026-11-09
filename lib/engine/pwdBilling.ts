import { getUnitWeight, STANDARD_BAR_DIAMETERS, BarDia } from './is2502';
import { GeneratedRebarItem } from './members/footing';

export interface RollingMarginCheck {
  dia: number;
  theoreticalWeightKgPerM: number;
  actualSampleWeightKgPerM: number;
  deviationPercentage: number;
  toleranceAllowedPercentage: number; // +-2.5% (>16mm), +-3.0% (10-16mm), +-4.0% (<=8mm)
  isCompliant: boolean;
  statusMessage: string;
}

export interface DiameterAbstractRow {
  dia: number;
  unitWeight: number; // kg/m
  totalLengthM: number; // Running meters
  totalWeightKg: number;
  totalWeightMT: number;
  payableLengthM: number;
  payableWeightKg: number;
  payableWeightMT: number;
  nonPayableWeightKg: number;
}

export interface PwdBillingSummary {
  projectTitle: string;
  authority: string; // "MAHARASHTRA_PWD"
  dsrItemCode: string; // "Bd.F.5"
  dsrItemDescription: string;
  totalItemsCount: number;
  diaBreakdown: DiameterAbstractRow[];
  grandTotalLengthM: number;
  grandTotalWeightKg: number;
  grandTotalWeightMT: number;
  grandTotalPayableWeightMT: number;
  grandTotalNonPayableWeightMT: number;
  bindingWireEstimateMinKg: number; // 8 kg/MT
  bindingWireEstimateMaxKg: number; // 10 kg/MT
  rollingMarginAudits: RollingMarginCheck[];
}

/**
 * Returns permissible rolling margin tolerance per IS 1786 / Maharashtra PWD specification:
 * - Up to and including 8mm: +- 4.0%
 * - Over 8mm up to and including 16mm: +- 3.0%
 * - Over 16mm: +- 2.5%
 */
export function getRollingMarginTolerance(dia: number): number {
  if (dia <= 8) return 4.0;
  if (dia <= 16) return 3.0;
  return 2.5;
}

/**
 * Validates actual site sample rolling margin against theoretical weight
 */
export function validateRollingMargin(dia: number, actualSampleWeightKgPerM: number): RollingMarginCheck {
  const theoretical = getUnitWeight(dia);
  const tolerance = getRollingMarginTolerance(dia);
  const diff = actualSampleWeightKgPerM - theoretical;
  const deviation = Number(((diff / theoretical) * 100).toFixed(2));
  const isCompliant = Math.abs(deviation) <= tolerance;

  let statusMessage = '';
  if (isCompliant) {
    statusMessage = `PASS: Deviation ${deviation > 0 ? '+' : ''}${deviation}% is within allowable tolerance (±${tolerance}%)`;
  } else {
    statusMessage = `FLAGGED: Deviation ${deviation > 0 ? '+' : ''}${deviation}% exceeds permissible tolerance of ±${tolerance}%. Potential billing deduction or rejection.`;
  }

  return {
    dia,
    theoreticalWeightKgPerM: theoretical,
    actualSampleWeightKgPerM,
    deviationPercentage: deviation,
    toleranceAllowedPercentage: tolerance,
    isCompliant,
    statusMessage,
  };
}

/**
 * Generates Maharashtra PWD DSR Item Bd.F.5 Billing Abstract & Measurement Summary
 */
export function generatePwdBillingSummary(
  items: GeneratedRebarItem[],
  projectName: string = 'Commercial Infrastructure Project',
  siteSampleWeights?: Record<number, number>
): PwdBillingSummary {
  const diaMap = new Map<number, { totalLen: number; payableLen: number; nonPayableLen: number }>();

  // Initialize standard diameters
  for (const dia of STANDARD_BAR_DIAMETERS) {
    diaMap.set(dia, { totalLen: 0, payableLen: 0, nonPayableLen: 0 });
  }

  let totalItemsCount = 0;

  for (const item of items) {
    totalItemsCount++;
    const current = diaMap.get(item.dia) || { totalLen: 0, payableLen: 0, nonPayableLen: 0 };
    const itemTotalLenM = (item.count * item.calculatedCutLength) / 1000;

    current.totalLen += itemTotalLenM;
    if (item.isPayable) {
      current.payableLen += itemTotalLenM;
    } else {
      current.nonPayableLen += itemTotalLenM;
    }

    diaMap.set(item.dia, current);
  }

  const diaBreakdown: DiameterAbstractRow[] = [];
  let grandTotalLengthM = 0;
  let grandTotalWeightKg = 0;
  let grandTotalPayableWeightKg = 0;
  let grandTotalNonPayableWeightKg = 0;

  for (const dia of STANDARD_BAR_DIAMETERS) {
    const data = diaMap.get(dia)!;
    if (data.totalLen > 0) {
      const uWeight = getUnitWeight(dia);
      const totalWtKg = data.totalLen * uWeight;
      const payableWtKg = data.payableLen * uWeight;
      const nonPayableWtKg = data.nonPayableLen * uWeight;

      diaBreakdown.push({
        dia,
        unitWeight: uWeight,
        totalLengthM: Number(data.totalLen.toFixed(2)),
        totalWeightKg: Number(totalWtKg.toFixed(2)),
        totalWeightMT: Number((totalWtKg / 1000).toFixed(3)),
        payableLengthM: Number(data.payableLen.toFixed(2)),
        payableWeightKg: Number(payableWtKg.toFixed(2)),
        payableWeightMT: Number((payableWtKg / 1000).toFixed(3)),
        nonPayableWeightKg: Number(nonPayableWtKg.toFixed(2)),
      });

      grandTotalLengthM += data.totalLen;
      grandTotalWeightKg += totalWtKg;
      grandTotalPayableWeightKg += payableWtKg;
      grandTotalNonPayableWeightKg += nonPayableWtKg;
    }
  }

  const grandTotalWeightMT = Number((grandTotalWeightKg / 1000).toFixed(3));
  const grandTotalPayableWeightMT = Number((grandTotalPayableWeightKg / 1000).toFixed(3));
  const grandTotalNonPayableWeightMT = Number((grandTotalNonPayableWeightKg / 1000).toFixed(3));

  // Maharashtra PWD Standard: Binding wire 8 kg to 10 kg per MT of steel (strictly excluded from steel item)
  const bindingWireEstimateMinKg = Number((grandTotalPayableWeightMT * 8).toFixed(1));
  const bindingWireEstimateMaxKg = Number((grandTotalPayableWeightMT * 10).toFixed(1));

  // Rolling margin verification
  const rollingMarginAudits: RollingMarginCheck[] = [];
  if (siteSampleWeights) {
    for (const [diaStr, sampleWt] of Object.entries(siteSampleWeights)) {
      const diaNum = Number(diaStr);
      if (sampleWt > 0) {
        rollingMarginAudits.push(validateRollingMargin(diaNum, sampleWt));
      }
    }
  }

  return {
    projectTitle: projectName,
    authority: 'MAHARASHTRA_PWD',
    dsrItemCode: 'Item Bd.F.5 (PWD SSR 2024-2026)',
    dsrItemDescription: 'Providing and fixing in position TMT/HYSD bar reinforcement of various diameters (Fe 500/Fe 500D) for R.C.C. pile caps, footings, columns, beams, slabs, water tanks, retaining walls, including cutting, bending, hooked ends, placing in position and binding with 1.63mm annealed wire (binding wire excluded from payable measurement) as per IS 2502 & IS 456.',
    totalItemsCount,
    diaBreakdown,
    grandTotalLengthM: Number(grandTotalLengthM.toFixed(2)),
    grandTotalWeightKg: Number(grandTotalWeightKg.toFixed(2)),
    grandTotalWeightMT,
    grandTotalPayableWeightMT,
    grandTotalNonPayableWeightMT,
    bindingWireEstimateMinKg,
    bindingWireEstimateMaxKg,
    rollingMarginAudits,
  };
}
