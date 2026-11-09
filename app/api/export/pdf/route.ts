import { NextResponse } from 'next/server';
import { generateShopFloorPdf, ShopPdfOptions } from '@/lib/export/shopFloorPdfExport';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Valid items array is required' }, { status: 400 });
    }

    const options: ShopPdfOptions = {
      projectName: body.projectName || body.options?.projectName || 'SmartBBS Pro Project',
      contractorName: body.contractorName || body.options?.contractorName || 'Creative Associates',
      date: body.date || body.options?.date || new Date().toLocaleDateString(),
      siteEngineer: body.siteEngineer || body.options?.siteEngineer || 'Site Engineer',
      notes: body.notes || body.options?.notes || 'Follow IS 2502:1963 Table II bend tolerances & IS 13920 seismic ductile detailing.',
    };

    const doc = generateShopFloorPdf(items, options);
    const pdfOutput = doc.output('arraybuffer');

    return new Response(Buffer.from(pdfOutput), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SmartBBS_ShopFloor_${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export PDF' }, { status: 500 });
  }
}
