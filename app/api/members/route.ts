import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateRebarShape } from '@/lib/engine/is2502';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, memberTag, memberType, clearCover, concreteGrade, steelGrade, rebarItems, remarks } = body;

    const member = await prisma.member.create({
      data: {
        projectId,
        memberTag,
        memberType,
        clearCover: clearCover || 40,
        concreteGrade: concreteGrade || 'M25',
        steelGrade: steelGrade || 'Fe500D',
        remarks,
        rebarItems: {
          create: (rebarItems || []).map((item: any) => {
            const calc = calculateRebarShape({
              shapeCode: item.shapeCode,
              dia: item.dia,
              dimA: item.dimA,
              dimB: item.dimB,
              dimC: item.dimC,
              dimD: item.dimD,
              dimE: item.dimE,
              steelGrade: steelGrade || 'Fe500D',
            });

            return {
              barMark: item.barMark || '1',
              shapeCode: item.shapeCode || '20',
              dia: item.dia || 12,
              count: item.count || 1,
              dimA: item.dimA || 0,
              dimB: item.dimB || 0,
              dimC: item.dimC || 0,
              dimD: item.dimD || 0,
              dimE: item.dimE || 0,
              calculatedCutLength: item.calculatedCutLength || calc.roundedCutLength,
              unitWeight: item.unitWeight || calc.unitWeight,
              isPayable: item.isPayable ?? true,
              isChair: item.isChair ?? false,
              isLap: item.isLap ?? false,
              remarks: item.remarks || '',
            };
          }),
        },
      },
      include: {
        rebarItems: true,
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    await prisma.member.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error: any) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
