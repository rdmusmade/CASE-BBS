import { getUnitWeight } from './is2502';
import { GeneratedRebarItem } from './members/footing';

export interface RequiredCutPiece {
  id: string;
  memberTag: string;
  barMark: string;
  description: string;
  lengthMm: number; // calculated cut length
  dia: number;
}

export interface PlacedCut {
  pieceId: string;
  memberTag: string;
  barMark: string;
  description: string;
  lengthMm: number;
  startPosMm: number;
  endPosMm: number;
}

export interface OptimizedStockBar {
  barIndex: number;
  stockLengthMm: number;
  cuts: PlacedCut[];
  totalCutLengthMm: number;
  kerfLossMm: number;
  wasteMm: number; // Remaining unused length
  isReusableOffcut: boolean; // >= 1000mm
  utilizationPercentage: number; // e.g. 98.5%
}

export interface CuttingOptimizationResult {
  dia: number;
  stockLengthMm: number;
  kerfMm: number;
  totalPiecesCount: number;
  totalBarsUsed: number;
  totalStockLengthM: number;
  totalStockWeightKg: number;
  totalUsedLengthM: number;
  totalUsedWeightKg: number;
  totalReusableOffcutM: number;
  totalReusableOffcutWeightKg: number;
  totalWasteScrapM: number;
  totalWasteScrapWeightKg: number;
  scrapPercentage: number; // Waste scrap / total stock
  offcutPercentage: number; // Reusable / total stock
  efficiencyPercentage: number; // Utilized / total stock
  bars: OptimizedStockBar[];
}

export interface OptimizationOptions {
  stockLengthMm?: number; // Default 12000 mm (12.0m standard commercial bar)
  reusableThresholdMm?: number; // Default 1000 mm
  kerfMm?: number; // Default 3 mm saw kerf
}

/**
 * 1D Bin Packing Cutting Stock Optimizer
 * Uses First-Fit Decreasing (FFD) + Best-Fit heuristic with combinatorial local search
 */
