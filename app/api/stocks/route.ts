import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STANDARD_BAR_DIAMETERS, getUnitWeight } from '@/lib/engine/is2502';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isSystemAdmin = (session.user as any).role === 'SYSTEM_ADMIN';

    // 1. Fetch all stock transactions (Admin sees all, User sees own)
    const transactions = await prisma.stockTransaction.findMany({
      where: isSystemAdmin ? {} : { userId },
      include: {
        project: { select: { projectName: true, clientName: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    // 2. Fetch active projects and members to calculate BBS Steel Required per dia
    const projects = await prisma.project.findMany({
      where: isSystemAdmin ? {} : { userId },
      include: {
        members: {
          include: {
            rebarItems: true,
          },
        },
      },
    });

    // Aggregate BBS Steel requirement by bar diameter in kg
    const bbsRequiredByDia: Record<number, number> = {};
    STANDARD_BAR_DIAMETERS.forEach((d) => {
      bbsRequiredByDia[d] = 0;
    });

    projects.forEach((proj) => {
      proj.members.forEach((m) => {
        m.rebarItems.forEach((r) => {
          const dia = Number(r.dia);
          const cutLen = Number(r.calculatedCutLength) || 0;
          const count = Number(r.count) || 0;
          const unitWt = Number(r.unitWeight) || getUnitWeight(dia);
          const totalKg = ((count * cutLen) / 1000) * unitWt;

          if (bbsRequiredByDia[dia] !== undefined) {
            bbsRequiredByDia[dia] += totalKg;
          } else {
            bbsRequiredByDia[dia] = totalKg;
          }
        });
      });
    });

    // 3. Aggregate Inward (Procurement) & Outward (Issue) per diameter
    const procuredByDia: Record<number, number> = {};
    const issuedByDia: Record<number, number> = {};

    STANDARD_BAR_DIAMETERS.forEach((d) => {
      procuredByDia[d] = 0;
      issuedByDia[d] = 0;
    });

    transactions.forEach((tx) => {
      const dia = Number(tx.dia);
      const qty = Number(tx.quantityKg) || 0;
      if (tx.transactionType === 'PROCUREMENT') {
        procuredByDia[dia] = (procuredByDia[dia] || 0) + qty;
      } else if (tx.transactionType === 'ISSUE') {
        issuedByDia[dia] = (issuedByDia[dia] || 0) + qty;
      }
    });

    // 4. Construct Diameter-wise Reconciliation Matrix
    const reconciliationMatrix = STANDARD_BAR_DIAMETERS.map((dia) => {
      const procuredKg = Number((procuredByDia[dia] || 0).toFixed(2));
      const issuedKg = Number((issuedByDia[dia] || 0).toFixed(2));
      const inStockKg = Number((procuredKg - issuedKg).toFixed(2));
      const bbsReqKg = Number((bbsRequiredByDia[dia] || 0).toFixed(2));
      const balanceKg = Number((inStockKg - bbsReqKg).toFixed(2));

      return {
        dia,
        procuredKg,
        issuedKg,
        inStockKg,
        bbsRequiredKg: bbsReqKg,
        balanceKg,
        status: balanceKg >= 0 ? ('SUFFICIENT' as const) : ('SHORTAGE' as const),
      };
    });

    // Overall Totals
    const totalProcuredKg = Object.values(procuredByDia).reduce((acc, v) => acc + v, 0);
    const totalIssuedKg = Object.values(issuedByDia).reduce((acc, v) => acc + v, 0);
    const totalInStockKg = totalProcuredKg - totalIssuedKg;
    const totalBbsRequiredKg = Object.values(bbsRequiredByDia).reduce((acc, v) => acc + v, 0);
    const totalBalanceKg = totalInStockKg - totalBbsRequiredKg;

    return NextResponse.json({
      success: true,
      summary: {
        totalProcuredKg: Number(totalProcuredKg.toFixed(2)),
        totalProcuredMT: Number((totalProcuredKg / 1000).toFixed(3)),
        totalIssuedKg: Number(totalIssuedKg.toFixed(2)),
        totalIssuedMT: Number((totalIssuedKg / 1000).toFixed(3)),
        totalInStockKg: Number(totalInStockKg.toFixed(2)),
        totalInStockMT: Number((totalInStockKg / 1000).toFixed(3)),
        totalBbsRequiredKg: Number(totalBbsRequiredKg.toFixed(2)),
        totalBbsRequiredMT: Number((totalBbsRequiredKg / 1000).toFixed(3)),
        totalBalanceKg: Number(totalBalanceKg.toFixed(2)),
        totalBalanceMT: Number((totalBalanceKg / 1000).toFixed(3)),
        overallHealth: totalBalanceKg >= 0 ? 'HEALTHY' : 'DEFICIT',
      },
      reconciliationMatrix,
      transactions,
      projects: projects.map((p) => ({ id: p.id, projectName: p.projectName })),
    });
  } catch (error: any) {
    console.error('Error fetching steel stocks:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch steel stocks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const {
      transactionType, // "PROCUREMENT" | "ISSUE"
      dia,
      quantityKg,
      steelGrade,
      date,
      supplier,
      invoiceNo,
      projectId,
      remarks,
    } = body;

    if (!transactionType || !dia || !quantityKg) {
      return NextResponse.json(
        { error: 'Transaction type, bar diameter, and quantity are required.' },
        { status: 400 }
      );
    }

    const parsedDia = Number(dia);
    const parsedQty = Math.abs(Number(quantityKg));

    const newTx = await prisma.stockTransaction.create({
      data: {
        userId,
        transactionType: transactionType.toUpperCase(),
        dia: parsedDia,
        quantityKg: parsedQty,
        steelGrade: steelGrade || 'Fe500D',
        date: date ? new Date(date) : new Date(),
        supplier: supplier || null,
        invoiceNo: invoiceNo || null,
        projectId: projectId || null,
        remarks: remarks || null,
      },
      include: {
        project: { select: { projectName: true } },
      },
    });

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error: any) {
    console.error('Error creating stock transaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to record stock transaction' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const isSystemAdmin = (session.user as any).role === 'SYSTEM_ADMIN';

    // Verify ownership or admin
    const tx = await prisma.stockTransaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!isSystemAdmin && tx.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.stockTransaction.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Stock transaction deleted.' });
  } catch (error: any) {
    console.error('Error deleting stock transaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete transaction' }, { status: 500 });
  }
}
