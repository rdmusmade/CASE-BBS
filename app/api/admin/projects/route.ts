import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findProjects, findProjectById } from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role;
    const currentUserEmail = session?.user?.email;
    const isSysAdmin = currentUserRole === 'SYSTEM_ADMIN' || currentUserEmail === 'admin' || currentUserEmail === 'admin@smartbbs.com' || currentUserEmail === 'creativeassociates17@gmail.com';

    if (!isSysAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Administrator access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (projectId) {
      // Fetch specific project with all members and rebar items for inspection
      const project = await findProjectById(projectId, '', true);

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, project });
    }

    // Fetch all projects across all users from Firestore Cloud Database
    const projects = await findProjects('', true);

    const formattedProjects = projects.map((p) => ({
      ...p,
      _count: { members: (p.members || []).length },
    }));

    return NextResponse.json({ success: true, projects: formattedProjects });
  } catch (error: any) {
    console.error('Error in admin projects API:', error);
    return NextResponse.json({ error: 'Failed to fetch admin projects' }, { status: 500 });
  }
}
