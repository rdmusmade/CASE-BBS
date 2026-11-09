import { NextResponse } from 'next/server';
import { extractBBSFromDrawing } from '@/lib/ai/geminiDrawingOcr';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, textQuery, apiKey } = body;

    const inputData = imageBase64 || textQuery || 'Standard beam and column drawing schedule';
    const result = await extractBBSFromDrawing(inputData, mimeType || 'image/jpeg', apiKey);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Drawing OCR extraction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze drawing snippet' },
      { status: 500 }
    );
  }
}
