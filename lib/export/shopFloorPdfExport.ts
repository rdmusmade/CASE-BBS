import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GeneratedRebarItem } from '../engine/members/footing';
import { STANDARD_BAR_DIAMETERS } from '../engine/is2502';
import { normalizeRebarItem } from './technicalBbsPdfExport';

export interface ShopPdfOptions {
  projectName: string;
  contractorName?: string;
  date?: string;
  siteEngineer?: string;
  notes?: string;
}

/**
 * Generates a shop-floor cut and bend instruction sheet PDF for site bar benders
 */
export function generateShopFloorPdf(
  rawItems: GeneratedRebarItem[],
  options: ShopPdfOptions
): jsPDF {
  const items = (rawItems || []).map(normalizeRebarItem);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [14, 165, 233]; // #0EA5E9
  const darkColor: [number, number, number] = [15, 23, 42]; // #0F172A

  // Page Header
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SMARTBBS PRO - SHOP FLOOR CUT & BEND SHEET', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${options.projectName} | Site Date: ${options.date || new Date().toLocaleDateString('en-IN')}`, 14, 19);
  doc.text('Compliance: IS 2502:1963, IS 456:2000, IS 13920:2016 (Maharashtra PWD Standard)', 14, 24);

  let currentY = 35;

  // Group items by diameter
  const diaGroups = new Map<number, GeneratedRebarItem[]>();
  for (const item of items) {
    const list = diaGroups.get(item.dia) || [];
    list.push(item);
    diaGroups.set(item.dia, list);
  }

  const sortedDias = Array.from(diaGroups.keys()).sort((a, b) => a - b);

  sortedDias.forEach((dia, index) => {
    const diaItems = diaGroups.get(dia)!;
    const totalBarsInDia = diaItems.reduce((acc, i) => acc + i.count, 0);
    const totalLengthInDiaM = diaItems.reduce((acc, i) => acc + (i.count * i.calculatedCutLength) / 1000, 0);
    const totalWeightInDiaKg = diaItems.reduce((acc, i) => acc + (i.count * i.calculatedCutLength * i.unitWeight) / 1000, 0);

    // Section title
    doc.setFillColor(240, 249, 255);
    doc.rect(14, currentY, 182, 8, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(14, currentY, 182, 8, 'D');

    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`BAR DIAMETER: Ø ${dia} mm (TMT/HYSD) — Total: ${totalBarsInDia} nos | ${totalLengthInDiaM.toFixed(1)} R.M. | ${totalWeightInDiaKg.toFixed(1)} kg`, 18, currentY + 5.5);

    currentY += 11;

    const tableRows = diaItems.map((item) => {
      let dims = `A:${item.dimA}`;
      if (item.dimB > 0) dims += `, B:${item.dimB}`;
      if (item.dimC > 0) dims += `, C:${item.dimC}`;
      if (item.dimD > 0) dims += `, D:${item.dimD}`;

      return [
        item.barMark,
        item.description,
        `Shape ${item.shapeCode}`,
        dims,
        `${item.calculatedCutLength} mm`,
        item.count.toString(),
        `${((item.count * item.calculatedCutLength) / 1000).toFixed(1)} m`,
        `${((item.count * item.calculatedCutLength * item.unitWeight) / 1000).toFixed(1)} kg`,
        item.remarks || '',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Mark', 'Member / Component', 'Shape Code', 'Dimensions (mm)', 'Cut Length', 'Qty (Nos)', 'Total Length', 'Weight', 'Bending Notes']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: darkColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold' },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20, fontStyle: 'bold' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 18 },
        7: { cellWidth: 16 },
        8: { cellWidth: 14 },
      },
      didDrawPage: (data) => {
        currentY = data.cursor?.y ? data.cursor.y + 8 : currentY + 20;
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Check for page break if remaining height is low
    if (currentY > 250 && index < sortedDias.length - 1) {
      doc.addPage();
      currentY = 20;
    }
  });

  // Footer & QC Signoff Box
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.rect(14, currentY, 182, 32);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('SITE QUALITY CONTROL & EXECUTION VERIFICATION', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('1. All stirrups/ties must have 135° hooks with minimum 10d tail length as per IS 13920:2016.', 18, currentY + 12);
  doc.text('2. 90° bends have 2d deduction; 45° bends have 1d deduction; cut lengths are rounded up to 25mm per IS 2502.', 18, currentY + 16);
  doc.text('3. Use 1.63mm annealed binding wire. Ensure approved cover blocks (PVC/concrete) are tied securely.', 18, currentY + 20);

  doc.line(18, currentY + 26, 65, currentY + 26);
  doc.text('Bar Bender Foreman', 20, currentY + 30);

  doc.line(75, currentY + 26, 125, currentY + 26);
  doc.text('Site Engineer (Contractor)', 77, currentY + 30);

  doc.line(135, currentY + 26, 190, currentY + 26);
  doc.text('PWD / Structural Consultant', 137, currentY + 30);

  return doc;
}
