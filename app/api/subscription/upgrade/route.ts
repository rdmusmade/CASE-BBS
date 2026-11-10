import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUser } from '@/lib/cloudStore';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { planTier, paymentProvider } = await request.json();

    if (!['FREE_TRIAL', 'MONTHLY_PRO', 'YEARLY_PRO', 'ENTERPRISE'].includes(planTier)) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (planTier === 'MONTHLY_PRO' ? 30 : 365));

    const updatedUser = await updateUser(userId, {
      planTier,
      subscriptionStatus: 'ACTIVE',
      isApprovedByAdmin: true,
      subscriptionExpiresAt: expiresAt.toISOString(),
    });

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          planTier,
          subscriptionStatus: 'ACTIVE',
          isApprovedByAdmin: true,
          subscriptionExpiresAt: expiresAt,
        },
      });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planTier} plan!`,
      planTier: updatedUser?.planTier || planTier,
      subscriptionStatus: updatedUser?.subscriptionStatus || 'ACTIVE',
      paymentProvider: paymentProvider || 'DIRECT_ADMIN_ACTIVATION',
    });
  } catch (error: any) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json({ error: error.message || 'Upgrade failed' }, { status: 500 });
  }
}