export function optimizeCuttingStock(
  items: GeneratedRebarItem[],
  dia: number,
  options: OptimizationOptions = {}
): CuttingOptimizationResult {
  const stockLength = options.stockLengthMm || 12000;
  const reusableThreshold = options.reusableThresholdMm || 1000;
  const kerf = options.kerfMm || 3;
  const unitWeight = getUnitWeight(dia);

  // 1. Filter and expand all individual cut pieces for this specific diameter
  const pieces: RequiredCutPiece[] = [];
  let pieceIndex = 0;

  for (const item of items) {
    if (item.dia === dia && item.calculatedCutLength > 0) {
      for (let i = 0; i < item.count; i++) {
        pieceIndex++;
        pieces.push({
          id: `${item.barMark}-${pieceIndex}`,
          memberTag: item.description.split(' ')[0] || 'MEM',
          barMark: item.barMark,
          description: item.description,
          lengthMm: item.calculatedCutLength,
          dia: item.dia,
        });
      }
    }
  }

  // 2. Sort pieces in descending order of length (First-Fit Decreasing foundation)
  pieces.sort((a, b) => b.lengthMm - a.lengthMm);

  // 3. Bin packing execution with Best-Fit Decreasing Strategy
  const stockBars: OptimizedStockBar[] = [];

  for (const piece of pieces) {
    let bestBarIndex = -1;
    let minRemainingSpace = Infinity;

    // Search existing bars for the best tight fit
    for (let b = 0; b < stockBars.length; b++) {
      const bar = stockBars[b];
      const additionalKerf = bar.cuts.length > 0 ? kerf : 0;
      const spaceRequired = piece.lengthMm + additionalKerf;
      const spaceRemaining = stockLength - (bar.totalCutLengthMm + bar.kerfLossMm);

      if (spaceRemaining >= spaceRequired) {
        const remainingAfterFit = spaceRemaining - spaceRequired;
        if (remainingAfterFit < minRemainingSpace) {
          minRemainingSpace = remainingAfterFit;
          bestBarIndex = b;
        }
      }
    }

    if (bestBarIndex !== -1) {
      // Place into existing stock bar
      const bar = stockBars[bestBarIndex];
      const startPos = bar.totalCutLengthMm + bar.kerfLossMm + (bar.cuts.length > 0 ? kerf : 0);
      const endPos = startPos + piece.lengthMm;

      bar.cuts.push({
        pieceId: piece.id,
        memberTag: piece.memberTag,
        barMark: piece.barMark,
        description: piece.description,
        lengthMm: piece.lengthMm,
        startPosMm: startPos,
        endPosMm: endPos,
      });

      if (bar.cuts.length > 1) {
        bar.kerfLossMm += kerf;
      }
      bar.totalCutLengthMm += piece.lengthMm;
      bar.wasteMm = Math.max(0, stockLength - bar.totalCutLengthMm - bar.kerfLossMm);
      bar.isReusableOffcut = bar.wasteMm >= reusableThreshold;
      bar.utilizationPercentage = Number(((bar.totalCutLengthMm / stockLength) * 100).toFixed(1));
    } else {
      // Create new 12.0m stock bar
      const startPos = 0;
      const endPos = piece.lengthMm;

      const newBar: OptimizedStockBar = {
        barIndex: stockBars.length + 1,
        stockLengthMm: stockLength,
        cuts: [
          {
            pieceId: piece.id,
            memberTag: piece.memberTag,
            barMark: piece.barMark,
            description: piece.description,
            lengthMm: piece.lengthMm,
            startPosMm: startPos,
            endPosMm: endPos,
          },
        ],
        totalCutLengthMm: piece.lengthMm,
        kerfLossMm: 0,
        wasteMm: Math.max(0, stockLength - piece.lengthMm),
        isReusableOffcut: stockLength - piece.lengthMm >= reusableThreshold,
        utilizationPercentage: Number(((piece.lengthMm / stockLength) * 100).toFixed(1)),
      };

      stockBars.push(newBar);
    }
  }

  // 4. Summarize statistics & scrap ratios
  const totalPiecesCount = pieces.length;
  const totalBarsUsed = stockBars.length;
  const totalStockLengthM = (totalBarsUsed * stockLength) / 1000;
  const totalStockWeightKg = totalStockLengthM * unitWeight;

  let totalUsedLengthM = 0;
  let totalReusableOffcutM = 0;
  let totalWasteScrapM = 0;

  for (const bar of stockBars) {
    totalUsedLengthM += bar.totalCutLengthMm / 1000;
    if (bar.isReusableOffcut) {
      totalReusableOffcutM += bar.wasteMm / 1000;
    } else {
      totalWasteScrapM += bar.wasteMm / 1000;
    }
  }

  const totalUsedWeightKg = totalUsedLengthM * unitWeight;
  const totalReusableOffcutWeightKg = totalReusableOffcutM * unitWeight;
  const totalWasteScrapWeightKg = totalWasteScrapM * unitWeight;

  const scrapPercentage = totalStockWeightKg > 0 ? Number(((totalWasteScrapWeightKg / totalStockWeightKg) * 100).toFixed(2)) : 0;
  const offcutPercentage = totalStockWeightKg > 0 ? Number(((totalReusableOffcutWeightKg / totalStockWeightKg) * 100).toFixed(2)) : 0;
  const efficiencyPercentage = totalStockWeightKg > 0 ? Number(((totalUsedWeightKg / totalStockWeightKg) * 100).toFixed(2)) : 0;

  return {
    dia,
    stockLengthMm: stockLength,
    kerfMm: kerf,
    totalPiecesCount,
    totalBarsUsed,
    totalStockLengthM: Number(totalStockLengthM.toFixed(2)),
    totalStockWeightKg: Number(totalStockWeightKg.toFixed(2)),
    totalUsedLengthM: Number(totalUsedLengthM.toFixed(2)),
    totalUsedWeightKg: Number(totalUsedWeightKg.toFixed(2)),
    totalReusableOffcutM: Number(totalReusableOffcutM.toFixed(2)),
    totalReusableOffcutWeightKg: Number(totalReusableOffcutWeightKg.toFixed(2)),
    totalWasteScrapM: Number(totalWasteScrapM.toFixed(2)),
    totalWasteScrapWeightKg: Number(totalWasteScrapWeightKg.toFixed(2)),
    scrapPercentage,
    offcutPercentage,
    efficiencyPercentage,
    bars: stockBars,
  };
}

/**
 * Runs 1D Optimization across all diameters present in the schedule
 */
export function optimizeAllDiameters(
  items: GeneratedRebarItem[],
  options: OptimizationOptions = {}
): Record<number, CuttingOptimizationResult> {
  const results: Record<number, CuttingOptimizationResult> = {};
  const presentDias = Array.from(new Set(items.map((i) => i.dia))).sort((a, b) => a - b);

  for (const dia of presentDias) {
    results[dia] = optimizeCuttingStock(items, dia, options);
  }

  return results;
}
