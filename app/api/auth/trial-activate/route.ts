import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    let userEmail = session?.user?.email;

    const body = await request.json().catch(() => ({}));
    if (!userId && body.email) {
      const foundUser = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase().trim() },
      });
      if (foundUser) {
        userId = foundUser.id;
        userEmail = foundUser.email;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to activate trial.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Set 14-day trial
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'TRIAL',
        planTier: 'FREE_TRIAL',
        isApprovedByAdmin: true,
        trialStartedAt: now,
        trialEndsAt: trialEnds,
        subscriptionExpiresAt: trialEnds,
      },
    });

    return NextResponse.json({
      success: true,
      message: '14-Day Free Trial activated successfully! You have full access to SmartBBS Pro.',
      trialEndsAt: trialEnds.toISOString(),
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isApprovedByAdmin: updatedUser.isApprovedByAdmin,
        subscriptionStatus: updatedUser.subscriptionStatus,
        planTier: updatedUser.planTier,
      },
    });
  } catch (error: any) {
    console.error('Trial activation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to activate trial' }, { status: 500 });
  }
}
