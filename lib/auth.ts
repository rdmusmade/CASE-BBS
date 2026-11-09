import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Admin ID or Email', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your Admin ID / Email and password');
        }

        const lookup = credentials.email.toLowerCase().trim();

        // Support logging in via 'admin' or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: lookup },
              ...(lookup === 'admin' ? [{ email: 'admin' }, { email: 'creativeassociates17@gmail.com' }, { email: 'admin@smartbbs.com' }] : []),
            ],
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid Admin ID / Email or password');
        }

        const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isMatch) {
          throw new Error('Invalid Admin ID / Email or password');
        }

        const isSystemAdmin = user.role === 'SYSTEM_ADMIN' || user.email === 'admin' || user.email === 'creativeassociates17@gmail.com' || user.email === 'admin@smartbbs.com';

        // Check subscription expiration for standard users
        const now = new Date();
        const isExpired = !isSystemAdmin && Boolean(user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now);
        const isSuspended = user.subscriptionStatus === 'SUSPENDED';
        const isApproved = isSystemAdmin || (user.isApprovedByAdmin && !isSuspended && !isExpired);

        const effectiveStatus = isSystemAdmin
          ? 'ACTIVE'
          : isSuspended
          ? 'SUSPENDED'
          : isExpired
          ? 'EXPIRED'
          : isApproved
          ? user.subscriptionStatus
          : 'PENDING';

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          companyName: user.companyName,
          phone: user.phone,
          address: user.address,
          role: isSystemAdmin ? 'SYSTEM_ADMIN' : user.role,
          isApprovedByAdmin: isApproved,
          subscriptionStatus: effectiveStatus,
          planTier: isSystemAdmin ? 'ENTERPRISE' : user.planTier,
          trialEndsAt: user.trialEndsAt?.toISOString(),
          subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString(),
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'STANDARD_USER';
        token.isApprovedByAdmin = (user as any).isApprovedByAdmin ?? false;
        token.companyName = (user as any).companyName;
        token.phone = (user as any).phone;
        token.address = (user as any).address;
        token.subscriptionStatus = (user as any).subscriptionStatus || 'PENDING';
        token.planTier = (user as any).planTier || 'FREE_TRIAL';
        token.trialEndsAt = (user as any).trialEndsAt;
        token.subscriptionExpiresAt = (user as any).subscriptionExpiresAt;
      }
      if (trigger === 'update' && session) {
        if (session.planTier) token.planTier = session.planTier;
        if (session.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus;
        if (session.isApprovedByAdmin !== undefined) token.isApprovedByAdmin = session.isApprovedByAdmin;
        if (session.subscriptionExpiresAt !== undefined) token.subscriptionExpiresAt = session.subscriptionExpiresAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isApprovedByAdmin = token.isApprovedByAdmin;
        (session.user as any).companyName = token.companyName;
        (session.user as any).phone = token.phone;
        (session.user as any).address = token.address;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).planTier = token.planTier;
        (session.user as any).trialEndsAt = token.trialEndsAt;
        (session.user as any).subscriptionExpiresAt = token.subscriptionExpiresAt;

        // Fetch live DB user state to reflect Admin approvals/suspensions in real-time
        try {
          if (token.id) {
            const liveUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                role: true,
                email: true,
                isApprovedByAdmin: true,
                subscriptionStatus: true,
                planTier: true,
                subscriptionExpiresAt: true,
                trialEndsAt: true,
                name: true,
                companyName: true,
                phone: true,
                address: true,
              },
            });

            if (liveUser) {
              const isSysAdmin = liveUser.role === 'SYSTEM_ADMIN' || liveUser.email === 'admin';
              const now = new Date();
              const isExpired = !isSysAdmin && Boolean(liveUser.subscriptionExpiresAt && new Date(liveUser.subscriptionExpiresAt) < now);
              const isSuspended = liveUser.subscriptionStatus === 'SUSPENDED';
              const isApproved = isSysAdmin || (liveUser.isApprovedByAdmin && !isSuspended && !isExpired);

              const effectiveStatus = isSysAdmin
                ? 'ACTIVE'
                : isSuspended
                ? 'SUSPENDED'
                : isExpired
                ? 'EXPIRED'
                : isApproved
                ? liveUser.subscriptionStatus
                : 'PENDING';

              (session.user as any).role = isSysAdmin ? 'SYSTEM_ADMIN' : liveUser.role;
              (session.user as any).isApprovedByAdmin = isApproved;
              (session.user as any).subscriptionStatus = effectiveStatus;
              (session.user as any).planTier = isSysAdmin ? 'ENTERPRISE' : liveUser.planTier;
              (session.user as any).subscriptionExpiresAt = liveUser.subscriptionExpiresAt?.toISOString();
              (session.user as any).trialEndsAt = liveUser.trialEndsAt?.toISOString();
              (session.user as any).name = liveUser.name;
              (session.user as any).companyName = liveUser.companyName;
              (session.user as any).phone = liveUser.phone;
              (session.user as any).address = liveUser.address;
            }
          }
        } catch (e) {
          // fallback to token if db lookup fails
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'case_bbs_super_secret_session_jwt_key_2026_creative_associates',
};
