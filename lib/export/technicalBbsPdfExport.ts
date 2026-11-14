import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GeneratedRebarItem } from '../engine/members/footing';
import { STANDARD_BAR_DIAMETERS, getUnitWeight } from '../engine/is2502';

export interface MemberExportData {
  id?: string;
  memberTag: string;
  memberType: string;
  subType?: string;
  concreteGrade?: string;
  steelGrade?: string;
  clearCover?: number;
  dimensionsJson?: any;
  input?: any;
  rebarItems?: GeneratedRebarItem[];
}

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
  members?: MemberExportData[];
}

/**
 * Normalizes any rebar item to ensure all numeric cut lengths, weights, and dimensional fields
 * are safely defined numbers, and sanitizes strings to prevent jsPDF font encoding corruption.
 */
export function normalizeRebarItem(item: any): GeneratedRebarItem {
  if (!item) {
    return {
      barMark: '1',
      description: 'Main Rebar',
      shapeCode: '20',
      dia: 12,
      count: 0,
      dimA: 0,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      dimE: 0,
      rawCutLength: 0,
      calculatedCutLength: 0,
      unitWeight: (12 * 12) / 162.2,
      totalLengthM: 0,
      totalWeightKg: 0,
      isPayable: true,
      isChair: false,
      isLap: false,
      remarks: '',
    };
  }

  const dia = Number(item.dia) || 12;
  const count = Number(item.count) || 0;
  const cutLen = Number(item.calculatedCutLength) || Number(item.rawCutLength) || 0;
  const unitWeight = Number(item.unitWeight) > 0 ? Number(item.unitWeight) : (dia * dia) / 162.2;
  const totalLengthM = item.totalLengthM != null && !isNaN(Number(item.totalLengthM))
    ? Number(item.totalLengthM)
    : (count * cutLen) / 1000;
  const totalWeightKg = item.totalWeightKg != null && !isNaN(Number(item.totalWeightKg))
    ? Number(item.totalWeightKg)
    : totalLengthM * unitWeight;

  // Sanitize text to remove characters unsupported by standard WinAnsi fonts (e.g. ≥, π, non-standard hyphens)
  const sanitizeText = (txt: any): string => {
    if (!txt) return '';
    return String(txt)
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/π/g, 'PI')
      .replace(/–|—/g, '-')
      .replace(/[^\x00-\x7F]/g, ' ')
      .trim();
  };

  return {
    barMark: sanitizeText(item.barMark || '1'),
    description: sanitizeText(item.description || item.remarks || `Bar #${item.barMark || '1'}`),
    shapeCode: sanitizeText(item.shapeCode || '20'),
    dia,
    count,
    dimA: Number(item.dimA) || 0,
    dimB: Number(item.dimB) || 0,
    dimC: Number(item.dimC) || 0,
    dimD: Number(item.dimD) || 0,
    dimE: Number(item.dimE) || 0,
    rawCutLength: Number(item.rawCutLength) || cutLen,
    calculatedCutLength: cutLen,
    unitWeight: Number(unitWeight.toFixed(3)),
    totalLengthM: Number(totalLengthM.toFixed(2)),
    totalWeightKg: Number(totalWeightKg.toFixed(2)),
    isPayable: item.isPayable !== false,
    isChair: Boolean(item.isChair),
    isLap: Boolean(item.isLap),
    remarks: sanitizeText(item.remarks || ''),
  };
}

/**
 * Returns exact, standard IS 2502 / SP 34 cutting formula notations.
 */
function getShapeCutFormula(shapeCode: string): string {
  const code = (shapeCode || '').toUpperCase();
  if (code === '20' || code === 'STRAIGHT') return 'L = A';
  if (code === '21' || code === 'L_BAR') return 'A + B - 2d';
  if (code === '22') return 'A + Hook';
  if (code === '37' || code === 'U_BAR') return 'A + 2B - 4d';
  if (code === '38') return 'A + 2B + 2Hook';
  if (code === '41' || code === 'CRANK') return 'A + 2B + 0.84D - 4d';
  if (code === '51' || code === 'STIRRUP_RECT') return '2(A+B) + 24d';
  if (code === '61') return '2A + 2B + 24d';
  if (code === '71' || code === 'CROSS_TIE') return 'A + 2Hook135';
  if (code === '81' || code === 'DIAMOND') return '4·Diag + 24d';
  if (code === '86' || code === 'SPIRAL') return 'PI · D · n';
  if (code === 'CHAIR') return 'A + 2B + 2C (SP 34)';
  if (code === 'U_PIN') return '2A + B - 2d';
  return 'IS 2502 Table II';
}

/**
 * Scaled Vector CAD Drafting Engine (Pure White MNC Engineering Standard #FFFFFF)
 * Conforming strictly to IS 962:1989, IS 2502:1963, IS 456:2000, IS 13920:2016 & SP 34 Detailing Standards.
 */
