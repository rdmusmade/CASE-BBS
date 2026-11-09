import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GeneratedRebarItem } from '../engine/members/footing';
import { STANDARD_BAR_DIAMETERS, getUnitWeight } from '../engine/is2502';
import { generatePwdBillingSummary } from '../engine/pwdBilling';

export interface TechnicalPdfOptions {
  pageSize?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
  projectName: string;
  contractorName?: string;
  technicalAgency?: string;
  clientName?: string;
  rccGrade?: string;
  steelGrade?: string;
  mbNumber?: string;
  date?: string;
  notes?: string;
}

/**
 * Generates an Audit-Ready Technical Bar Bending Schedule (BBS) PDF in A4 or A3 format
 */
export function generateTechnicalBbsPdf(
  items: GeneratedRebarItem[],
  options: TechnicalPdfOptions
): jsPDF {
  const pageSize = options.pageSize || 'A4';
  const orientation = options.orientation || (pageSize === 'A3' ? 'landscape' : 'portrait');

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize === 'A3' ? 'a3' : 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [14, 165, 233]; // Sky 500
  const subtextColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // -------------------------------------------------------------
  // 1. FORMAL ENGINEERING TITLE HEADER BLOCK
  // -------------------------------------------------------------
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, pageSize === 'A3' ? 34 : 28, 'F');

  // Decorative blue line
  doc.setFillColor(...accentColor);
  doc.rect(0, pageSize === 'A3' ? 34 : 28, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(pageSize === 'A3' ? 18 : 14);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'SMARTBBS PRO — BAR BENDING SCHEDULE (BBS) & STRUCTURAL STEEL REPORT',
    14,
    pageSize === 'A3' ? 14 : 11
  );

  doc.setFontSize(pageSize === 'A3' ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(
    'Conforming to IS 2502:1963, IS 456:2000, IS 13920:2016 & IS 1786:2008 Standard Specifications',
    14,
    pageSize === 'A3' ? 22 : 18
  );

  // Top Right Meta Badge
  doc.setFontSize(pageSize === 'A3' ? 10 : 8);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Format: ${pageSize} (${orientation.toUpperCase()}) | Date: ${options.date || new Date().toLocaleDateString()}`,
    pageWidth - 14,
    pageSize === 'A3' ? 14 : 11,
    { align: 'right' }
  );

  // -------------------------------------------------------------
  // 2. PROJECT METADATA CARD (4-Column Technical Box)
  // -------------------------------------------------------------
  const metaY = pageSize === 'A3' ? 40 : 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, metaY, pageWidth - 28, pageSize === 'A3' ? 24 : 20, 2, 2, 'FD');

  const colW = (pageWidth - 28) / 4;

  // Col 1: Project & Client
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT NAME:', 18, metaY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.projectName || 'SmartBBS Pro Project', 18, metaY + 10, { maxWidth: colW - 8 });
  doc.setTextColor(71, 85, 105);
  doc.text('CLIENT / DEPT:', 18, metaY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(options.clientName || 'Public Works Department', 18, metaY + 18.5, { maxWidth: colW - 8 });

  // Col 2: Contractor & Technical Agency
  const col2X = 14 + colW;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CONTRACTOR / AGENCY:', col2X, metaY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.contractorName || 'Creative Associates & Builders', col2X, metaY + 10, { maxWidth: colW - 8 });
  doc.setTextColor(71, 85, 105);
  doc.text('TECHNICAL CONSULTANT:', col2X, metaY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(options.technicalAgency || 'Creative Structural Consultants', col2X, metaY + 18.5, { maxWidth: colW - 8 });

  // Col 3: Concrete & Steel Grades
  const col3X = 14 + colW * 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CONCRETE / STEEL GRADE:', col3X, metaY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${options.rccGrade || 'M25'} / ${options.steelGrade || 'Fe500D'}`, col3X, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('PWD BILLING ITEM:', col3X, metaY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text('DSR Item Bd.F.5', col3X, metaY + 18.5);

  // Col 4: Total Payable Steel Summary
  const col4X = 14 + colW * 3;
  const totalWeightKg = items.reduce((acc, i) => acc + (i.isPayable ? i.totalWeightKg : 0), 0);
  const totalMT = (totalWeightKg / 1000).toFixed(3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('TOTAL PAYABLE STEEL:', col4X, metaY + 5);
  doc.setFontSize(pageSize === 'A3' ? 14 : 11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalMT} M.T.`, col4X, metaY + 11);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${totalWeightKg.toFixed(1)} kg net rebar)`, col4X, metaY + 16);

  // -------------------------------------------------------------
  // 3. ITEMIZED BAR BENDING SCHEDULE (BBS) TABLE
  // -------------------------------------------------------------
  const tableStartY = metaY + (pageSize === 'A3' ? 28 : 23);

  const tableHeaders = [
    '#',
    'Mark',
    'Member Description',
    'Shape',
    'Dia Ø',
    'Qty',
    'Dim A\n(mm)',
    'Dim B\n(mm)',
    'Dim C\n(mm)',
    'Cut L\n(mm)',
    'Total L\n(m)',
    'Unit Wt\n(kg/m)',
    'Total Wt\n(kg)',
    'PWD Status',
  ];

  const tableBody = items.map((item, index) => {
    return [
      (index + 1).toString(),
      item.barMark || '-',
      item.description || 'Structural Rebar',
      `Shape ${item.shapeCode}`,
      `Ø${item.dia}`,
      item.count.toString(),
      item.dimA ? item.dimA.toString() : '-',
      item.dimB ? item.dimB.toString() : '-',
      item.dimC ? item.dimC.toString() : '-',
      item.calculatedCutLength.toString(),
      item.totalLengthM.toFixed(2),
      item.unitWeight.toFixed(3),
      item.totalWeightKg.toFixed(2),
      item.isPayable ? 'PAYABLE' : 'NON-PAYABLE',
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: pageSize === 'A3' ? 8.5 : 7,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: pageSize === 'A3' ? 8 : 6.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: pageSize === 'A3' ? 10 : 8 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: pageSize === 'A3' ? 18 : 14 },
      2: { halign: 'left' },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: pageSize === 'A3' ? 22 : 18 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: pageSize === 'A3' ? 16 : 12 },
      5: { halign: 'center', cellWidth: pageSize === 'A3' ? 14 : 10 },
      6: { halign: 'right', cellWidth: pageSize === 'A3' ? 16 : 12 },
      7: { halign: 'right', cellWidth: pageSize === 'A3' ? 16 : 12 },
      8: { halign: 'right', cellWidth: pageSize === 'A3' ? 16 : 12 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: pageSize === 'A3' ? 20 : 15 },
      10: { halign: 'right', cellWidth: pageSize === 'A3' ? 20 : 15 },
      11: { halign: 'right', cellWidth: pageSize === 'A3' ? 20 : 15 },
      12: { halign: 'right', fontStyle: 'bold', cellWidth: pageSize === 'A3' ? 24 : 18 },
      13: { halign: 'center', cellWidth: pageSize === 'A3' ? 22 : 18 },
    },
    margin: { left: 14, right: 14 },
  });

  // -------------------------------------------------------------
  // 4. DIAMETER-WISE STEEL SUMMARY ABSTRACT MATRIX
  // -------------------------------------------------------------
  const lastY = (doc as any).lastAutoTable.finalY + 8;

  // If near bottom of page, add new page for summary
  if (lastY > pageHeight - 75) {
    doc.addPage();
  }

  const summaryStartY = lastY > pageHeight - 75 ? 20 : lastY;

  doc.setFontSize(pageSize === 'A3' ? 12 : 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DIAMETER-WISE STEEL QUANTITY ABSTRACT (IS 2502:1963 / IS 1786)', 14, summaryStartY);

  const summaryHeaders = ['Bar Dia (Ø)', 'Unit Wt (kg/m)', 'Total Length (m)', 'Total Weight (kg)', 'Metric Tonnes (MT)'];
  const summaryBody = STANDARD_BAR_DIAMETERS.map((dia) => {
    const diaItems = items.filter((i) => i.dia === dia && i.isPayable);
    const totLen = diaItems.reduce((acc, i) => acc + i.totalLengthM, 0);
    const totWt = diaItems.reduce((acc, i) => acc + i.totalWeightKg, 0);
    const unitWt = getUnitWeight(dia);
    return [
      `Ø ${dia} mm`,
      unitWt.toFixed(3),
      totLen.toFixed(2),
      totWt.toFixed(2),
      (totWt / 1000).toFixed(3),
    ];
  }).filter((row) => parseFloat(row[3]) > 0);

  // Total summary row
  summaryBody.push([
    'TOTAL REBAR STEEL',
    '-',
    items.reduce((acc, i) => acc + (i.isPayable ? i.totalLengthM : 0), 0).toFixed(2),
    totalWeightKg.toFixed(2),
    totalMT,
  ]);

  // Binding wire separate estimation row
  const bindingWireKg = Number((totalWeightKg * 0.009).toFixed(1)); // 9 kg/MT average
  summaryBody.push([
    'Binding Wire (Excluded from steel bill, 9 kg/MT)',
    '-',
    '-',
    `${bindingWireKg} kg`,
    (bindingWireKg / 1000).toFixed(3),
  ]);

  autoTable(doc, {
    startY: summaryStartY + 4,
    head: [summaryHeaders],
    body: summaryBody,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: pageSize === 'A3' ? 8.5 : 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: pageSize === 'A3' ? 8 : 7,
      textColor: [15, 23, 42],
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // -------------------------------------------------------------
  // 5. OFFICIAL SIGNATURE BLOCKS (Footer on Final Page)
  // -------------------------------------------------------------
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const sigY = Math.min(finalY, pageHeight - 25);

  doc.setDrawColor(148, 163, 184);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(pageSize === 'A3' ? 8.5 : 7);
  doc.setFont('helvetica', 'normal');

  const sigW = (pageWidth - 28) / 4;

  // Sig 1
  doc.line(14, sigY, 14 + sigW - 10, sigY);
  doc.text('Prepared By:', 14, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Site Engineer / Bar Bender', 14, sigY + 8);

  // Sig 2
  const s2 = 14 + sigW;
  doc.setFont('helvetica', 'normal');
  doc.line(s2, sigY, s2 + sigW - 10, sigY);
  doc.text('Checked By:', s2, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Quantity Surveyor / Billing', s2, sigY + 8);

  // Sig 3
  const s3 = 14 + sigW * 2;
  doc.setFont('helvetica', 'normal');
  doc.line(s3, sigY, s3 + sigW - 10, sigY);
  doc.text('Certified By:', s3, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Agency / Consultant', s3, sigY + 8);

  // Sig 4
  const s4 = 14 + sigW * 3;
  doc.setFont('helvetica', 'normal');
  doc.line(s4, sigY, s4 + sigW - 10, sigY);
  doc.text('Approved By:', s4, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Chief Structural Engineer / Client Rep', s4, sigY + 8);

  return doc;
}
