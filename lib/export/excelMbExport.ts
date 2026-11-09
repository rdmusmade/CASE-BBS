import * as XLSX from 'xlsx';
import { GeneratedRebarItem } from '../engine/members/footing';
import { generatePwdBillingSummary, PwdBillingSummary } from '../engine/pwdBilling';
import { STANDARD_BAR_DIAMETERS } from '../engine/is2502';

export interface MbExportOptions {
  projectName: string;
  clientName?: string;
  subDivision?: string;
  contractorName?: string;
  mbNumber?: string;
  pageNumber?: string;
  rccGrade?: string;
  steelGrade?: string;
  authority?: string;
}

/**
 * Generates an audit-ready Maharashtra PWD Measurement Book (MB) .xlsx workbook
 */
export function exportPwdMeasurementBook(
  items: GeneratedRebarItem[],
  options: MbExportOptions
): Uint8Array {
  const wb = XLSX.utils.book_new();
  const summary = generatePwdBillingSummary(items, options.projectName);

  // -------------------------------------------------------------
  // SHEET 1: MEASUREMENT BOOK (MB) SHEET - ITEM Bd.F.5
  // -------------------------------------------------------------
  const mbRows: any[][] = [];

  // Title Block
  mbRows.push(['SMARTBBS PRO — BAR BENDING SCHEDULE & STEEL QUANTITY RECORD']);
  mbRows.push(['TECHNICAL REINFORCEMENT SCHEDULE (IS 2502:1963, IS 456:2000 & IS 13920:2016)']);
  mbRows.push(['']);
  mbRows.push(['Project Name:', options.projectName, '', 'Schedule Ref:', options.mbNumber || 'BBS-2026/01']);
  mbRows.push(['Client Name:', options.clientName || 'Infrastructure Development', '', 'Page No:', options.pageNumber || '1 to ' + Math.ceil(items.length / 25)]);
  mbRows.push(['Contractor / Agency:', options.contractorName || 'Creative Associates', '', 'Standard:', options.authority || 'IS 2502:1963 / IS 456:2000']);
  mbRows.push(['Concrete / Steel Grade:', `${options.rccGrade || 'M25'} / ${options.steelGrade || 'Fe500D'}`, '', 'Detaling:', 'IS 13920 Ductile']);
  mbRows.push(['']);
  mbRows.push([
    'Item Description:',
    'Providing and fixing in position TMT/HYSD bar reinforcement of various diameters for R.C.C. works as per IS 2502 & IS 456.',
  ]);
  mbRows.push(['']);

  // Table Headers
  const headerRow = [
    'Sr. No.',
    'Member Description & Tag',
    'Bar Mark',
    'IS 2502 Shape',
    'Dia (mm)',
    'No. of Members',
    'Bars / Member',
    'Total Nos',
    'Dim A (mm)',
    'Dim B (mm)',
    'Dim C (mm)',
    'Cut Length (m)',
    'Total Length (R.M.)',
    'Unit Wt (kg/m)',
    'Total Wt (kg)',
    'Total Wt (M.T.)',
    'Payable Status',
    'Remarks / IS Reference',
  ];
  mbRows.push(headerRow);

  // Data Rows
  items.forEach((item, index) => {
    const cutLenM = Number((item.calculatedCutLength / 1000).toFixed(3));
    const totalLenM = Number(((item.count * item.calculatedCutLength) / 1000).toFixed(2));
    const totalWtKg = Number((totalLenM * item.unitWeight).toFixed(2));
    const totalWtMt = Number((totalWtKg / 1000).toFixed(3));

    mbRows.push([
      index + 1,
      item.description,
      item.barMark,
      item.shapeCode,
      item.dia,
      1,
      item.count,
      item.count,
      item.dimA,
      item.dimB,
      item.dimC,
      cutLenM,
      totalLenM,
      item.unitWeight,
      totalWtKg,
      totalWtMt,
      item.isPayable ? 'PAYABLE' : 'NON-PAYABLE (SITE NOTE)',
      item.remarks || '-',
    ]);
  });

  // MB Summary totals
  mbRows.push(['']);
  mbRows.push([
    '',
    'GRAND TOTAL (ALL MEMBERS)',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    summary.grandTotalLengthM,
    '',
    summary.grandTotalWeightKg,
    summary.grandTotalWeightMT,
    '',
    '',
  ]);

  const wsMb = XLSX.utils.aoa_to_sheet(mbRows);

  // Set column widths
  wsMb['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 36 }, // Member Description
    { wch: 10 }, // Bar Mark
    { wch: 14 }, // Shape
    { wch: 10 }, // Dia
    { wch: 12 }, // Members
    { wch: 12 }, // Bars/Mem
    { wch: 10 }, // Total Nos
    { wch: 12 }, // Dim A
    { wch: 12 }, // Dim B
    { wch: 12 }, // Dim C
    { wch: 14 }, // Cut Length
    { wch: 18 }, // Total Length
    { wch: 14 }, // Unit Wt
    { wch: 16 }, // Total Wt kg
    { wch: 16 }, // Total Wt MT
    { wch: 18 }, // Payable Status
    { wch: 40 }, // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, wsMb, 'MB Sheet (Bd.F.5)');

  // -------------------------------------------------------------
  // SHEET 2: ABSTRACT OF STEEL (DIAMETER-WISE BREAKDOWN)
  // -------------------------------------------------------------
  const abstractRows: any[][] = [];

  abstractRows.push(['MAHARASHTRA PUBLIC WORKS DEPARTMENT']);
  abstractRows.push(['ABSTRACT OF STEEL QUANTITIES & BILLING SUMMARY (DSR ITEM Bd.F.5)']);
  abstractRows.push(['Project:', options.projectName]);
  abstractRows.push(['']);

  abstractRows.push([
    'Diameter (mm)',
    'Standard Formula (d²/162.2)',
    'Theoretical Unit Wt (kg/m)',
    'Total Length (R.M.)',
    'Total Weight (kg)',
    'Total Weight (M.T.)',
    'Payable Weight (M.T.)',
    'Non-Payable Weight (M.T.)',
    'Tolerance Limit (IS 1786)',
  ]);

  summary.diaBreakdown.forEach((row) => {
    abstractRows.push([
      `${row.dia} mm`,
      `(${row.dia}²)/162.2`,
      row.unitWeight,
      row.totalLengthM,
      row.totalWeightKg,
      row.totalWeightMT,
      row.payableWeightMT,
      Number((row.nonPayableWeightKg / 1000).toFixed(3)),
      row.dia <= 8 ? '± 4.0%' : row.dia <= 16 ? '± 3.0%' : '± 2.5%',
    ]);
  });

  abstractRows.push(['']);
  abstractRows.push([
    'TOTAL NET PAYABLE STEEL (M.T.)',
    '',
    '',
    summary.grandTotalLengthM,
    summary.grandTotalWeightKg,
    summary.grandTotalWeightMT,
    summary.grandTotalPayableWeightMT,
    summary.grandTotalNonPayableWeightMT,
    '',
  ]);

  abstractRows.push(['']);
  abstractRows.push(['SITE ESTIMATE FOR BINDING WIRE (Excluded from steel payment as per PWD specification):']);
  abstractRows.push([
    'Binding Wire Requirement @ 8 to 10 kg/MT:',
    `${summary.bindingWireEstimateMinKg} kg to ${summary.bindingWireEstimateMaxKg} kg (1.63mm annealed wire)`,
  ]);

  abstractRows.push(['']);
  abstractRows.push(['SIGNATURE & CERTIFICATION:']);
  abstractRows.push(['']);
  abstractRows.push(['Checked by: Site Engineer', '', 'Verified by: Junior Engineer (PWD)', '', 'Approved by: Executive Engineer (PWD)']);

  const wsAbstract = XLSX.utils.aoa_to_sheet(abstractRows);
  wsAbstract['!cols'] = [
    { wch: 16 },
    { wch: 26 },
    { wch: 24 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, wsAbstract, 'Abstract of Steel');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
