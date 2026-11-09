import { NextResponse } from 'next/server';
import { optimizeAllDiameters, optimizeCuttingStock, OptimizationOptions } from '@/lib/engine/optimizer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, dia, options } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    if (dia) {
      const result = optimizeCuttingStock(items, Number(dia), options as OptimizationOptions);
      return NextResponse.json({ success: true, result });
    }

    const results = optimizeAllDiameters(items, options as OptimizationOptions);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Optimization error:', error);
    return NextResponse.json({ error: error.message || 'Optimization failed' }, { status: 500 });
  }
}
