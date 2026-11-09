import { NextResponse } from 'next/server';
import { generateDxfCadFile } from '@/lib/export/dxfCadExport';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, projectName } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const dxfContent = generateDxfCadFile(items, projectName || 'SmartBBS Pro Rebar Detailing');

    return new Response(dxfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/dxf',
        'Content-Disposition': `attachment; filename="SmartBBS_CAD_${Date.now()}.dxf"`,
      },
    });
  } catch (error: any) {
    console.error('DXF export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export DXF CAD file' }, { status: 500 });
  }
}
