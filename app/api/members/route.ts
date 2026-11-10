import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateRebarShape } from '@/lib/engine/is2502';
import { addMemberToProject, deleteMemberFromProject } from '@/lib/cloudStore';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isSysAdmin = (session.user as any).role === 'SYSTEM_ADMIN' || session.user.email === 'admin';

    const body = await request.json();
    const { projectId, memberTag, memberType, clearCover, concreteGrade, steelGrade, rebarItems, remarks } = body;

    const computedItems = (rebarItems || []).map((item: any) => {
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
    });

    // 1. Save to Firestore Cloud Database
    const member = await addMemberToProject(
      projectId,
      {
        memberTag: memberTag || `${memberType}-1`,
        memberType: memberType || 'BEAM',
        clearCover: clearCover || 40,
        concreteGrade: concreteGrade || 'M25',
        steelGrade: steelGrade || 'Fe500D',
        remarks: remarks || '',
        rebarItems: computedItems,
      },
      userId,
      isSysAdmin
    );

    // 2. Dual-sync to local Prisma SQLite
    try {
      await prisma.member.create({
        data: {
          id: member.id,
          projectId,
          memberTag: member.memberTag,
          memberType: member.memberType,
          clearCover: member.clearCover,
          concreteGrade: member.concreteGrade,
          steelGrade: member.steelGrade,
          remarks: member.remarks,
          rebarItems: {
            create: computedItems,
          },
        },
      });
    } catch (dbErr) {
      console.warn('[Members API] Prisma local cache warning:', dbErr);
    }

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: error.message || 'Failed to create member' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isSysAdmin = (session.user as any).role === 'SYSTEM_ADMIN' || session.user.email === 'admin';

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const projectId = searchParams.get('projectId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // 1. Delete from Firestore Cloud Database
    await deleteMemberFromProject(memberId, projectId, userId, isSysAdmin);

    // 2. Dual-sync delete to Prisma
    try {
      await prisma.member.delete({
        where: { id: memberId },
      });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error: any) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
