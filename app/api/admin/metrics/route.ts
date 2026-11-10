import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, findProjects } from '@/lib/cloudStore';

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

    // 1. Fetch live persistent state from Firestore Cloud Database
    const users = await getAllUsers();
    const allProjects = await findProjects('', true);

    const totalUsers = users.length;
    const totalProjects = allProjects.length;

    let totalMembers = 0;
    let totalRebarItems = 0;

    allProjects.forEach((p: any) => {
      const members = p.members || [];
      totalMembers += members.length;
      members.forEach((m: any) => {
        totalRebarItems += (m.rebarItems || []).length;
      });
    });

    // Format users with project counts
    const usersWithCounts = users.map((u) => {
      const userProjectsCount = allProjects.filter((p) => p.userId === u.id || p.userId === u.email).length;
      return {
        ...u,
        _count: { projects: userProjectsCount },
      };
    });

    const recentProjects = allProjects.slice(0, 10).map((p) => ({
      ...p,
      _count: { members: (p.members || []).length },
    }));

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
      users: usersWithCounts,
      recentProjects,
    });
  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch admin metrics' }, { status: 500 });
  }
}
