import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findProjectById, deleteProject } from '@/lib/cloudStore';
import { getFirestoreDb } from '@/lib/firebase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const isSysAdmin = (session.user as any).role === 'SYSTEM_ADMIN' || session.user.email === 'admin';

    // 1. Fetch from Firestore Cloud Database
    const cloudProject = await findProjectById(id, userId, isSysAdmin);
    if (cloudProject) {
      return NextResponse.json({ success: true, project: cloudProject });
    }

    // 2. Fallback to Prisma
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          members: {
            include: { rebarItems: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (project) {
        if (!isSysAdmin && project.userId !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ success: true, project });
      }
    } catch (dbErr) {
      console.warn('[Project ID API] Prisma lookup warning:', dbErr);
    }

    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const isSysAdmin = (session.user as any).role === 'SYSTEM_ADMIN' || session.user.email === 'admin';
    const body = await request.json();

    const db = getFirestoreDb();
    if (db) {
      const doc = await db.collection('projects').doc(id).get();
      if (doc.exists) {
        const pData = doc.data()!;
        if (!isSysAdmin && pData.userId !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        await db.collection('projects').doc(id).set(
          {
            ...body,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    // Dual-sync to local Prisma
    try {
      await prisma.project.update({
        where: { id },
        data: {
          projectName: body.projectName,
          clientName: body.clientName,
          authorityStandard: body.authorityStandard,
          siteLocation: body.siteLocation,
          rccGrade: body.rccGrade,
          rebarGrade: body.rebarGrade,
          notes: body.notes,
        },
      });
    } catch (e) {
      // ignore
    }

    const updated = await findProjectById(id, userId, isSysAdmin);
    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const isSysAdmin = (session.user as any).role === 'SYSTEM_ADMIN' || session.user.email === 'admin';

    await deleteProject(id, userId, isSysAdmin);

    try {
      await prisma.project.delete({ where: { id } });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
