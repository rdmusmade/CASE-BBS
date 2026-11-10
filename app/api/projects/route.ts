import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findProjects, createProject } from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const isSysAdmin = userRole === 'SYSTEM_ADMIN' || session.user.email === 'admin';

    // 1. Fetch from Firestore Cloud Database (Persistent source of truth)
    const cloudProjects = await findProjects(userId, isSysAdmin);
    if (cloudProjects && cloudProjects.length > 0) {
      return NextResponse.json({ success: true, projects: cloudProjects });
    }

    // 2. Fallback to Prisma SQLite if cloud was empty or initializing
    try {
      const whereClause = isSysAdmin ? {} : { userId };
      const prismaProjects = await prisma.project.findMany({
        where: whereClause,
        include: {
          members: {
            include: { rebarItems: true },
            orderBy: { sortOrder: 'asc' },
          },
          user: {
            select: { name: true, email: true, companyName: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (prismaProjects && prismaProjects.length > 0) {
        return NextResponse.json({ success: true, projects: prismaProjects });
      }
    } catch (dbErr) {
      console.warn('[Projects API] Prisma fallback error:', dbErr);
    }

    return NextResponse.json({ success: true, projects: [] });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
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
      projectName,
      clientName,
      contractorName,
      technicalAgency,
      authorityStandard,
      siteLocation,
      rccGrade,
      rebarGrade,
      notes,
    } = body;

    if (!projectName) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // 1. Create project directly in Firestore Cloud Database
    const project = await createProject({
      userId,
      projectName,
      clientName: clientName || 'Public Works Department (Building Division)',
      contractorName: contractorName || 'Creative Associates & Builders',
      technicalAgency: technicalAgency || 'Creative Structural Consultants & Associates',
      authorityStandard: authorityStandard || 'IS_STANDARD',
      siteLocation: siteLocation || '',
      rccGrade: rccGrade || 'M25',
      rebarGrade: rebarGrade || 'Fe500D',
      notes: notes || '',
      user: {
        name: session.user.name,
        email: session.user.email,
        companyName: (session.user as any).companyName,
      },
    });

    // 2. Dual-sync to local Prisma SQLite if accessible
    try {
      await prisma.project.create({
        data: {
          id: project.id,
          userId,
          projectName: project.projectName,
          clientName: project.clientName || 'Public Works Department',
          contractorName: project.contractorName || 'Creative Associates & Builders',
          technicalAgency: project.technicalAgency || 'Creative Structural Consultants',
          authorityStandard: project.authorityStandard || 'IS_STANDARD',
          siteLocation: project.siteLocation || '',
          rccGrade: project.rccGrade || 'M25',
          rebarGrade: project.rebarGrade || 'Fe500D',
          notes: project.notes || '',
        },
      });
    } catch (dbErr) {
      console.warn('[Projects API] Prisma local cache warning:', dbErr);
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
