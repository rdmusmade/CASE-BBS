import { GeneratedRebarItem } from '../engine/members/footing';

/**
 * Generates a valid 2D DXF (Drawing Exchange Format) file for scheduled rebars
 */
export function generateDxfCadFile(
  items: GeneratedRebarItem[],
  projectName: string = 'SmartBBS Pro Rebar Schedule'
): string {
  const lines: string[] = [];

  // 1. DXF HEADER SECTION
  lines.push('0\nSECTION');
  lines.push('2\nHEADER');
  lines.push('9\n$ACADVER');
  lines.push('1\nAC1009'); // AutoCAD R12/R14 standard DXF (universally compatible)
  lines.push('0\nENDSEC');

  // 2. DXF TABLES SECTION (Layers)
  lines.push('0\nSECTION');
  lines.push('2\nTABLES');
  lines.push('0\nTABLE');
  lines.push('2\nLAYER');
  lines.push('70\n3');

  // Layer 0
  lines.push('0\nLAYER');
  lines.push('2\n0');
  lines.push('70\n0');
  lines.push('62\n7'); // White
  lines.push('6\nCONTINUOUS');

  // Layer REBAR (Cyan)
  lines.push('0\nLAYER');
  lines.push('2\nREBAR');
  lines.push('70\n0');
  lines.push('62\n4'); // Cyan
  lines.push('6\nCONTINUOUS');

  // Layer TEXT_ANNOT (Green)
  lines.push('0\nLAYER');
  lines.push('2\nTEXT_ANNOT');
  lines.push('70\n0');
  lines.push('62\n3'); // Green
  lines.push('6\nCONTINUOUS');

  lines.push('0\nENDTAB');
  lines.push('0\nENDSEC');

  // 3. DXF ENTITIES SECTION
  lines.push('0\nSECTION');
  lines.push('2\nENTITIES');

  // Title Text
  lines.push('0\nTEXT');
  lines.push('8\nTEXT_ANNOT');
  lines.push('10\n0.0');
  lines.push('20\n100.0');
  lines.push('30\n0.0');
  lines.push('40\n18.0'); // Height
  lines.push(`1\nSMARTBBS PRO - ${projectName}`);

  let originY = 0;
  const itemSpacingY = 120; // 120mm spacing between rows

  items.forEach((item, idx) => {
    originY -= itemSpacingY;
    const originX = 50;

    // Label Text
    lines.push('0\nTEXT');
    lines.push('8\nTEXT_ANNOT');
    lines.push(`10\n${originX}`);
    lines.push(`20\n${originY + 25}`);
    lines.push('30\n0.0');
    lines.push('40\n10.0');
    lines.push(`1\nMark: ${item.barMark} | Dia: Ø${item.dia} | Nos: ${item.count} | Cut: ${item.calculatedCutLength}mm | ${item.description}`);

    // Draw 2D Bar Shape Geometry
    const scale = 0.08; // scale down for CAD layout view
    const dimA = item.dimA * scale;
    const dimB = (item.dimB || 100) * scale;
    const dimC = (item.dimC || 50) * scale;

    if (item.shapeCode === '20' || item.shapeCode === 'STRAIGHT') {
      // Straight line
      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX}`);
      lines.push(`20\n${originY}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX + dimA}`);
      lines.push(`21\n${originY}`);
      lines.push('31\n0.0');
    } else if (item.shapeCode === '21' || item.shapeCode === 'L_BAR') {
      // L-bar (Horizontal + Vertical leg)
      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX}`);
      lines.push(`20\n${originY}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX + dimA}`);
      lines.push(`21\n${originY}`);
      lines.push('31\n0.0');

      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX + dimA}`);
      lines.push(`20\n${originY}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX + dimA}`);
      lines.push(`21\n${originY + dimB}`);
      lines.push('31\n0.0');
    } else if (item.shapeCode === '37' || item.shapeCode === 'U_BAR') {
      // U-bar (Left leg + Bottom + Right leg)
      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX}`);
      lines.push(`20\n${originY + dimB}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX}`);
      lines.push(`21\n${originY}`);
      lines.push('31\n0.0');

      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX}`);
      lines.push(`20\n${originY}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX + dimA}`);
      lines.push(`21\n${originY}`);
      lines.push('31\n0.0');

      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX + dimA}`);
      lines.push(`20\n${originY}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX + dimA}`);
      lines.push(`21\n${originY + dimB}`);
      lines.push('31\n0.0');
    } else if (item.shapeCode === '51' || item.shapeCode === 'STIRRUP_RECT') {
      // Rectangular Stirrup with 135° hook cross
      const w = dimA;
      const h = dimB;

      // Bottom
      lines.push('0\nLINE\n8\nREBAR');
      lines.push(`10\n${originX}\n20\n${originY}\n30\n0.0\n11\n${originX + w}\n21\n${originY}\n31\n0.0`);
      // Right
      lines.push('0\nLINE\n8\nREBAR');
      lines.push(`10\n${originX + w}\n20\n${originY}\n30\n0.0\n11\n${originX + w}\n21\n${originY + h}\n31\n0.0`);
      // Top
      lines.push('0\nLINE\n8\nREBAR');
      lines.push(`10\n${originX + w}\n20\n${originY + h}\n30\n0.0\n11\n${originX}\n21\n${originY + h}\n31\n0.0`);
      // Left
      lines.push('0\nLINE\n8\nREBAR');
      lines.push(`10\n${originX}\n20\n${originY + h}\n30\n0.0\n11\n${originX}\n21\n${originY}\n31\n0.0`);
      // 135 deg Hooks
      lines.push('0\nLINE\n8\nREBAR');
      lines.push(`10\n${originX}\n20\n${originY + h}\n30\n0.0\n11\n${originX + 12}\n21\n${originY + h - 12}\n31\n0.0`);
    } else {
      // Default line segment
      lines.push('0\nLINE');
      lines.push('8\nREBAR');
      lines.push(`10\n${originX}`);
      lines.push(`20\n${originY}`);
      lines.push('30\n0.0');
      lines.push(`11\n${originX + dimA}`);
      lines.push(`21\n${originY}`);
      lines.push('31\n0.0');
    }
  });

  lines.push('0\nENDSEC');
  lines.push('0\nEOF');

  return lines.join('\n');
}
