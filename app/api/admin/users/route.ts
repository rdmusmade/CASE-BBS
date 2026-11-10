import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  findUserById,
  findUserByEmail,
  saveUser,
  updateUser,
  deleteUser,
} from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserRole = (session?.user as any)?.role;
    const currentUserEmail = session?.user?.email;

    const isSysAdmin = currentUserRole === 'SYSTEM_ADMIN' || currentUserEmail === 'admin' || currentUserEmail === 'admin@smartbbs.com' || currentUserEmail === 'creativeassociates17@gmail.com';

    if (!isSysAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Administrator access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId } = body;

    // -------------------------------------------------------------
    // ACTION 1: CREATE_USER (Admin adds new user profile)
    // -------------------------------------------------------------
    if (action === 'CREATE_USER') {
      const { name, email, password, companyName, phone, address, role, subscriptionType, customDays } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Login ID / Email and password are required' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();

      const existingUser = await findUserByEmail(cleanEmail);
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this login ID / email already exists' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();
      let expiresAt: Date | null = null;
      let subscriptionStatus = 'PENDING';
      let planTier = 'FREE_TRIAL';
      let isApproved = false;

      if (subscriptionType === '14_DAYS_TRIAL') {
        expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'TRIAL';
        planTier = 'FREE_TRIAL';
        isApproved = true;
      } else if (subscriptionType === '30_DAYS_MONTHLY') {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'ACTIVE';
        planTier = 'MONTHLY_PRO';
        isApproved = true;
      } else if (subscriptionType === '365_DAYS_YEARLY') {
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'ACTIVE';
        planTier = 'YEARLY_PRO';
        isApproved = true;
      } else if (subscriptionType === 'CUSTOM' && customDays) {
        const days = Number(customDays) || 30;
        expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'ACTIVE';
        planTier = 'MONTHLY_PRO';
        isApproved = true;
      }

      const newUser = await saveUser({
        name: name || cleanEmail,
        email: cleanEmail,
        passwordHash,
        companyName: companyName || '',
        phone: phone || '',
        address: address || '',
        role: role === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'STANDARD_USER',
        isApprovedByAdmin: isApproved,
        subscriptionStatus,
        planTier,
        trialStartedAt: subscriptionStatus === 'TRIAL' ? now.toISOString() : null,
        trialEndsAt: subscriptionStatus === 'TRIAL' && expiresAt ? expiresAt.toISOString() : null,
        subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      });

      // Dual-sync to local Prisma
      try {
        await prisma.user.create({
          data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            passwordHash,
            companyName: newUser.companyName,
            phone: newUser.phone,
            address: newUser.address,
            role: newUser.role,
            isApprovedByAdmin: newUser.isApprovedByAdmin,
            subscriptionStatus: newUser.subscriptionStatus,
            planTier: newUser.planTier,
            trialStartedAt: subscriptionStatus === 'TRIAL' ? now : null,
            trialEndsAt: subscriptionStatus === 'TRIAL' ? expiresAt : null,
            subscriptionExpiresAt: expiresAt,
          },
        });
      } catch (dbErr) {
        console.warn('[Admin Create User] Prisma local cache warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        message: `User account '${newUser.email}' created successfully`,
        user: newUser,
      });
    }

    // All following actions require userId
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect master admin account from deletion or suspension
    if (targetUser.email === 'admin' && (action === 'DELETE_USER' || action === 'SUSPEND_USER')) {
      return NextResponse.json({ error: 'The primary Master Admin account cannot be deleted or suspended.' }, { status: 400 });
    }

    // -------------------------------------------------------------
    // ACTION 2: UPDATE_USER (Admin edits profile details)
    // -------------------------------------------------------------
    if (action === 'UPDATE_USER') {
      const { name, email, companyName, phone, address, role, planTier, newPassword, expiryDate } = body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (email !== undefined) {
        const cleanEmail = email.toLowerCase().trim();
        if (cleanEmail !== targetUser.email) {
          const duplicate = await findUserByEmail(cleanEmail);
          if (duplicate && duplicate.id !== userId) {
            return NextResponse.json({ error: 'Another user already uses this login ID / email' }, { status: 409 });
          }
          updateData.email = cleanEmail;
        }
      }
      if (companyName !== undefined) updateData.companyName = companyName;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;
      if (planTier !== undefined) updateData.planTier = planTier;

      if (newPassword && newPassword.trim().length > 0) {
        updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
      }

      if (expiryDate !== undefined) {
        updateData.subscriptionExpiresAt = expiryDate ? new Date(expiryDate).toISOString() : null;
      }

      const updated = await updateUser(userId, updateData);

      // Dual-sync to local Prisma
      try {
        const prismaUpdateData: any = { ...updateData };
        if (prismaUpdateData.subscriptionExpiresAt) {
          prismaUpdateData.subscriptionExpiresAt = new Date(prismaUpdateData.subscriptionExpiresAt);
        }
        await prisma.user.update({
          where: { id: userId },
          data: prismaUpdateData,
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `User '${updated?.email || targetUser.email}' updated successfully`,
        user: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 3: SUSPEND_USER (Instant account suspension)
    // -------------------------------------------------------------
    if (action === 'SUSPEND_USER') {
      const updated = await updateUser(userId, {
        isApprovedByAdmin: false,
        subscriptionStatus: 'SUSPENDED',
      });

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isApprovedByAdmin: false, subscriptionStatus: 'SUSPENDED' },
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `User '${updated?.email || targetUser.email}' has been suspended`,
        user: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 3b: REJECT_USER (Reject registration request)
    // -------------------------------------------------------------
    if (action === 'REJECT_USER') {
      const updated = await updateUser(userId, {
        isApprovedByAdmin: false,
        subscriptionStatus: 'REJECTED',
      });

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isApprovedByAdmin: false, subscriptionStatus: 'REJECTED' },
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `Registration for user '${updated?.email || targetUser.email}' has been rejected`,
        user: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: AWARD_SUBSCRIPTION / APPROVE_USER
    // -------------------------------------------------------------
    if (action === 'AWARD_SUBSCRIPTION') {
      const { durationType, customDays } = body;
      const now = new Date();
      let expiresAt: Date;
      let subscriptionStatus = 'ACTIVE';
      let planTier = targetUser.planTier || 'MONTHLY_PRO';

      if (durationType === '14_DAYS_TRIAL') {
        expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'TRIAL';
        planTier = 'FREE_TRIAL';
      } else if (durationType === '30_DAYS_MONTHLY') {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'ACTIVE';
        planTier = 'MONTHLY_PRO';
      } else if (durationType === '365_DAYS_YEARLY') {
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'ACTIVE';
        planTier = 'YEARLY_PRO';
      } else if (durationType === 'CUSTOM') {
        const days = Number(customDays) || 30;
        expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        subscriptionStatus = 'ACTIVE';
      } else {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const updated = await updateUser(userId, {
        isApprovedByAdmin: true,
        subscriptionStatus,
        planTier,
        trialStartedAt: subscriptionStatus === 'TRIAL' ? now.toISOString() : targetUser.trialStartedAt,
        trialEndsAt: subscriptionStatus === 'TRIAL' ? expiresAt.toISOString() : targetUser.trialEndsAt,
        subscriptionExpiresAt: expiresAt.toISOString(),
      });

      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isApprovedByAdmin: true,
            subscriptionStatus,
            planTier,
            trialStartedAt: subscriptionStatus === 'TRIAL' ? now : (targetUser.trialStartedAt ? new Date(targetUser.trialStartedAt) : null),
            trialEndsAt: subscriptionStatus === 'TRIAL' ? expiresAt : (targetUser.trialEndsAt ? new Date(targetUser.trialEndsAt) : null),
            subscriptionExpiresAt: expiresAt,
          },
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `Subscription awarded to '${updated?.email || targetUser.email}'. Valid until ${expiresAt.toLocaleDateString()}.`,
        user: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 5: DELETE_USER (Permanently remove account)
    // -------------------------------------------------------------
    if (action === 'DELETE_USER') {
      await deleteUser(userId);

      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `User '${targetUser.email}' and all associated projects deleted permanently.`,
      });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin user route error:', error);
    return NextResponse.json({ error: error.message || 'Server error processing admin user request' }, { status: 500 });
  }
}
