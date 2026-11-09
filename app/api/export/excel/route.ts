import { NextResponse } from 'next/server';
import { exportPwdMeasurementBook, MbExportOptions } from '@/lib/export/excelMbExport';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Valid items array is required' }, { status: 400 });
    }

    const options: MbExportOptions = {
      projectName: body.projectName || body.options?.projectName || 'SmartBBS Pro Project',
      clientName: body.clientName || body.options?.clientName || 'General Client',
      contractorName: body.contractorName || body.options?.contractorName || 'Creative Associates',
      mbNumber: body.mbNumber || body.options?.mbNumber || 'BBS-2026/01',
      pageNumber: body.pageNumber || body.options?.pageNumber || '1',
      rccGrade: body.rccGrade || body.options?.rccGrade || 'M25',
      steelGrade: body.steelGrade || body.options?.steelGrade || 'Fe500D',
      authority: body.authority || body.options?.authority || 'IS 2502:1963 / IS 456:2000',
    };

    const excelBytes = exportPwdMeasurementBook(items, options);

    return new Response(Buffer.from(excelBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="SmartBBS_Schedule_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to export Excel MB' }, { status: 500 });
  }
}
