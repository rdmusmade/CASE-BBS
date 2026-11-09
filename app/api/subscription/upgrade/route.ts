import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { planTier, paymentProvider } = await request.json();

    if (!['FREE_TRIAL', 'MONTHLY_PRO', 'ENTERPRISE'].includes(planTier)) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365); // 1 year

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        planTier,
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planTier} plan!`,
      planTier: updatedUser.planTier,
      subscriptionStatus: updatedUser.subscriptionStatus,
      paymentProvider: paymentProvider || 'RAZORPAY_INSTANT_GATEWAY',
    });
  } catch (error: any) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json({ error: error.message || 'Upgrade failed' }, { status: 500 });
  }
}
