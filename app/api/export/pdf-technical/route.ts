import { NextResponse } from 'next/server';
import { generateTechnicalBbsPdf, TechnicalPdfOptions } from '@/lib/export/technicalBbsPdfExport';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body.items || [];
    const format = (body.format || body.pageSize || 'A4').toUpperCase();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Valid items array is required' }, { status: 400 });
    }

    const options: TechnicalPdfOptions = {
      pageSize: format === 'A3' ? 'A3' : 'A4',
      orientation: format === 'A3' ? 'landscape' : body.orientation || 'portrait',
      projectName: body.projectName || body.options?.projectName || 'SmartBBS Pro Project',
      contractorName: body.contractorName || body.options?.contractorName || 'Creative Associates & Builders',
      technicalAgency: body.technicalAgency || body.options?.technicalAgency || 'Creative Structural Consultants',
      clientName: body.clientName || body.options?.clientName || 'Maharashtra Public Works Department',
      rccGrade: body.rccGrade || body.options?.rccGrade || 'M30',
      steelGrade: body.steelGrade || body.options?.steelGrade || 'Fe500D',
      mbNumber: body.mbNumber || body.options?.mbNumber || 'MB-2026/PWD-042',
      date: body.date || body.options?.date || new Date().toLocaleDateString(),
      notes: body.notes || body.options?.notes || 'Follow IS 2502:1963 Table II bend tolerances & IS 13920 seismic ductile detailing.',
      members: body.members || body.options?.members,
    };

    const doc = generateTechnicalBbsPdf(items, options);
    const pdfOutput = doc.output('arraybuffer');

    return new Response(Buffer.from(pdfOutput), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SmartBBS_${options.pageSize}_Report_${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Technical PDF export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export technical PDF' }, { status: 500 });
  }
}
