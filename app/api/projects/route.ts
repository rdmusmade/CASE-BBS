import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncProjectToFirebase } from '@/lib/firebaseSync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // System admin can see all projects or user's projects
    const whereClause = userRole === 'SYSTEM_ADMIN' ? {} : { userId };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            rebarItems: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          select: { name: true, email: true, companyName: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, projects });
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

    const project = await prisma.project.create({
      data: {
        userId,
        projectName,
        clientName: clientName || 'Public Works Department (Building Division)',
        contractorName: contractorName || 'Creative Associates & Builders',
        technicalAgency: technicalAgency || 'Creative Structural Consultants & Associates',
        authorityStandard: authorityStandard || 'MAHARASHTRA_PWD',
        siteLocation: siteLocation || '',
        rccGrade: rccGrade || 'M25',
        rebarGrade: rebarGrade || 'Fe500D',
        notes: notes || '',
      },
      include: {
        members: {
          include: { rebarItems: true },
        },
      },
    });

    // Auto-sync project to Firebase Firestore
    await syncProjectToFirebase(userId, project);

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
