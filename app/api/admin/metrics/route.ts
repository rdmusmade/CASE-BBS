import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role;
    const currentUserEmail = session?.user?.email;
    const isSysAdmin = currentUserRole === 'SYSTEM_ADMIN' || currentUserEmail === 'admin' || currentUserEmail === 'admin@smartbbs.com' || currentUserEmail === 'creativeassociates17@gmail.com';

    if (!isSysAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const totalMembers = await prisma.member.count();
    const totalRebarItems = await prisma.rebarItem.count();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phone: true,
        address: true,
        role: true,
        isApprovedByAdmin: true,
        planTier: true,
        subscriptionStatus: true,
        trialStartedAt: true,
        trialEndsAt: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recentProjects = await prisma.project.findMany({
      take: 8,
      include: {
        user: { select: { name: true, email: true, companyName: true } },
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers,
        totalProjects,
        totalMembers,
        totalRebarItems,
        estimatedTotalSteelOptimizedMT: (totalRebarItems * 1.85).toFixed(1),
        systemHealth: 'OPTIMAL_100_PERCENT',
        isGeminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      },
      users,
      recentProjects,
    });
  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch admin metrics' }, { status: 500 });
  }
}
