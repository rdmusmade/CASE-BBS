import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { syncUserToFirebase } from '@/lib/firebaseSync';

export async function POST(request: Request) {
  try {
    const { name, email, password, companyName, phone, address } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isSystemAdmin = cleanEmail === 'admin' || cleanEmail === 'admin@smartbbs.com';

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        companyName: companyName || '',
        phone: phone || '',
        address: address || '',
        passwordHash,
        role: isSystemAdmin ? 'SYSTEM_ADMIN' : 'STANDARD_USER',
        isApprovedByAdmin: isSystemAdmin,
        subscriptionStatus: isSystemAdmin ? 'ACTIVE' : 'PENDING',
        planTier: isSystemAdmin ? 'ENTERPRISE' : 'FREE_TRIAL',
        trialStartedAt: null,
        trialEndsAt: null,
        subscriptionExpiresAt: null,
      },
    });

    // Auto-sync user to Firebase Firestore cloud database
    await syncUserToFirebase(user);

    return NextResponse.json({
      success: true,
      message: isSystemAdmin
        ? 'Admin account created successfully'
        : 'Registration successful! Your profile has been submitted. Please wait for the System Administrator to approve your account and award your subscription.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        phone: user.phone,
        role: user.role,
        isApprovedByAdmin: user.isApprovedByAdmin,
        planTier: user.planTier,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 });
  }
}
