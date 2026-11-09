/**
 * Technical Scale Drawing Utilities for IS 2502 Reinforcement Bar Shapes
 * Professional AEC MNC Drafting Standards with accurate bend fillets,
 * extension lines, arrowheads, and IS 2502 / IS 13920 detailing notations.
 */

export interface DrawingPathData {
  svgPath: string;
  viewBox: string;
  annotations: Array<{
    text: string;
    x: number;
    y: number;
    anchor?: 'start' | 'middle' | 'end';
    type?: 'dimension' | 'hook' | 'note' | 'title';
  }>;
  dimensionLines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    text: string;
    axis?: 'horizontal' | 'vertical';
  }>;
  hookCallout?: string;
  bendDeductionNote?: string;
}

export function getScaledShapeDrawing(
  shapeCode: string,
  dia: number,
  dimA: number = 1000,
  dimB: number = 0,
  dimC: number = 0,
  dimD: number = 0,
  dimE: number = 0
): DrawingPathData {
  const code = (shapeCode || '20').toUpperCase();
  const width = 440;
  const height = 240;
  const pad = 45;

  // 1. SHAPE 20: STRAIGHT BAR
  if (code === '20' || code === 'STRAIGHT') {
    const y = height / 2;
    const x1 = pad + 15;
    const x2 = width - pad - 15;
    return {
      svgPath: `M ${x1} ${y} L ${x2} ${y}`,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `A = ${dimA} mm`, x: width / 2, y: y - 16, anchor: 'middle', type: 'dimension' },
        { text: `Ø${dia} mm Straight Bar (IS 2502 Cl. 5.1)`, x: width / 2, y: y + 26, anchor: 'middle', type: 'note' },
        { text: `Cut L = ${dimA} mm`, x: width / 2, y: y + 42, anchor: 'middle', type: 'title' },
      ],
      dimensionLines: [
        { x1, y1: y - 8, x2, y2: y - 8, text: `A = ${dimA} mm`, axis: 'horizontal' },
      ],
      hookCallout: 'Zero Bend Deductions',
    };
  }

  // 2. SHAPE 21: L-BAR (ONE 90° BEND)
  if (code === '21' || code === 'L_BAR' || code === 'L') {
    const normA = Math.max(dimA, 100);
    const normB = Math.max(dimB || 300, 50);
    const maxVal = Math.max(normA, normB);
    const scale = (width - 2 * pad - 60) / maxVal;

    const drawA = Math.min(normA * scale, width - 2 * pad - 40);
    const drawB = Math.min(normB * scale, height - 2 * pad - 30);
    const r = 12; // Fillet arc radius

    const x1 = pad + 35;
    const y1 = height - pad - drawB;
    const x2 = x1;
    const y2 = height - pad - r;
    const cornerX = x1 + r;
    const cornerY = height - pad;
    const x3 = x1 + drawA;
    const y3 = height - pad;

    return {
      svgPath: `M ${x1} ${y1} L ${x2} ${y2} Q ${x1} ${cornerY} ${cornerX} ${cornerY} L ${x3} ${y3}`,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `A = ${dimA} mm`, x: (cornerX + x3) / 2, y: y3 + 22, anchor: 'middle', type: 'dimension' },
        { text: `B = ${dimB} mm`, x: x1 - 12, y: (y1 + y2) / 2, anchor: 'end', type: 'dimension' },
        { text: `90° Bend (-2d = -${2 * dia}mm)`, x: cornerX + 8, y: cornerY - 14, anchor: 'start', type: 'hook' },
      ],
      dimensionLines: [
        { x1: cornerX, y1: y3 + 12, x2: x3, y2: y3 + 12, text: `A = ${dimA}`, axis: 'horizontal' },
        { x1: x1 - 8, y1, x2: x1 - 8, y2: cornerY, text: `B = ${dimB}`, axis: 'vertical' },
      ],
      hookCallout: 'IS 2502 90° Standard L-Bend',
      bendDeductionNote: `Deduction: 2d = ${2 * dia} mm`,
    };
  }

  // 3. SHAPE 37: U-BAR (TWO 90° BENDS)
  if (code === '37' || code === 'U_BAR' || code === 'U') {
    const normA = Math.max(dimA, 100);
    const normB = Math.max(dimB || 300, 50);
    const drawA = width - 2 * pad - 50;
    const drawB = Math.min((normB / normA) * drawA, height - 2 * pad - 40) || 75;
    const r = 12;

    const x1 = pad + 25;
    const y1 = height - pad - drawB;
    const x2 = x1;
    const y2 = height - pad - r;
    const x3 = x1 + drawA;
    const y3 = height - pad;

    return {
      svgPath: `M ${x1} ${y1} L ${x2} ${y2} Q ${x1} ${y3} ${x1 + r} ${y3} L ${x3 - r} ${y3} Q ${x3} ${y3} ${x3} ${y2} L ${x3} ${y1}`,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `A = ${dimA} mm`, x: width / 2, y: y3 + 22, anchor: 'middle', type: 'dimension' },
        { text: `B = ${dimB} mm`, x: x1 - 10, y: (y1 + y2) / 2, anchor: 'end', type: 'dimension' },
        { text: `B = ${dimB} mm`, x: x3 + 10, y: (y1 + y2) / 2, anchor: 'start', type: 'dimension' },
        { text: `2x 90° Bends (-4d = -${4 * dia}mm)`, x: width / 2, y: y3 - 12, anchor: 'middle', type: 'hook' },
      ],
      dimensionLines: [
        { x1: x1 + r, y1: y3 + 12, x2: x3 - r, y2: y3 + 12, text: `A = ${dimA}`, axis: 'horizontal' },
        { x1: x1 - 8, y1, x2: x1 - 8, y2: y3, text: `B = ${dimB}`, axis: 'vertical' },
      ],
      hookCallout: 'IS 2502 Shape 37 (Two 90° Bends)',
      bendDeductionNote: `Deduction: 2 x 2d = ${4 * dia} mm`,
    };
  }

  // 4. SHAPE 38: U-BAR WITH 180° HOOKS
  if (code === '38') {
    const drawA = width - 2 * pad - 60;
    const drawB = 75;
    const rHook = 12;

    const x1 = pad + 30;
    const yBottom = height - pad;
    const xEnd = x1 + drawA;

    return {
      svgPath: `M ${x1 + rHook * 2} ${yBottom - drawB} A ${rHook} ${rHook} 0 0 0 ${x1} ${yBottom - drawB} L ${x1} ${yBottom} L ${xEnd} ${yBottom} L ${xEnd} ${yBottom - drawB} A ${rHook} ${rHook} 0 0 0 ${xEnd - rHook * 2} ${yBottom - drawB}`,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `A = ${dimA} mm`, x: width / 2, y: yBottom + 22, anchor: 'middle', type: 'dimension' },
        { text: `B = ${dimB} mm`, x: x1 - 10, y: yBottom - drawB / 2, anchor: 'end', type: 'dimension' },
        { text: `180° Hook (+9d to +13d)`, x: x1, y: yBottom - drawB - 14, anchor: 'start', type: 'hook' },
      ],
      dimensionLines: [
        { x1, y1: yBottom + 12, x2: xEnd, y2: yBottom + 12, text: `A = ${dimA}`, axis: 'horizontal' },
      ],
      hookCallout: 'IS 2502 Shape 38 (180° Hooks)',
    };
  }

  // 5. SHAPE 41: CRANKED BAR (45° OFFSET)
  if (code === '41' || code === 'CRANK' || code === 'CRANKED') {
    const yBottom = height - pad - 20;
    const crankH = 50;
    const yTop = yBottom - crankH;
    const x0 = pad + 15;
    const x5 = width - pad - 15;
    const crankRun = crankH;
    const endLen = 65;
    const x1 = x0 + endLen;
    const x2 = x1 + crankRun;
    const x4 = x5 - endLen;
    const x3 = x4 - crankRun;

    return {
      svgPath: `M ${x0} ${yTop} L ${x1} ${yTop} L ${x2} ${yBottom} L ${x3} ${yBottom} L ${x4} ${yTop} L ${x5} ${yTop}`,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `Bottom Span = ${dimA} mm`, x: (x2 + x3) / 2, y: yBottom + 22, anchor: 'middle', type: 'dimension' },
        { text: `45° Crank (+0.42d_crank)`, x: (x1 + x2) / 2 - 10, y: (yTop + yBottom) / 2, anchor: 'end', type: 'hook' },
        { text: `Rise = ${dimB || 250} mm`, x: (x3 + x4) / 2 + 10, y: (yTop + yBottom) / 2, anchor: 'start', type: 'dimension' },
      ],
      dimensionLines: [
        { x1: x2, y1: yBottom + 12, x2: x3, y2: yBottom + 12, text: `Span ${dimA}`, axis: 'horizontal' },
      ],
      hookCallout: 'IS 2502 45° Crank Allowance (+0.42H)',
      bendDeductionNote: `4 x 1d (45° bends) = ${4 * dia} mm`,
    };
  }

  // 6. SHAPE 51: 135° SEISMIC CLOSED STIRRUP
  if (code === '51' || code === 'STIRRUP' || code === 'TIE') {
    const drawW = 160;
    const drawH = 150;
    const x1 = (width - drawW) / 2;
    const y1 = (height - drawH) / 2;
    const x2 = x1 + drawW;
    const y2 = y1 + drawH;
    const r = 10;
    const hookTail = 28; // 135° seismic hook tail

    return {
      svgPath: `
        M ${x1 + hookTail * 0.7} ${y1 + hookTail * 0.7}
        L ${x1 + r} ${y1}
        L ${x2 - r} ${y1}
        Q ${x2} ${y1} ${x2} ${y1 + r}
        L ${x2} ${y2 - r}
        Q ${x2} ${y2} ${x2 - r} ${y2}
        L ${x1 + r} ${y2}
        Q ${x1} ${y2} ${x1} ${y2 - r}
        L ${x1} ${y1 + r}
        Q ${x1} ${y1} ${x1 + r} ${y1}
        L ${x1 + hookTail * 0.7} ${y1 + hookTail * 0.7}
      `,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `A = ${dimA} mm`, x: width / 2, y: y1 - 12, anchor: 'middle', type: 'dimension' },
        { text: `B = ${dimB} mm`, x: x2 + 14, y: height / 2, anchor: 'start', type: 'dimension' },
        { text: `135° Seismic Hooks (Tail ≥ 10d = ${Math.max(10 * dia, 75)}mm)`, x: x1 - 10, y: y1 - 12, anchor: 'end', type: 'hook' },
        { text: `IS 13920 Cl. 6.2.2 Confining Link`, x: width / 2, y: y2 + 24, anchor: 'middle', type: 'note' },
      ],
      dimensionLines: [
        { x1, y1: y1 - 6, x2, y2: y1 - 6, text: `A = ${dimA}`, axis: 'horizontal' },
        { x1: x2 + 6, y1, x2: x2 + 6, y2, text: `B = ${dimB}`, axis: 'vertical' },
      ],
      hookCallout: 'IS 13920 135° Seismic Closed Link (Tail ≥ 10d)',
      bendDeductionNote: `3 x 2d (90°) + 2 x 3d (135°) = ${12 * dia} mm`,
    };
  }

  // 7. SHAPE 61: CIRCULAR LINK / HOOP
  if (code === '61' || code === 'CIRCULAR' || code === 'RING') {
    const cx = width / 2;
    const cy = height / 2;
    const rCircle = 68;
    const lapAngle = 0.35; // radians overlap

    return {
      svgPath: `
        M ${cx + rCircle} ${cy}
        A ${rCircle} ${rCircle} 0 1 1 ${cx + rCircle * Math.cos(lapAngle)} ${cy - rCircle * Math.sin(lapAngle)}
      `,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `Dia D = ${dimA} mm`, x: cx, y: cy - rCircle - 16, anchor: 'middle', type: 'dimension' },
        { text: `Circumference = πD = ${(Math.PI * dimA).toFixed(0)} mm`, x: cx, y: cy + 6, anchor: 'middle', type: 'dimension' },
        { text: `Lap Splice = 40d to 50d`, x: cx + rCircle + 10, y: cy - 20, anchor: 'start', type: 'hook' },
      ],
      dimensionLines: [
        { x1: cx - rCircle, y1: cy, x2: cx + rCircle, y2: cy, text: `D = ${dimA}`, axis: 'horizontal' },
      ],
      hookCallout: 'IS 2502 Shape 61 (Circular Hoop + Lap)',
    };
  }

  // 8. SHAPE 81: DIAMOND / RHOMBUS TIE
  if (code === '81' || code === 'DIAMOND') {
    const cx = width / 2;
    const cy = height / 2;
    const halfW = 75;
    const halfH = 70;
    const hook = 20;

    return {
      svgPath: `
        M ${cx + hook * 0.7} ${cy - halfH + hook * 0.7}
        L ${cx} ${cy - halfH}
        L ${cx + halfW} ${cy}
        L ${cx} ${cy + halfH}
        L ${cx - halfW} ${cy}
        L ${cx} ${cy - halfH}
        L ${cx - hook * 0.7} ${cy - halfH + hook * 0.7}
      `,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `Width A = ${dimA} mm`, x: cx, y: cy - halfH - 12, anchor: 'middle', type: 'dimension' },
        { text: `Depth B = ${dimB} mm`, x: cx + halfW + 12, y: cy, anchor: 'start', type: 'dimension' },
        { text: `IS 13920 Diamond Tie (135° Hooks)`, x: cx, y: cy + halfH + 22, anchor: 'middle', type: 'note' },
      ],
      dimensionLines: [
        { x1: cx - halfW, y1: cy + halfH + 8, x2: cx + halfW, y2: cy + halfH + 8, text: `A = ${dimA}`, axis: 'horizontal' },
      ],
      hookCallout: 'IS 13920 Internal Diamond Tie',
    };
  }

  // 9. CHAIR: RAFT / MAT SPACER CHAIR
  if (code === 'CHAIR' || code === 'SPACER_CHAIR') {
    const cx = width / 2;
    const headW = 90;
    const legH = 80;
    const footW = 55;
    const yTop = height / 2 - 25;
    const yBottom = yTop + legH;

    const xL = cx - headW / 2;
    const xR = cx + headW / 2;

    return {
      svgPath: `
        M ${xL - footW} ${yBottom}
        L ${xL} ${yBottom}
        L ${xL} ${yTop}
        L ${xR} ${yTop}
        L ${xR} ${yBottom}
        L ${xR + footW} ${yBottom}
      `,
      viewBox: `0 0 ${width} ${height}`,
      annotations: [
        { text: `Head A = ${dimA || 200} mm`, x: cx, y: yTop - 14, anchor: 'middle', type: 'dimension' },
        { text: `Leg Height B = ${dimB || 400} mm`, x: xL - 10, y: yTop + legH / 2, anchor: 'end', type: 'dimension' },
        { text: `Foot C = ${dimC || 150} mm`, x: xR + footW / 2, y: yBottom + 20, anchor: 'middle', type: 'dimension' },
        { text: `4x 90° Bends (-8d = -${8 * dia}mm)`, x: cx, y: yBottom + 36, anchor: 'middle', type: 'hook' },
      ],
      dimensionLines: [
        { x1: xL, y1: yTop - 6, x2: xR, y2: yTop - 6, text: `Head = ${dimA || 200}`, axis: 'horizontal' },
      ],
      hookCallout: 'Raft / Slab 3D Spacer Chair Bar',
      bendDeductionNote: `4 x 2d = ${8 * dia} mm`,
    };
  }

  // Default fallback
  const y = height / 2;
  const x1 = pad;
  const x2 = width - pad;
  return {
    svgPath: `M ${x1} ${y} L ${x2} ${y}`,
    viewBox: `0 0 ${width} ${height}`,
    annotations: [
      { text: `Length = ${dimA} mm`, x: width / 2, y: y - 14, anchor: 'middle', type: 'dimension' },
      { text: `Custom Shape ${code}`, x: width / 2, y: y + 26, anchor: 'middle', type: 'note' },
    ],
    dimensionLines: [{ x1, y1: y - 8, x2, y2: y - 8, text: `${dimA} mm` }],
  };
}
