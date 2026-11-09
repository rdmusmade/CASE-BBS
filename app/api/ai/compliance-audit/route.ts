import { NextResponse } from 'next/server';
import { auditStructuralCompliance } from '@/lib/ai/geminiComplianceAudit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, projectMeta, apiKey } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Rebar items array is required' }, { status: 400 });
    }

    const report = await auditStructuralCompliance(items, projectMeta, apiKey);
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Compliance audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute structural audit' },
      { status: 500 }
    );
  }
}