function drawMemberSchematicPdf(
  doc: jsPDF,
  category: string,
  subType: string,
  tag: string,
  params: any,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Pure White Card Canvas with Precision Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h, 'FD');

  // Title Strip (Top of CAD Viewport)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(x, y, w, 5.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(x, y + 5.5, x + w, y + 5.5);

  // Blue Indicator Pip
  doc.setFillColor(30, 64, 175);
  doc.rect(x + 2, y + 1.2, 1.8, 3.1, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`DETAIL: ${tag} - ${subType || category} SECTION & REINFORCEMENT DETAILING`, x + 5.5, y + 3.8);

  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('SCALE: N.T.S. - ALL DIMS IN MM - IS 456:2000 / IS 13920:2016 / SP 34', x + w - 3, y + 3.8, { align: 'right' });

  const cx = x + w / 2;
  const cy = y + (h + 5.5) / 2;

  // Standard MNC Drawing Palette (White Canvas High-Contrast Linework)
  const concreteFill: [number, number, number] = [248, 250, 252];
  const concreteStroke: [number, number, number] = [15, 23, 42]; // Slate 900
  const blindingFill: [number, number, number] = [241, 245, 249]; // PCC 1:4:8
  const mainBarNavy: [number, number, number] = [30, 64, 175]; // Bottom / Primary rebar
  const mainBarRed: [number, number, number] = [220, 38, 38]; // Top / Tension rebar
  const stirrupAmber: [number, number, number] = [217, 119, 6]; // Stirrups / Ties / Dowels
  const chairGreen: [number, number, number] = [5, 150, 105]; // 3D Spacer Chairs
  const dimColor: [number, number, number] = [71, 85, 105];

  // Architectural Dimensioning Helpers (45° slash ticks per IS 962)
  const drawArchDimH = (x1: number, x2: number, dy: number, text: string, textAbove: boolean = true) => {
    doc.setDrawColor(...dimColor);
    doc.setLineWidth(0.2);
    doc.line(x1, dy, x2, dy);
    // 45° slash ticks
    doc.line(x1 - 0.7, dy + 0.7, x1 + 0.7, dy - 0.7);
    doc.line(x2 - 0.7, dy + 0.7, x2 + 0.7, dy - 0.7);
    // Extension markers
    doc.line(x1, dy - 1, x1, dy + 1);
    doc.line(x2, dy - 1, x2, dy + 1);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(text, (x1 + x2) / 2, textAbove ? dy - 1 : dy + 2.5, { align: 'center' });
  };

  const drawArchDimV = (dx: number, y1: number, y2: number, text: string, textRight: boolean = true) => {
    doc.setDrawColor(...dimColor);
    doc.setLineWidth(0.2);
    doc.line(dx, y1, dx, y2);
    // 45° slash ticks
    doc.line(dx - 0.7, y1 + 0.7, dx + 0.7, y1 - 0.7);
    doc.line(dx - 0.7, y2 + 0.7, dx + 0.7, y2 - 0.7);
    // Extension markers
    doc.line(dx - 1, y1, dx + 1, y1);
    doc.line(dx - 1, y2, dx + 1, y2);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(text, textRight ? dx + 1.5 : dx - 1.5, (y1 + y2) / 2 + 0.8, { align: textRight ? 'left' : 'right' });
  };

  const drawBarBalloon = (bx: number, by: number, mark: string, tx: number, ty: number, label?: string) => {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.2);
    const midX = bx > tx ? bx - 2 : bx + 2;
    doc.line(tx, ty, midX, by);
    doc.line(midX, by, bx, by);
    doc.setFillColor(15, 23, 42);
    doc.circle(tx, ty, 0.4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.circle(bx, by, 1.8, 'FD');
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(mark, bx, by + 1.2, { align: 'center' });
    if (label) {
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(label, bx > tx ? bx + 2.5 : bx - 2.5, by + 1.2, { align: bx > tx ? 'left' : 'right' });
    }
  };

  const cat = (category || '').toUpperCase();
  const sub = (subType || '').toUpperCase();

  // -------------------------------------------------------------
  // 1. FOUNDATIONS & FOOTINGS
  // -------------------------------------------------------------
  if (cat.includes('FOOT') || cat === 'FOUNDATION') {
    // 1A. SLOPED / TRAPEZOIDAL FOOTING
    if (sub.includes('SLOPED') || sub.includes('TRAPEZOIDAL')) {
      const baseW = Math.min(w * 0.72, 115);
      const baseH = 7.5;
      const topW = baseW * 0.38;
      const slopeH = 14;
      const pedH = 8;

      const xL = cx - baseW / 2;
      const xR = cx + baseW / 2;
      const yBot = cy + 11;
      const yEdge = yBot - baseH;
      const yTopPed = yEdge - slopeH - pedH;

      // 75mm PCC Blinding Layer
      doc.setFillColor(...blindingFill);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.rect(xL, yBot, baseW, 2.5, 'FD');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text('75mm PCC (1:4:8) Blinding', cx, yBot + 1.8, { align: 'center' });

      // Concrete Formwork Outline
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.lines(
        [
          [baseW, 0],
          [0, -baseH],
          [-(baseW - topW) / 2, -slopeH],
          [0, -pedH],
          [-topW, 0],
          [0, pedH],
          [-(baseW - topW) / 2, slopeH],
          [0, baseH],
        ],
        xL,
        yBot,
        [1, 1],
        'FD',
        true
      );

      // Bottom Rebar with L-Bends up into edge depth
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.7);
      doc.line(xL + 3.5, yBot - 5.5, xL + 3.5, yBot - 1.8);
      doc.line(xL + 3.5, yBot - 1.8, xR - 3.5, yBot - 1.8);
      doc.line(xR - 3.5, yBot - 1.8, xR - 3.5, yBot - 5.5);

      // Transverse rebar dots
      doc.setFillColor(126, 34, 206);
      for (let bx = xL + 10; bx <= xR - 10; bx += 9) {
        doc.circle(bx, yBot - 3.2, 0.7, 'F');
      }

      // Column Starter Dowels
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.55);
      doc.line(cx - 7, yTopPed - 4, cx - 7, yBot - 2.5);
      doc.line(cx - 7, yBot - 2.5, cx - 13, yBot - 2.5);
      doc.line(cx + 7, yTopPed - 4, cx + 7, yBot - 2.5);
      doc.line(cx + 7, yBot - 2.5, cx + 13, yBot - 2.5);

      // Dimensions & Annotations
      drawArchDimH(xL, xR, yBot + 4.5, `L = ${params?.length || 2100} mm (Clear Cover: 50mm)`);
      drawArchDimV(xR + 2, yEdge, yBot, `d_edge = ${params?.edgeDepth || 200} mm (min 150 Cl. 34.1.2)`);
      drawArchDimV(xR + 22, yTopPed, yBot, `Total D = ${params?.depth || 600} mm`);

      drawBarBalloon(xL + 10, yBot - 8, '1', xL + 20, yBot - 1.8, `Ø${params?.bottomDiaX || 16}@${params?.bottomSpacingX || 125} c/c (B1)`);
      drawBarBalloon(cx - 16, yTopPed - 2, '3', cx - 7, yTopPed + 1, 'Column Dowels');

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(cx - 38, yBot - 10.5, 76, 3.8, 1, 1, 'F');
      doc.setFontSize(4.8);
      doc.setTextColor(71, 85, 105);
      doc.text('Single bottom tension mesh (Top mesh omitted per IS 456 Cl. 34.1.2)', cx, yBot - 8, { align: 'center' });
    }

    // 1B. STEPPED FOOTING
    else if (sub.includes('STEP')) {
      const lowerW = Math.min(w * 0.72, 115);
      const upperW = lowerW * 0.62;
      const colW = 16;
      const lowerH = 10;
      const upperH = 9;
      const pedH = 8;

      const xL1 = cx - lowerW / 2;
      const xR1 = cx + lowerW / 2;
      const xL2 = cx - upperW / 2;
      const xR2 = cx + upperW / 2;
      const yBot = cy + 11;
      const yMid = yBot - lowerH;
      const yTop = yMid - upperH;

      // 75mm PCC Blinding
      doc.setFillColor(...blindingFill);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.rect(xL1, yBot, lowerW, 2.5, 'FD');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text('75mm PCC (1:4:8) Blinding', cx, yBot + 1.8, { align: 'center' });

      // Lower Step
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(xL1, yMid, lowerW, lowerH, 'FD');

      // Upper Step
      doc.rect(xL2, yTop, upperW, upperH, 'FD');

      // Column Pedestal
      doc.rect(cx - colW / 2, yTop - pedH, colW, pedH, 'FD');

      // Bottom Mesh (Lower Step)
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.7);
      doc.line(xL1 + 3.5, yBot - 5.5, xL1 + 3.5, yBot - 1.8);
      doc.line(xL1 + 3.5, yBot - 1.8, xR1 - 3.5, yBot - 1.8);
      doc.line(xR1 - 3.5, yBot - 1.8, xR1 - 3.5, yBot - 5.5);

      // Upper Step Reinforcement Cage
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.55);
      doc.line(xL2 + 3, yTop + 2, xR2 - 3, yTop + 2);
      doc.line(xL2 + 3, yTop + 2, xL2 + 3, yMid - 1.5);
      doc.line(xR2 - 3, yTop + 2, xR2 - 3, yMid - 1.5);

      // Starter Dowels
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.55);
      doc.line(cx - 5, yTop - pedH - 3, cx - 5, yBot - 2.5);
      doc.line(cx - 5, yBot - 2.5, cx - 11, yBot - 2.5);
      doc.line(cx + 5, yTop - pedH - 3, cx + 5, yBot - 2.5);
      doc.line(cx + 5, yBot - 2.5, cx + 11, yBot - 2.5);

      drawArchDimH(xL1, xR1, yBot + 4.5, `Lower Step L1 = ${params?.length || 2400} mm`);
      drawArchDimH(xL2, xR2, yTop - 2, `Upper Step L2 = ${params?.stepLength2 || 1500} mm`);
      drawArchDimV(xR1 + 2, yMid, yBot, `D1 = ${params?.stepDepth1 || 350} mm`);
      drawArchDimV(xR2 + 2, yTop, yMid, `D2 = ${params?.stepDepth2 || 250} mm`);

      drawBarBalloon(xL1 + 12, yBot - 8, '1', xL1 + 20, yBot - 1.8, `Lower Mesh: Ø${params?.bottomDiaX || 16}@${params?.bottomSpacingX || 125} c/c`);
      drawBarBalloon(xL2 + 8, yTop + 6, '3', xL2 + 15, yTop + 2, 'Upper Step Cage');
    }

    // 1C. STRAP FOOTING (F1 + F2 + STRAP BEAM)
    else if (sub.includes('STRAP')) {
      const f1w = 26;
      const f2w = 32;
      const beamL = 46;
      const startX = cx - (f1w + beamL + f2w) / 2;
      const yBase = cy + 10;

      // PCC Blinding
      doc.setFillColor(...blindingFill);
      doc.setDrawColor(203, 213, 225);
      doc.rect(startX, yBase, f1w, 2, 'FD');
      doc.rect(startX + f1w + beamL, yBase, f2w, 2, 'FD');

      // Footing 1 & 2 Bodies
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, yBase - 15, f1w, 15, 'FD');
      doc.rect(startX + f1w + beamL, yBase - 17, f2w, 17, 'FD');

      // Connecting Strap Beam
      doc.rect(startX + f1w, yBase - 16, beamL, 13, 'FD');

      // Heavy Top Tension Steel (4-T25 Cont.)
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.75);
      doc.line(startX + 3, yBase - 14, startX + f1w + beamL + f2w - 3, yBase - 14);
      doc.line(startX + 3, yBase - 14, startX + 3, yBase - 6);
      doc.line(startX + f1w + beamL + f2w - 3, yBase - 14, startX + f1w + beamL + f2w - 3, yBase - 7);

      // Bottom Nominal Steel
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.5);
      doc.line(startX + f1w + 2, yBase - 4.5, startX + f1w + beamL - 2, yBase - 4.5);

      // Strap Stirrups
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.35);
      for (let sx = startX + f1w + 4; sx <= startX + f1w + beamL - 4; sx += 6) {
        doc.line(sx, yBase - 14, sx, yBase - 4.5);
      }

      // Footing Bottom Meshes
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.6);
      doc.line(startX + 2, yBase - 5, startX + 2, yBase - 2);
      doc.line(startX + 2, yBase - 2, startX + f1w - 2, yBase - 2);
      doc.line(startX + f1w + beamL + 2, yBase - 5, startX + f1w + beamL + 2, yBase - 2);
      doc.line(startX + f1w + beamL + 2, yBase - 2, startX + f1w + beamL + f2w - 2, yBase - 2);

      drawArchDimH(startX, startX + f1w, yBase + 4, `F1: ${params?.f1Length || 1800}mm`);
      drawArchDimH(startX + f1w, startX + f1w + beamL, yBase - 18, `Strap Beam Clear L = ${params?.strapBeamLength || 4000}mm`);
      drawArchDimH(startX + f1w + beamL, startX + f1w + beamL + f2w, yBase + 4, `F2: ${params?.f2Length || 2400}mm`);

      drawBarBalloon(startX + f1w + beamL / 2, yBase - 11, '1', startX + f1w + beamL / 2, yBase - 14, `Top Tension: ${params?.strapTopCount || 4}-T${params?.strapTopDia || 25} Cont.`);
    }

    // 1D. COMBINED FOOTING (2 COLUMNS)
    else if (sub.includes('COMB')) {
      const fW = Math.min(w * 0.74, 118);
      const fH = 18;
      const startX = cx - fW / 2;
      const startY = cy - fH / 2 + 2;

      // PCC Blinding
      doc.setFillColor(...blindingFill);
      doc.setDrawColor(203, 213, 225);
      doc.rect(startX, startY + fH, fW, 2.5, 'FD');

      // Footing Body
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY, fW, fH, 'FD');

      // Column 1 & Column 2
      const c1x = startX + fW * 0.22;
      const c2x = startX + fW * 0.75;
      doc.rect(c1x - 7, startY - 9, 14, 9, 'FD');
      doc.rect(c2x - 7, startY - 9, 14, 9, 'FD');

      // Bottom Mesh
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.65);
      doc.line(startX + 3, startY + fH - 5, startX + 3, startY + fH - 2);
      doc.line(startX + 3, startY + fH - 2, startX + fW - 3, startY + fH - 2);
      doc.line(startX + fW - 3, startY + fH - 2, startX + fW - 3, startY + fH - 5);

      // Top Hogging Steel Between Columns
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.65);
      doc.line(c1x - 10, startY + 2.5, c2x + 10, startY + 2.5);

      drawArchDimH(c1x, c2x, startY - 12, `Column c/c = ${params?.colSpacing || 3500} mm`);
      drawArchDimH(startX, startX + fW, startY + fH + 5, `Total Footing L = ${params?.length || 5600} mm - D = ${params?.depth || 750} mm`);
      drawBarBalloon(cx, startY + 2.5, '2', cx, startY + 2.5, 'Top Hogging Rebar');
    }

    // 1E. PILE FOUNDATION & PILE CAP
    else if (sub.includes('PILE')) {
      const capW = Math.min(w * 0.65, 96);
      const capH = 17;
      const pileDiaW = 14;
      const pileL = 20;
      const startX = cx - capW / 2;
      const startY = cy - capH / 2 - 4;

      // PCC Blinding
      doc.setFillColor(...blindingFill);
      doc.setDrawColor(203, 213, 225);
      doc.rect(startX, startY + capH, capW, 2.5, 'FD');

      // Pile Cap Body
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY, capW, capH, 'FD');

      // Central Column Pedestal
      doc.rect(cx - 9, startY - 9, 18, 9, 'FD');

      // 4 Bored Concrete Piles Extending Downwards
      const p1x = startX + capW * 0.22;
      const p2x = startX + capW * 0.78;
      [p1x, p2x].forEach((px) => {
        // Concrete Pile
        doc.setFillColor(241, 245, 249);
        doc.rect(px - pileDiaW / 2, startY + capH + 2.5, pileDiaW, pileL, 'FD');
        // Vertical Pile Rebar Cage anchored into cap
        doc.setDrawColor(...mainBarNavy);
        doc.setLineWidth(0.6);
        doc.line(px - pileDiaW / 2 + 2, startY + capH + 2.5 + pileL, px - pileDiaW / 2 + 2, startY + 3);
        doc.line(px + pileDiaW / 2 - 2, startY + capH + 2.5 + pileL, px + pileDiaW / 2 - 2, startY + 3);
        // Helical Spiral Lines in Pile
        doc.setDrawColor(...stirrupAmber);
        doc.setLineWidth(0.3);
        for (let py = startY + capH + 5; py <= startY + capH + pileL; py += 3.5) {
          doc.line(px - pileDiaW / 2 + 2, py, px + pileDiaW / 2 - 2, py + 1.5);
        }
      });

      // Pile Cap Heavy Bottom Mat
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.7);
      doc.line(startX + 3, startY + capH - 5.5, startX + 3, startY + capH - 2);
      doc.line(startX + 3, startY + capH - 2, startX + capW - 3, startY + capH - 2);
      doc.line(startX + capW - 3, startY + capH - 2, startX + capW - 3, startY + capH - 5.5);

      drawArchDimH(startX, startX + capW, startY - 11, `Pile Cap: ${params?.pileCapLength || 3000} x ${params?.pileCapWidth || 3000} mm`);
      drawArchDimV(startX + capW + 2, startY, startY + capH, `D = ${params?.depth || 1000} mm`);
      drawArchDimV(p2x + pileDiaW / 2 + 2, startY + capH + 2.5, startY + capH + 2.5 + pileL, 'Piles 15m');

      drawBarBalloon(startX + 14, startY + capH - 8, '1', startX + 22, startY + capH - 2, `Cap Mesh: Ø${params?.bottomDiaX || 25}@${params?.bottomSpacingX || 125} c/c`);
      drawBarBalloon(p1x - 12, startY + capH + 12, '3', p1x - pileDiaW / 2 + 2, startY + capH + 10, 'Pile Cage (IS 2911)');
    }

    // 1F. RAFT / HEAVY MAT FOUNDATION OR STANDARD PAD
    else {
      const fW = Math.min(w * 0.72, 110);
      const fH = 19;
      const startX = cx - fW / 2;
      const startY = cy - fH / 2 + 2;

      // PCC Blinding
      doc.setFillColor(...blindingFill);
      doc.setDrawColor(203, 213, 225);
      doc.rect(startX, startY + fH, fW, 2.5, 'FD');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text('75mm PCC (1:4:8) Blinding', cx, startY + fH + 1.8, { align: 'center' });

      // Concrete Body
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY, fW, fH, 'FD');

      // Central Column Pedestal
      doc.rect(cx - 9, startY - 9, 18, 9, 'FD');

      // Bottom Mesh (Navy)
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.7);
      doc.line(startX + 3, startY + fH - 5.5, startX + 3, startY + fH - 2);
      doc.line(startX + 3, startY + fH - 2, startX + fW - 3, startY + fH - 2);
      doc.line(startX + fW - 3, startY + fH - 2, startX + fW - 3, startY + fH - 5.5);

      // Top Mesh (if Raft)
      if (sub.includes('RAFT') || params?.hasTopMesh) {
        doc.setDrawColor(...mainBarRed);
        doc.line(startX + 3, startY + 5.5, startX + 3, startY + 2);
        doc.line(startX + 3, startY + 2, startX + fW - 3, startY + 2);
        doc.line(startX + fW - 3, startY + 2, startX + fW - 3, startY + 5.5);

        // 3D Spacer Chairs
        doc.setDrawColor(...chairGreen);
        doc.setLineWidth(0.45);
        [-18, 18].forEach((off) => {
          doc.line(cx + off - 3, startY + fH - 2, cx + off - 1.5, startY + fH - 2);
          doc.line(cx + off - 1.5, startY + fH - 2, cx + off - 0.8, startY + 2);
          doc.line(cx + off - 0.8, startY + 2, cx + off + 0.8, startY + 2);
          doc.line(cx + off + 0.8, startY + 2, cx + off + 1.5, startY + fH - 2);
          doc.line(cx + off + 1.5, startY + fH - 2, cx + off + 3, startY + fH - 2);
        });
        doc.setFontSize(4.8);
        doc.setTextColor(5, 150, 105);
        doc.text('3D Spacer Chairs @ 1m Grid', cx, startY + 8, { align: 'center' });
      }

      // Column Dowels
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.55);
      doc.line(cx - 5, startY - 11, cx - 5, startY + fH - 2.5);
      doc.line(cx - 5, startY + fH - 2.5, cx - 11, startY + fH - 2.5);
      doc.line(cx + 5, startY - 11, cx + 5, startY + fH - 2.5);
      doc.line(cx + 5, startY + fH - 2.5, cx + 11, startY + fH - 2.5);

      drawArchDimH(startX, startX + fW, startY + fH + 5, `Length L = ${params?.length || 1800} mm - Width B = ${params?.width || 1800} mm`);
      drawArchDimV(startX + fW + 2, startY, startY + fH, `D = ${params?.depth || 450} mm`);
      drawBarBalloon(startX + 12, startY + fH - 8, '1', startX + 18, startY + fH - 2, `Ø${params?.bottomDiaX || 12}@${params?.bottomSpacingX || 150} c/c`);
    }
  }

  // -------------------------------------------------------------
  // 2. BEAMS & FRAMING (SIMPLY SUPPORTED, CANTILEVER, CONTINUOUS)
  // -------------------------------------------------------------
  else if (cat.includes('BEAM')) {
    // 2A. CANTILEVER BEAM
    if (sub.includes('CANTILEVER')) {
      const colW = 18;
      const colH = 34;
      const beamL = Math.min(w * 0.65, 96);
      const beamD = 17;
      const startX = cx - (colW + beamL) / 2;
      const startY = cy - beamD / 2;

      // Fixed Wall / Support Column on Left with Hatch
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY - 8, colW, colH, 'FD');
      doc.setDrawColor(203, 213, 225);
      for (let hy = startY - 6; hy <= startY + colH - 10; hy += 4) {
        doc.line(startX + 1, hy, startX + colW - 1, hy + 3);
      }

      // Cantilever Beam Body
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX + colW, startY, beamL, beamD, 'FD');

      // Top Tension Bar: Anchored Ld into Support + 90° Downward Bend at Tip
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.7);
      doc.line(startX + 4, startY + 12, startX + 4, startY + 2.5);
      doc.line(startX + 4, startY + 2.5, startX + colW + beamL - 3, startY + 2.5);
      doc.line(startX + colW + beamL - 3, startY + 2.5, startX + colW + beamL - 3, startY + beamD - 3);

      // Bottom Nominal Hanger Bar
      doc.setDrawColor(...chairGreen);
      doc.setLineWidth(0.5);
      doc.line(startX + 4, startY + beamD - 2.5, startX + colW + beamL - 3, startY + beamD - 2.5);

      // Stirrups (Closer spacing near support)
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.35);
      for (let sx = startX + colW + 4; sx <= startX + colW + 36; sx += 6) {
        doc.line(sx, startY + 2.5, sx, startY + beamD - 2.5);
      }
      for (let sx = startX + colW + 44; sx <= startX + colW + beamL - 4; sx += 10) {
        doc.line(sx, startY + 2.5, sx, startY + beamD - 2.5);
      }

      drawArchDimH(startX + colW, startX + colW + beamL, startY + beamD + 4, `Cantilever Clear Span L = ${params?.clearSpan || 2200} mm`);
      drawArchDimH(startX, startX + colW, startY - 10, 'Fixed Support (Ld Anchor)');
      drawArchDimV(startX + colW + beamL + 2, startY, startY + beamD, `D = ${params?.depth || 550} mm`);

      drawBarBalloon(startX + colW + 20, startY - 4, '1', startX + colW + 15, startY + 2.5, `Top Tension: ${params?.topMainCount || 4}-T${params?.topMainDia || 25} (Ld Anchor)`);
      drawBarBalloon(startX + colW + 40, startY + beamD - 1, '2', startX + colW + 45, startY + beamD - 2.5, `Bottom Nominal: 2-T16`);
    }

    // 2B. CONTINUOUS MULTI-SPAN BEAM (2 SPANS OVER 3 COLUMNS)
    else if (sub.includes('CONT') || params?.spans?.length > 1 || params?.span2Length) {
      const colW = 12;
      const span1W = 44;
      const span2W = 40;
      const totalBeamW = colW * 3 + span1W + span2W;
      const beamD = 18;
      const startX = cx - totalBeamW / 2;
      const startY = cy - beamD / 2;

      // 3 Support Columns (Left, Intermediate Pier, Right)
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY - 7, colW, 32, 'FD');
      doc.rect(startX + colW + span1W, startY - 7, colW, 32, 'FD');
      doc.rect(startX + colW * 2 + span1W + span2W, startY - 7, colW, 32, 'FD');

      // Continuous Beam Body
      doc.setFillColor(...concreteFill);
      doc.rect(startX + colW, startY, span1W, beamD, 'FD');
      doc.rect(startX + colW * 2 + span1W, startY, span2W, beamD, 'FD');

      // Continuous Through Top Bar (Navy)
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.55);
      doc.line(startX + 3, startY + 5.5, startX + 3, startY + 2.5);
      doc.line(startX + 3, startY + 2.5, startX + totalBeamW - 3, startY + 2.5);
      doc.line(startX + totalBeamW - 3, startY + 2.5, startX + totalBeamW - 3, startY + 5.5);

      // Intermediate Support Negative Extra Steel (Red, Curtailed at 0.3L)
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.7);
      const pierCenter = startX + colW + span1W + colW / 2;
      doc.line(pierCenter - 18, startY + 4.5, pierCenter + 18, startY + 4.5);

      // Bottom Main Steel (Span 1 & Span 2)
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.65);
      doc.line(startX + 3, startY + beamD - 2.5, startX + colW * 2 + span1W - 2, startY + beamD - 2.5);
      doc.line(startX + colW + span1W + 2, startY + beamD - 2.5, startX + totalBeamW - 3, startY + beamD - 2.5);

      // Stirrup indicators
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.35);
      [startX + colW + 4, startX + colW + 8, startX + colW + span1W - 4, startX + colW * 2 + span1W + 4, startX + totalBeamW - colW - 4].forEach((sx) => {
        doc.line(sx, startY + 2.5, sx, startY + beamD - 2.5);
      });

      drawArchDimH(startX + colW, startX + colW + span1W, startY + beamD + 4.5, `Span 1 L1 = ${params?.clearSpan || 6000} mm`);
      drawArchDimH(startX + colW * 2 + span1W, startX + totalBeamW - colW, startY + beamD + 4.5, `Span 2 L2 = ${params?.span2Length || 5500} mm`);
      drawArchDimV(startX + totalBeamW + 2, startY, startY + beamD, `D = ${params?.depth || 650} mm`);

      drawBarBalloon(pierCenter, startY - 4, '2', pierCenter, startY + 4.5, 'Top Extra @ Support (0.3L)');
      drawBarBalloon(startX + colW + 16, startY + beamD - 1, '3', startX + colW + 20, startY + beamD - 2.5, 'Span 1 Main: 4-T25');
    }

    // 2C. SIMPLY SUPPORTED BEAM
    else {
      const colW = 14;
      const beamL = Math.min(w * 0.72, 105);
      const beamD = 18;
      const startX = cx - (colW * 2 + beamL) / 2;
      const startY = cy - beamD / 2;

      // Left & Right Support Columns
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY - 7, colW, 32, 'FD');
      doc.rect(startX + colW + beamL, startY - 7, colW, 32, 'FD');

      // Beam Body
      doc.setFillColor(...concreteFill);
      doc.rect(startX + colW, startY, beamL, beamD, 'FD');

      // Top Hanger Bars (Navy)
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.55);
      doc.line(startX + 3, startY + 6, startX + 3, startY + 2.5);
      doc.line(startX + 3, startY + 2.5, startX + colW * 2 + beamL - 3, startY + 2.5);
      doc.line(startX + colW * 2 + beamL - 3, startY + 2.5, startX + colW * 2 + beamL - 3, startY + 6);

      // Support Top Extra (0.25L Curtailment)
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.65);
      doc.line(startX + 4, startY + 5.5, startX + colW + beamL * 0.25, startY + 5.5);
      doc.line(startX + colW + beamL - beamL * 0.25, startY + 5.5, startX + colW * 2 + beamL - 4, startY + 5.5);

      // Bottom Main Tension Bars (Red) with 90° Upstands
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.7);
      doc.line(startX + 3, startY + beamD - 6, startX + 3, startY + beamD - 2.5);
      doc.line(startX + 3, startY + beamD - 2.5, startX + colW * 2 + beamL - 3, startY + beamD - 2.5);
      doc.line(startX + colW * 2 + beamL - 3, startY + beamD - 2.5, startX + colW * 2 + beamL - 3, startY + beamD - 6);

      // Stirrup Distribution (Close spacing at supports 2D zone, wider at mid-span per IS 13920)
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.35);
      [-colW - 2, -colW - 6, -colW - 11, colW + 3, colW + 7, colW + 12].forEach((off) => {
        const sx = off < 0 ? startX + colW + beamL + off : startX + colW + off;
        doc.line(sx, startY + 2.5, sx, startY + beamD - 2.5);
      });
      for (let sx = startX + colW + 18; sx <= startX + colW + beamL - 18; sx += 9) {
        doc.line(sx, startY + 2.5, sx, startY + beamD - 2.5);
      }

      drawArchDimH(startX + colW, startX + colW + beamL, startY + beamD + 4.5, `Clear Span L = ${params?.clearSpan || 5000} mm - Width b = ${params?.width || 300} mm`);
      drawArchDimV(startX + colW * 2 + beamL + 2, startY, startY + beamD, `D = ${params?.depth || 600} mm`);

      drawBarBalloon(cx - 24, startY - 3, '1', cx - 20, startY + 2.5, `Top: ${params?.topMainCount || 2}-T${params?.topMainDia || 16}`);
      drawBarBalloon(cx, startY + beamD - 1, '2', cx, startY + beamD - 2.5, `Bottom Main: ${params?.bottomMainCount || 3}-T${params?.bottomMainDia || 25}`);
      drawBarBalloon(startX + colW + 8, startY + 9, '3', startX + colW + 7, startY + 6, '2L-T8 Stirrups (IS 13920)');
    }
  }

  // -------------------------------------------------------------
  // 3. COLUMNS & VERTICAL PEDESTALS (RECTANGULAR & CIRCULAR)
  // -------------------------------------------------------------
  else if (cat.includes('COL')) {
    // 3A. CIRCULAR COLUMN (CIRCULAR CROSS-SECTION + HELICAL SPIRAL ELEVATION)
    if (sub.includes('CIRCULAR') || params?.columnShape === 'CIRCULAR') {
      const radius = 15;
      const circleCenterX = cx - 35;
      const circleCenterY = cy;

      // Circular Concrete Formwork
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.circle(circleCenterX, circleCenterY, radius, 'FD');

      // 40mm Cover Circle
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.circle(circleCenterX, circleCenterY, radius - 2.5);

      // Helical Spiral Ring (Amber)
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.4);
      doc.circle(circleCenterX, circleCenterY, radius - 3.2);

      // 8 Longitudinal Bars distributed at 45° around circle
      doc.setFillColor(...mainBarNavy);
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const bx = circleCenterX + (radius - 3.2) * Math.cos(rad);
        const by = circleCenterY + (radius - 3.2) * Math.sin(rad);
        doc.circle(bx, by, 1.1, 'FD');
      }

      // Column Elevation on Right with Continuous Helical Spiral
      const elX = cx + 22;
      const elW = 20;
      const elH = 34;
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.rect(elX, cy - elH / 2, elW, elH, 'FD');

      // Longitudinal Bars
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.55);
      doc.line(elX + 3, cy - elH / 2, elX + 3, cy + elH / 2 - 2);
      doc.line(elX + 3, cy + elH / 2 - 2, elX - 2, cy + elH / 2 - 2);
      doc.line(elX + elW - 3, cy - elH / 2, elX + elW - 3, cy + elH / 2 - 2);
      doc.line(elX + elW - 3, cy + elH / 2 - 2, elX + elW + 2, cy + elH / 2 - 2);

      // Helical Spiral Winding (Diagonal lines)
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.35);
      for (let sy = cy - elH / 2 + 4; sy <= cy + elH / 2 - 4; sy += 3.8) {
        doc.line(elX + 2, sy, elX + elW - 2, sy + 2);
      }

      drawArchDimH(circleCenterX - radius, circleCenterX + radius, circleCenterY + radius + 4, `Dia D = ${params?.width || 500} mm`);
      drawBarBalloon(circleCenterX, circleCenterY - radius - 3, '1', circleCenterX, circleCenterY - radius + 3.2, `8-T${params?.mainBarDia || 20} Vertical Bars`);
      drawBarBalloon(elX + elW + 6, cy - 6, '2', elX + elW - 2, cy - 6, 'Helical Spiral (75mm Pitch)');
    }

    // 3B. RECTANGULAR COLUMN WITH MIXED CORNER & FACE BARS + DIAMOND TIE
    else {
      const cW = 46;
      const cH = 32;
      const startX = cx - 45;
      const startY = cy - cH / 2;

      // Cross Section Formwork
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.setLineWidth(0.5);
      doc.rect(startX, startY, cW, cH, 'FD');

      // 40mm Clear Cover Line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(startX + 2.5, startY + 2.5, cW - 5, cH - 5);

      // Outer Master Tie (Amber)
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.4);
      doc.rect(startX + 3.2, startY + 3.2, cW - 6.4, cH - 6.4);

      // Inner Diamond Link (IS 13920 Cl. 7.6.2)
      doc.line(startX + cW / 2, startY + 3.2, startX + cW - 3.2, startY + cH / 2);
      doc.line(startX + cW - 3.2, startY + cH / 2, startX + cW / 2, startY + cH - 3.2);
      doc.line(startX + cW / 2, startY + cH - 3.2, startX + 3.2, startY + cH / 2);
      doc.line(startX + 3.2, startY + cH / 2, startX + cW / 2, startY + 3.2);

      // 4 Corner Bars (Red)
      doc.setFillColor(...mainBarRed);
      [
        [startX + 5.2, startY + 5.2],
        [startX + cW - 5.2, startY + 5.2],
        [startX + 5.2, startY + cH - 5.2],
        [startX + cW - 5.2, startY + cH - 5.2],
      ].forEach(([bx, by]) => {
        doc.circle(bx, by, 1.3, 'FD');
      });

      // 4 Face Bars (Navy)
      doc.setFillColor(...mainBarNavy);
      [
        [startX + cW / 2, startY + 4.8],
        [startX + cW / 2, startY + cH - 4.8],
        [startX + 4.8, startY + cH / 2],
        [startX + cW - 4.8, startY + cH / 2],
      ].forEach(([bx, by]) => {
        doc.circle(bx, by, 1.1, 'FD');
      });

      // Column Elevation View on Right
      const elX = cx + 22;
      const elW = 20;
      const elH = 34;
      doc.setFillColor(...concreteFill);
      doc.setDrawColor(...concreteStroke);
      doc.rect(elX, cy - elH / 2, elW, elH, 'FD');

      // Longitudinal Starter Bars into Footing
      doc.setDrawColor(...mainBarRed);
      doc.setLineWidth(0.55);
      doc.line(elX + 3, cy - elH / 2, elX + 3, cy + elH / 2 - 2);
      doc.line(elX + 3, cy + elH / 2 - 2, elX - 2, cy + elH / 2 - 2);
      doc.line(elX + elW - 3, cy - elH / 2, elX + elW - 3, cy + elH / 2 - 2);
      doc.line(elX + elW - 3, cy + elH / 2 - 2, elX + elW + 2, cy + elH / 2 - 2);

      // Confining Ties in Lo Zone & Mid-Height
      doc.setDrawColor(...stirrupAmber);
      doc.setLineWidth(0.35);
      [-14, -11, -8, -3, 2, 7, 10, 13].forEach((off) => {
        doc.line(elX + 1, cy + off, elX + elW - 1, cy + off);
      });

      drawArchDimH(startX, startX + cW, startY + cH + 4, `b = ${params?.width || 400} mm`);
      drawArchDimV(startX - 2, startY, startY + cH, `D = ${params?.depth || 600} mm`, false);

      drawBarBalloon(startX + 8, startY - 4, '1', startX + 5.2, startY + 5.2, `4-T${params?.cornerDia || params?.colCornerDia || 25} Corner`);
      drawBarBalloon(startX + cW - 8, startY - 4, '2', startX + cW / 2, startY + 4.8, `4-T${params?.sideDia || params?.colFaceDia || 20} Face`);
      drawBarBalloon(elX + elW + 6, cy - 8, '3', elX + elW - 1, cy - 8, 'Lo Zone: Ties @ 100 c/c (IS 13920)');
    }
  }

  // -------------------------------------------------------------
  // 4. SLABS & MATS (ONE-WAY, TWO-WAY, DOUBLE JALI)
  // -------------------------------------------------------------
  else if (cat.includes('SLAB')) {
    const sW = Math.min(w * 0.74, 114);
    const sH = 17;
    const startX = cx - sW / 2;
    const startY = cy - sH / 2 + 1;

    // Concrete Slab Formwork
    doc.setFillColor(...concreteFill);
    doc.setDrawColor(...concreteStroke);
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, sW, sH, 'FD');

    // Bottom Main Reinforcement (Red)
    doc.setDrawColor(...mainBarRed);
    doc.setLineWidth(0.65);
    doc.line(startX + 2.5, startY + sH - 2.5, startX + sW - 2.5, startY + sH - 2.5);

    // Distribution Bars (Purple Circles resting on bottom rebar)
    doc.setFillColor(126, 34, 206);
    for (let bx = startX + 8; bx <= startX + sW - 8; bx += 10) {
      doc.circle(bx, startY + sH - 4.5, 0.7, 'F');
    }

    // Top Reinforcement (Double Jali or Support Curtailment)
    if (sub.includes('DOUBLE') || cat === 'DOUBLE_JALI') {
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.65);
      doc.line(startX + 2.5, startY + 2.5, startX + sW - 2.5, startY + 2.5);

      // 3D Spacer Chairs
      doc.setDrawColor(...chairGreen);
      doc.setLineWidth(0.45);
      [-22, 22].forEach((off) => {
        doc.line(cx + off - 3, startY + sH - 2.5, cx + off - 1.5, startY + sH - 2.5);
        doc.line(cx + off - 1.5, startY + sH - 2.5, cx + off - 0.8, startY + 2.5);
        doc.line(cx + off - 0.8, startY + 2.5, cx + off + 0.8, startY + 2.5);
        doc.line(cx + off + 0.8, startY + 2.5, cx + off + 1.5, startY + sH - 2.5);
        doc.line(cx + off + 1.5, startY + sH - 2.5, cx + off + 3, startY + sH - 2.5);
      });
      doc.setFontSize(4.8);
      doc.setTextColor(5, 150, 105);
      doc.text('Double Jali: 3D Spacer Chairs @ 1m Grid', cx, startY + 8.5, { align: 'center' });
    } else {
      // Top Negative Reinforcement over Supports (0.25L - 0.30L Curtailment)
      doc.setDrawColor(...mainBarNavy);
      doc.setLineWidth(0.55);
      doc.line(startX + 2.5, startY + 3, startX + sW * 0.28, startY + 3);
      doc.line(startX + sW - sW * 0.28, startY + 3, startX + sW - 2.5, startY + 3);
    }

    drawArchDimH(startX, startX + sW, startY + sH + 4.5, `Span Lx = ${params?.shortSpanLx || 3800} mm - Ly = ${params?.longSpanLy || 4800} mm`);
    drawArchDimV(startX + sW + 2, startY, startY + sH, `Thk = ${params?.thickness || 150} mm`);

    drawBarBalloon(startX + 18, startY - 4, '1', startX + 12, startY + sH - 2.5, `Main: Ø${params?.shortMainDia || params?.slabMainDia || 10}@${params?.shortMainSpacing || params?.slabMainSpacing || 150} c/c`);
    drawBarBalloon(startX + 40, startY + sH - 8, '2', startX + 38, startY + sH - 4.5, `Dist: Ø${params?.longMainDia || params?.slabDistDia || 8}@${params?.longMainSpacing || params?.slabDistSpacing || 175} c/c`);
  }

  // -------------------------------------------------------------
  // 5. RCC PARDI / SHEAR & CORE WALLS
  // -------------------------------------------------------------
  else if (cat.includes('PARDI') || cat.includes('WALL') || cat.includes('SHEAR')) {
    const wallW = Math.min(w * 0.72, 110);
    const wallH = 22;
    const startX = cx - wallW / 2;
    const startY = cy - wallH / 2;

    // Concrete Wall Body
    doc.setFillColor(...concreteFill);
    doc.setDrawColor(...concreteStroke);
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, wallW, wallH, 'FD');

    // Dual Face Vertical Curtains (Outer Red, Inner Navy)
    doc.setDrawColor(...mainBarRed);
    doc.setLineWidth(0.65);
    doc.line(startX + 3.5, startY + 2.5, startX + wallW - 3.5, startY + 2.5);

    doc.setDrawColor(...mainBarNavy);
    doc.setLineWidth(0.65);
    doc.line(startX + 3.5, startY + wallH - 2.5, startX + wallW - 3.5, startY + wallH - 2.5);

    // End U-Pins closing both ends (IS 13920 Cl. 9.4)
    doc.setDrawColor(...stirrupAmber);
    doc.setLineWidth(0.5);
    doc.line(startX + 7, startY + 2.5, startX + 2, startY + 2.5);
    doc.line(startX + 2, startY + 2.5, startX + 2, startY + wallH - 2.5);
    doc.line(startX + 2, startY + wallH - 2.5, startX + 7, startY + wallH - 2.5);

    doc.line(startX + wallW - 7, startY + 2.5, startX + wallW - 2, startY + 2.5);
    doc.line(startX + wallW - 2, startY + 2.5, startX + wallW - 2, startY + wallH - 2.5);
    doc.line(startX + wallW - 2, startY + wallH - 2.5, startX + wallW - 7, startY + wallH - 2.5);

    // Cross-ties connecting dual faces
    doc.setLineWidth(0.35);
    for (let sx = startX + 16; sx <= startX + wallW - 16; sx += 14) {
      doc.line(sx, startY + 2.5, sx, startY + wallH - 2.5);
    }

    drawArchDimH(startX, startX + wallW, startY + wallH + 4.5, `Running Length L = ${params?.length || 4000} mm - Height H = ${params?.height || 3300} mm`);
    drawArchDimV(startX + wallW + 2, startY, startY + wallH, `T = ${params?.thickness || 230} mm`);

    drawBarBalloon(cx - 20, startY - 4, '1', cx - 20, startY + 2.5, `Vertical: Ø${params?.vertMainDia || 12}@${params?.vertMainSpacing || 150} (Dual Face)`);
    drawBarBalloon(cx + 20, startY + wallH - 1, '3', startX + 2, startY + wallH / 2, 'Boundary U-Pins (IS 13920)');
  }

  // -------------------------------------------------------------
  // 6. PLAIN PCC WITH MESH REINFORCEMENT
  // -------------------------------------------------------------
  else if (cat.includes('PCC') || cat.includes('GRADE_SLAB') || cat.includes('FLOOR')) {
    const pccW = Math.min(w * 0.74, 115);
    const pccH = 14;
    const startX = cx - pccW / 2;
    const startY = cy - pccH / 2;

    // Compacted Subgrade Soling Hatch at Bottom
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(startX, startY + pccH, pccW, 3, 'FD');
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Compacted Boulder Soling & Sand Cushion Sub-Base', cx, startY + pccH + 2.2, { align: 'center' });

    // Concrete PCC Slab
    doc.setFillColor(...concreteFill);
    doc.setDrawColor(...concreteStroke);
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, pccW, pccH, 'FD');

    // Single Layer Anti-Crack Welded Wire Mesh (Navy) with 30mm Cover Blocks
    doc.setDrawColor(...mainBarNavy);
    doc.setLineWidth(0.65);
    doc.line(startX + 3, startY + pccH - 5, startX + pccW - 3, startY + pccH - 5);

    // 30mm Spacer blocks supporting mesh
    doc.setFillColor(100, 116, 139);
    for (let bx = startX + 12; bx <= startX + pccW - 12; bx += 22) {
      doc.rect(bx - 1.5, startY + pccH - 4.5, 3, 2.5, 'FD');
    }

    drawArchDimH(startX, startX + pccW, startY + pccH + 5.5, `PCC Floor Bay: ${params?.length || 8000} x ${params?.width || 6000} mm`);
    drawArchDimV(startX + pccW + 2, startY, startY + pccH, `Thk = ${params?.thickness || 100} mm`);

    drawBarBalloon(cx, startY - 4, '1', cx, startY + pccH - 5, `Anti-Crack Mesh: Ø${params?.meshDiaX || 8}@${params?.meshSpacingX || 150} c/c`);
  }

  // -------------------------------------------------------------
  // 7. STAIRCASE WAIST SLABS & LANDINGS
  // -------------------------------------------------------------
  else if (cat.includes('STAIR')) {
    const land1W = 28;
    const flightW = 54;
    const land2W = 28;
    const totalW = land1W + flightW + land2W;
    const startX = cx - totalW / 2;
    const yLand1 = cy + 9;
    const yLand2 = cy - 9;
    const waistThk = 10;

    // Lower Landing Slab
    doc.setFillColor(...concreteFill);
    doc.setDrawColor(...concreteStroke);
    doc.setLineWidth(0.5);
    doc.rect(startX, yLand1 - waistThk, land1W, waistThk, 'FD');

    // Upper Landing Slab
    doc.rect(startX + land1W + flightW, yLand2 - waistThk, land2W, waistThk, 'FD');

    // Inclined Waist Slab Flight Body
    doc.line(startX + land1W, yLand1, startX + land1W + flightW, yLand2);
    doc.line(startX + land1W, yLand1 - waistThk, startX + land1W + flightW, yLand2 - waistThk);

    // Stepped Sawtooth Profile on Flight (Treads & Risers)
    const steps = 6;
    const stepDx = flightW / steps;
    const stepDy = (yLand1 - waistThk - (yLand2 - waistThk)) / steps;
    let currX = startX + land1W;
    let currY = yLand1 - waistThk;
    doc.setDrawColor(...concreteStroke);
    for (let s = 0; s < steps; s++) {
      doc.line(currX, currY, currX, currY - stepDy);
      doc.line(currX, currY - stepDy, currX + stepDx, currY - stepDy);
      currX += stepDx;
      currY -= stepDy;
    }

    // SP 34 Cl. 10.3 Re-entrant Corner Cross-Over Detailing:
    // Waist bottom tension steel extends STRAIGHT into TOP of landing
    doc.setDrawColor(...mainBarRed);
    doc.setLineWidth(0.7);
    doc.line(startX + 4, yLand1 - 2.5, startX + land1W + 16, yLand1 - 2.5); // Landing bottom
    doc.line(startX + land1W - 8, yLand1 - 2.5, startX + land1W + flightW + 14, yLand2 - waistThk + 2.5); // Cross-over top extension

    // Upper Landing top bar tying back
    doc.setDrawColor(...mainBarNavy);
    doc.setLineWidth(0.6);
    doc.line(startX + land1W + flightW - 14, yLand2 - 2.5, startX + totalW - 4, yLand2 - 2.5);

    drawArchDimH(startX, startX + land1W, yLand1 + 4, `Landing 1 = ${params?.landing1Length || 1200} mm`);
    drawArchDimH(startX + land1W, startX + land1W + flightW, yLand1 + 4, `Flight (Tread 275 / Riser 150)`);
    drawArchDimH(startX + land1W + flightW, startX + totalW, yLand2 - waistThk - 3, `Landing 2 = ${params?.landing2Length || 1200} mm`);

    drawBarBalloon(startX + land1W + 8, yLand1 - 7, '1', startX + land1W + 4, yLand1 - 2.5, 'SP 34 Cl. 10.3 Cross-Over Detail');
  }

  // -------------------------------------------------------------
  // 8. LIQUID STORAGE TANKS & RETAINING WALLS (IS 3370)
  // -------------------------------------------------------------
  else if (cat.includes('WATER') || cat.includes('TANK')) {
    const wallThk = 18;
    const wallH = 34;
    const baseW = 55;
    const baseH = 8;
    const wallX = cx - 12;
    const baseY = cy + 12;

    // Base Raft Foundation Slab
    doc.setFillColor(...concreteFill);
    doc.setDrawColor(...concreteStroke);
    doc.setLineWidth(0.5);
    doc.rect(wallX - 22, baseY, baseW, baseH, 'FD');

    // Retaining Wall Body
    doc.rect(wallX, baseY - wallH, wallThk, wallH, 'FD');

    // Water Face on Left Indicator
    doc.setFillColor(224, 242, 254);
    doc.rect(wallX - 22, baseY - wallH + 4, 20, wallH - 4, 'F');
    doc.setFontSize(5);
    doc.setTextColor(2, 132, 199);
    doc.text('LIQUID / WATER FACE', wallX - 12, baseY - wallH / 2, { align: 'center', angle: 90 });

    // Water Face Main Vertical Rebar (Red, 40mm cover per IS 3370 Cl. 8.2)
    doc.setDrawColor(...mainBarRed);
    doc.setLineWidth(0.7);
    doc.line(wallX + 3, baseY - wallH + 4, wallX + 3, baseY + baseH - 2.5);
    doc.line(wallX + 3, baseY + baseH - 2.5, wallX - 18, baseY + baseH - 2.5); // Base foot anchor

    // Outer Face Vertical Rebar (Navy, 30mm cover)
    doc.setDrawColor(...mainBarNavy);
    doc.setLineWidth(0.6);
    doc.line(wallX + wallThk - 3, baseY - wallH + 4, wallX + wallThk - 3, baseY + baseH - 2.5);
    doc.line(wallX + wallThk - 3, baseY + baseH - 2.5, wallX + wallThk + 12, baseY + baseH - 2.5);

    // Horizontal Hoop Bars (Circles)
    doc.setFillColor(217, 119, 6);
    for (let hy = baseY - wallH + 8; hy <= baseY - 4; hy += 6) {
      doc.circle(wallX + 4.5, hy, 0.6, 'F');
      doc.circle(wallX + wallThk - 4.5, hy, 0.6, 'F');
    }

    drawArchDimV(wallX + wallThk + 4, baseY - wallH, baseY, `Wall H = ${params?.wallHeight || 3500} mm`);
    drawArchDimH(wallX, wallX + wallThk, baseY - wallH - 3, `T = ${params?.wallThickness || 300} mm`);

    drawBarBalloon(wallX - 4, baseY - wallH + 12, '1', wallX + 3, baseY - wallH + 12, 'Water Face: Ø16@125 (40mm Cover)');
    drawBarBalloon(wallX + wallThk + 14, baseY - 12, '2', wallX + wallThk - 3, baseY - 12, 'Outer Face: Ø12@150');
  }

  // -------------------------------------------------------------
  // 9. DEFAULT / FALLBACK DETAILED SECTION
  // -------------------------------------------------------------
  else {
    const fW = Math.min(w * 0.72, 110);
    const fH = 20;
    const startX = cx - fW / 2;
    const startY = cy - fH / 2;

    doc.setFillColor(...concreteFill);
    doc.setDrawColor(...concreteStroke);
    doc.setLineWidth(0.5);
    doc.rect(startX, startY, fW, fH, 'FD');

    doc.setDrawColor(...mainBarRed);
    doc.setLineWidth(0.65);
    doc.line(startX + 3, startY + 3, startX + fW - 3, startY + 3);
    doc.setDrawColor(...mainBarNavy);
    doc.line(startX + 3, startY + fH - 3, startX + fW - 3, startY + fH - 3);

    doc.setDrawColor(...stirrupAmber);
    doc.setLineWidth(0.35);
    for (let sx = startX + 15; sx <= startX + fW - 15; sx += 18) {
      doc.line(sx, startY + 3, sx, startY + fH - 3);
    }

    drawArchDimH(startX, startX + fW, startY + fH + 4.5, `${category} - Length L = ${params?.length || 3500} mm`);
    drawArchDimV(startX + fW + 2, startY, startY + fH, `Thk = ${params?.thickness || 200} mm`);
    drawBarBalloon(cx, startY - 4, '1', cx, startY + 3, `${category} Reinforcement Grid`);
  }
}

/**
 * Generates an Audit-Ready Technical Bar Bending Schedule (BBS) PDF organized Member Category-Wise
 * Conforming strictly to IS 2502:1963, IS 456:2000, IS 13920:2016, IS 3370:2021 & SP 34 Detailing Standards.
 */
export function generateTechnicalBbsPdf(
  rawItems: GeneratedRebarItem[],
  options: TechnicalPdfOptions
): jsPDF {
  const items = (rawItems || []).map(normalizeRebarItem);
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

  // -------------------------------------------------------------
  // 1. FORMAL ENGINEERING TITLE HEADER BLOCK (NON-OVERLAPPING)
  // -------------------------------------------------------------
  const headerHeight = pageSize === 'A3' ? 28 : 24;
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Decorative cyan stripe
  doc.setFillColor(...accentColor);
  doc.rect(0, headerHeight, pageWidth, 1.2, 'F');

  // Main Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(pageSize === 'A3' ? 14 : 10.5);
  doc.setFont('helvetica', 'bold');
  const mainTitle = pageSize === 'A3'
    ? 'SMARTBBS PRO - AUDIT-READY TECHNICAL BAR BENDING SCHEDULE (BBS)'
    : 'SMARTBBS PRO - TECHNICAL BAR BENDING SCHEDULE (BBS)';
  doc.text(mainTitle, 14, pageSize === 'A3' ? 12 : 10);

  // Subtitle
  doc.setFontSize(pageSize === 'A3' ? 8 : 6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Conforming to IS 2502:1963, IS 456:2000, IS 13920:2016, IS 3370:2021 & SP 34 Detailing Standards',
    14,
    pageSize === 'A3' ? 19 : 16
  );

  // Meta Badge (Right-Aligned, Non-Overlapping)
  doc.setFontSize(pageSize === 'A3' ? 8 : 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Page Size: ${pageSize} - Date: ${options.date || new Date().toLocaleDateString()}`,
    pageWidth - 14,
    pageSize === 'A3' ? 12 : 10,
    { align: 'right' }
  );

  // -------------------------------------------------------------
  // 2. PROJECT METADATA CARD (RESPONSIVE NON-OVERLAPPING GRID)
  // -------------------------------------------------------------
  const metaY = headerHeight + 5;
  const metaH = pageSize === 'A3' ? 24 : 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, metaY, pageWidth - 28, metaH, 2, 2, 'FD');

  const colW = (pageWidth - 28) / 4;

  // Clean strings
  const clampStr = (s: string, len: number) => (s && s.length > len ? s.substring(0, len - 3) + '...' : s);
  const projName = clampStr(options.projectName || 'SmartBBS Pro Project', pageSize === 'A3' ? 70 : 38);
  const clientName = clampStr(options.clientName || 'Maharashtra Public Works Department', pageSize === 'A3' ? 70 : 38);
  const contractorName = clampStr(options.contractorName || 'Creative Associate LLP', pageSize === 'A3' ? 60 : 35);
  const consultantName = clampStr(options.technicalAgency || 'Creative Structural Consultants', pageSize === 'A3' ? 60 : 35);

  // Col 1: Project & Client
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(pageSize === 'A3' ? 7 : 6);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT NAME:', 18, metaY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(projName, 18, metaY + 8.5, { maxWidth: colW - 6 });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT / AUTHORITY:', 18, metaY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, 18, metaY + 20, { maxWidth: colW - 6 });

  // Col 2: Contractor & Consultant
  const col2X = 14 + colW;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRACTOR / EXECUTING AGENCY:', col2X, metaY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(contractorName, col2X, metaY + 8.5, { maxWidth: colW - 6 });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('STRUCTURAL CONSULTANT:', col2X, metaY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(consultantName, col2X, metaY + 20, { maxWidth: colW - 6 });

  // Col 3: Design Grades & Bill Item
  const col3X = 14 + colW * 2;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('DESIGN GRADES:', col3X, metaY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${options.rccGrade || 'M30'} / ${options.steelGrade || 'Fe500D'}`, col3X, metaY + 8.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('MB / BILL ITEM:', col3X, metaY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(options.mbNumber || 'MB-2026/PWD-042', col3X, metaY + 20);

  // Col 4: Total Payable Steel Summary
  const col4X = 14 + colW * 3;
  const totalWeightKg = items.reduce((acc, i) => acc + (i.isPayable ? (Number(i.totalWeightKg) || 0) : 0), 0);
  const totalMT = (totalWeightKg / 1000).toFixed(3);
  doc.setTextColor(14, 165, 233);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAYABLE STEEL:', col4X, metaY + 4.5);
  doc.setFontSize(pageSize === 'A3' ? 13 : 10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalMT} M.T.`, col4X, metaY + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${totalWeightKg.toFixed(1)} kg net payable rebar)`, col4X, metaY + 16);

  let currentY = metaY + metaH + 6;

  // -------------------------------------------------------------
  // 3. GROUP ITEMS BY MEMBER CATEGORY & MEMBER
  // -------------------------------------------------------------
  const membersList: MemberExportData[] = (options.members && options.members.length > 0
    ? options.members
    : Array.from(new Set(items.map((i) => (i.barMark.includes('-') ? i.barMark.split('-')[0] : 'MBR-01')))).map((tag) => {
        const memberItems = items.filter((i) => i.barMark.startsWith(tag));
        let type = 'BEAM';
        if (tag.startsWith('FTG') || tag.startsWith('F')) type = 'FOOTING';
        else if (tag.startsWith('COL') || tag.startsWith('C')) type = 'COLUMN';
        else if (tag.startsWith('SLB') || tag.startsWith('S')) type = 'SLAB';
        else if (tag.startsWith('SW') || tag.startsWith('PARDI')) type = 'RCC_PARDI';
        else if (tag.startsWith('PCC')) type = 'PLAIN_PCC_MESH';
        else if (tag.startsWith('STR')) type = 'STAIRCASE';
        else if (tag.startsWith('WT') || tag.startsWith('UGWT')) type = 'WATER_TANK';
        return {
          memberTag: tag,
          memberType: type,
          subType: type,
          rebarItems: memberItems,
        };
      })
  ).map((m) => {
    const rawRebars = m.rebarItems && m.rebarItems.length > 0
      ? m.rebarItems
      : items.filter((i) => i.barMark.startsWith(m.memberTag));
    return {
      ...m,
      rebarItems: (rawRebars || []).map(normalizeRebarItem),
    };
  });

  const categoryOrder = ['FOOTING', 'COLUMN', 'BEAM', 'SLAB', 'RCC_PARDI', 'PLAIN_PCC_MESH', 'STAIRCASE', 'WATER_TANK'];
  const categoryLabels: Record<string, string> = {
    FOOTING: '1. FOUNDATIONS & FOOTINGS (IS 456 Cl. 34)',
    COLUMN: '2. COLUMNS & VERTICAL PEDESTALS (IS 13920)',
    BEAM: '3. BEAMS & HORIZONTAL FRAMING (IS 13920)',
    SLAB: '4. TWO-WAY / ONE-WAY SLABS & MATS (IS 456 Cl. 26)',
    RCC_PARDI: '5. RCC PARDI / SHEAR & CORE WALLS',
    PLAIN_PCC_MESH: '6. PLAIN PCC WITH MESH REINFORCEMENT',
    STAIRCASE: '7. STAIRCASE WAIST SLABS & LANDINGS',
    WATER_TANK: '8. LIQUID STORAGE TANKS & RETAINING WALLS (IS 3370)',
  };

  categoryOrder.forEach((catKey) => {
    const catMembers = membersList.filter((m) => (m.memberType || '').toUpperCase() === catKey);
    if (catMembers.length === 0) return;

    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 16;
    }

    // Category Header Banner
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(14, currentY, pageWidth - 28, 7, 1.5, 1.5, 'F');
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(categoryLabels[catKey] || catKey, 18, currentY + 4.8);
    currentY += 9;

    catMembers.forEach((member) => {
      const memberRebars = (member.rebarItems || []).map(normalizeRebarItem);
      if (memberRebars.length === 0) return;

      const memberWeightKg = memberRebars.reduce(
        (acc, i) => acc + (i.isPayable ? (Number(i.totalWeightKg) || 0) : 0),
        0
      );
      let params: any = {};
      try {
        params = typeof member.dimensionsJson === 'string'
          ? JSON.parse(member.dimensionsJson)
          : member.dimensionsJson || member.input || {};
      } catch (e) {
        params = member.input || {};
      }

      if (currentY > pageHeight - 75) {
        doc.addPage();
        currentY = 16;
      }

      // Member Box Header
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, currentY, pageWidth - 28, 6.5, 1, 1, 'FD');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Member: ${member.memberTag} - ${member.subType || member.memberType} (Total Rebar: ${memberWeightKg.toFixed(1)} kg - ${(memberWeightKg / 1000).toFixed(3)} MT)`,
        18,
        currentY + 4.5
      );
      currentY += 8;

      // Draw Vector CAD Schematic for this member
      const schematicW = pageWidth - 28;
      const schematicH = pageSize === 'A3' ? 52 : 44;
      drawMemberSchematicPdf(
        doc,
        member.memberType,
        member.subType || '',
        member.memberTag,
        params,
        14,
        currentY,
        schematicW,
        schematicH
      );
      currentY += schematicH + 3;

      // Member Itemized BBS Table
      const tableHeaders = [
        '#',
        'Mark',
        'Description & Placement',
        'IS Shape',
        'Dia (Ø)',
        'Qty',
        'Dim A',
        'Dim B',
        'Dim C',
        'Cut L (mm)',
        'Cut Formula',
        'Total L (m)',
        'Unit Wt',
        'Total Wt (kg)',
        'Status',
      ];

      const tableBody: any[] = memberRebars.map((r, idx) => [
        (idx + 1).toString(),
        r.barMark || '',
        r.description || '',
        `Shape ${r.shapeCode || '20'}`,
        `Ø${r.dia}`,
        (r.count || 0).toString(),
        r.dimA ? r.dimA.toString() : '-',
        r.dimB ? r.dimB.toString() : '-',
        r.dimC ? r.dimC.toString() : '-',
        (r.calculatedCutLength || 0).toString(),
        getShapeCutFormula(r.shapeCode),
        (Number(r.totalLengthM) || 0).toFixed(2),
        (Number(r.unitWeight) || 0).toFixed(3),
        (Number(r.totalWeightKg) || 0).toFixed(2),
        r.isPayable ? 'PAYABLE' : 'NON-PAYABLE',
      ]);

      const memberTotalLen = memberRebars.reduce((acc, i) => acc + (Number(i.totalLengthM) || 0), 0);
      
      // Professional Subtotal Row using colSpan (eliminates "Su bto tal" wrapping bug)
      tableBody.push([
        {
          content: `Subtotal for ${member.memberTag}:`,
          colSpan: 3,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
        },
        { content: '-', styles: { halign: 'center', fillColor: [241, 245, 249] } },
        { content: '-', styles: { halign: 'center', fillColor: [241, 245, 249] } },
        { content: memberRebars.reduce((acc, i) => acc + (Number(i.count) || 0), 0).toString(), styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: memberTotalLen.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: '-', styles: { fillColor: [241, 245, 249] } },
        { content: memberWeightKg.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `${(memberWeightKg / 1000).toFixed(3)} MT`, styles: { halign: 'center', fontStyle: 'bold', textColor: [14, 165, 233], fillColor: [241, 245, 249] } },
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [tableHeaders],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: pageSize === 'A3' ? 7.5 : 6,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: pageSize === 'A3' ? 7 : 5.8,
          textColor: [30, 41, 59],
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 7 },
          1: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
          2: { halign: 'left' },
          3: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
          4: { halign: 'center', fontStyle: 'bold', cellWidth: 11 },
          5: { halign: 'center', cellWidth: 8 },
          6: { halign: 'right', cellWidth: 10 },
          7: { halign: 'right', cellWidth: 10 },
          8: { halign: 'right', cellWidth: 10 },
          9: { halign: 'right', fontStyle: 'bold', cellWidth: 13 },
          10: { halign: 'center', cellWidth: 16 },
          11: { halign: 'right', cellWidth: 13 },
          12: { halign: 'right', cellWidth: 11 },
          13: { halign: 'right', fontStyle: 'bold', cellWidth: 14 },
          14: { halign: 'center', cellWidth: 12 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;
    });
  });

  // -------------------------------------------------------------
  // 4. DIAMETER-WISE STEEL QUANTITY ABSTRACT MATRIX (IS 2502 / IS 1786)
  // -------------------------------------------------------------
  if (currentY > pageHeight - 85) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFontSize(pageSize === 'A3' ? 12 : 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PROJECT DIAMETER-WISE STEEL QUANTITY ABSTRACT (IS 2502 / IS 1786)', 14, currentY);

  const summaryHeaders = ['Bar Dia (Ø)', 'Unit Wt (kg/m)', 'Total Length (m)', 'Total Weight (kg)', 'Metric Tonnes (MT)'];
  const summaryBody: any[] = STANDARD_BAR_DIAMETERS.map((dia) => {
    const diaItems = items.filter((i) => i.dia === dia && i.isPayable);
    const totLen = diaItems.reduce((acc, i) => acc + (Number(i.totalLengthM) || 0), 0);
    const totWt = diaItems.reduce((acc, i) => acc + (Number(i.totalWeightKg) || 0), 0);
    const unitWt = getUnitWeight(dia);
    return [
      `Ø ${dia} mm`,
      unitWt.toFixed(3),
      totLen.toFixed(2),
      totWt.toFixed(2),
      (totWt / 1000).toFixed(3),
    ];
  }).filter((row) => parseFloat(row[3]) > 0);

  const totalPayableLength = items.reduce((acc, i) => acc + (i.isPayable ? (Number(i.totalLengthM) || 0) : 0), 0);
  
  // Total summary row
  summaryBody.push([
    { content: 'TOTAL PAYABLE STEEL', styles: { fontStyle: 'bold' } },
    '-',
    totalPayableLength.toFixed(2),
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
    startY: currentY + 3,
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
  // 5. OFFICIAL PWD / CPWD MEASUREMENT BOOK CERTIFICATION BLOCK
  // -------------------------------------------------------------
  let certY = (doc as any).lastAutoTable.finalY + 8;
  if (certY > pageHeight - 45) {
    doc.addPage();
    certY = 16;
  }

  // Official Certificate Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, certY, pageWidth - 28, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(pageSize === 'A3' ? 7 : 5.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('STATUTORY MEASUREMENT BOOK (MB) CERTIFICATE & COMPLIANCE CLAUSE:', 18, certY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const certNotice = 'Certified that the dimensions, bar marks, and reinforcement cut lengths recorded in this Bar Bending Schedule have been physically verified at site/fabrication yard and conform strictly to the approved structural working drawings, IS 2502:1963, IS 456:2000, and IS 13920:2016. Net payable weights are calculated based on theoretical standard unit weights (dia^2/162.2) without rolling margin additions.';
  doc.text(certNotice, 18, certY + 7.5, { maxWidth: pageWidth - 36 });

  // -------------------------------------------------------------
  // 6. OFFICIAL SIGNATURE BLOCKS (4 Columns)
  // -------------------------------------------------------------
  const sigY = certY + 20;

  doc.setDrawColor(148, 163, 184);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(pageSize === 'A3' ? 8 : 6.5);
  doc.setFont('helvetica', 'normal');

  const sigW = (pageWidth - 28) / 4;

  // Sig 1: Site Engineer / Bar Bender
  doc.line(14, sigY, 14 + sigW - 8, sigY);
  doc.text('Prepared By:', 14, sigY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Site Engineer / Bar Bender', 14, sigY + 7);

  // Sig 2: Quantity Surveyor / Billing
  const s2 = 14 + colW;
  doc.setFont('helvetica', 'normal');
  doc.line(s2, sigY, s2 + sigW - 8, sigY);
  doc.text('Checked By:', s2, sigY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Quantity Surveyor / Billing', s2, sigY + 7);

  // Sig 3: Technical Agency / Consultant
  const s3 = 14 + colW * 2;
  doc.setFont('helvetica', 'normal');
  doc.line(s3, sigY, s3 + sigW - 8, sigY);
  doc.text('Certified By:', s3, sigY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Technical Agency / Consultant', s3, sigY + 7);

  // Sig 4: Chief Structural Engineer / Client Rep
  const s4 = 14 + colW * 3;
  doc.setFont('helvetica', 'normal');
  doc.line(s4, sigY, s4 + sigW - 8, sigY);
  doc.text('Approved By:', s4, sigY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Chief Structural Engineer / Client Rep', s4, sigY + 7);

  return doc;
}
