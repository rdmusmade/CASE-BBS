import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { findUserByEmail, findUserById } from './cloudStore';

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

        // 1. First-class Master Admin check (Creative Associate LLP)
        if (
          (lookup === 'admin' || lookup === 'creativeassociates17@gmail.com') &&
          credentials.password === '2484553644'
        ) {
          return {
            id: 'cmw90khi20000l2c1k5g3euvv',
            email: 'admin',
            name: 'Creative Associate LLP',
            companyName: 'Creative Associate LLP',
            phone: '+91 8484 86 6868',
            address:
              'Shop No. 20, Union Building, Near Shivaji Maharaj Statue, A P Rahurifactory, Tal Rahuri, Dist Ahilyanagar, 413 706.',
            role: 'SYSTEM_ADMIN',
            isApprovedByAdmin: true,
            subscriptionStatus: 'ACTIVE',
            planTier: 'ENTERPRISE',
            trialEndsAt: null,
            subscriptionExpiresAt: null,
          };
        }

        // 2. Query Firestore Cloud Database (Authoritative single source of truth)
        const user: any = await findUserByEmail(lookup);

        // Security Enforcement: If not in Firestore, user does not exist or has been deleted.
        // Prisma SQLite fallback is completely disabled to prevent deleted users from logging in.
        if (!user || !user.passwordHash) {
          throw new Error('Invalid Admin ID / Email or password');
        }

        const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isMatch) {
          throw new Error('Invalid Admin ID / Email or password');
        }

        // Check if registration was rejected by admin
        if (user.subscriptionStatus === 'REJECTED') {
          throw new Error('Your registration has been declined by the administrator. Please contact Creative Associate LLP at +91 8484 86 6868.');
        }

        const isSystemAdmin = user.role === 'SYSTEM_ADMIN' || user.email === 'admin' || user.email === 'creativeassociates17@gmail.com' || user.email === 'admin@smartbbs.com';

        // Check subscription expiration for standard users
        const now = new Date();
        const expiresAtDate = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
        const isExpired = !isSystemAdmin && Boolean(expiresAtDate && expiresAtDate < now);
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
          trialEndsAt: user.trialEndsAt ? new Date(user.trialEndsAt).toISOString() : null,
          subscriptionExpiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
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
        token.name = user.name;
        token.lastChecked = Date.now();
      }

      // Live Firestore synchronization for standard users in JWT callback:
      // When Admin approves or awards a subscription, the token & cookie update automatically!
      const nowMs = Date.now();
      const isPendingOrUnapproved = token.subscriptionStatus === 'PENDING' || !token.isApprovedByAdmin;
      const needsSync =
        token.id &&
        token.id !== 'cmw90khi20000l2c1k5g3euvv' &&
        (!token.lastChecked || isPendingOrUnapproved || (nowMs - (token.lastChecked as number)) > 15000);

      if (needsSync) {
        try {
          const liveUser: any = await findUserById(token.id as string);
          token.lastChecked = nowMs;

          if (liveUser) {
            const isSysAdmin = liveUser.role === 'SYSTEM_ADMIN' || liveUser.email === 'admin';
            const now = new Date();
            const expiresDate = liveUser.subscriptionExpiresAt ? new Date(liveUser.subscriptionExpiresAt) : null;
            const isExpired = !isSysAdmin && Boolean(expiresDate && expiresDate < now);
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

            token.role = isSysAdmin ? 'SYSTEM_ADMIN' : liveUser.role;
            token.isApprovedByAdmin = isApproved;
            token.subscriptionStatus = effectiveStatus;
            token.planTier = isSysAdmin ? 'ENTERPRISE' : liveUser.planTier;
            token.subscriptionExpiresAt = liveUser.subscriptionExpiresAt
              ? (typeof liveUser.subscriptionExpiresAt === 'string'
                  ? liveUser.subscriptionExpiresAt
                  : liveUser.subscriptionExpiresAt.toISOString())
              : null;
            token.trialEndsAt = liveUser.trialEndsAt
              ? (typeof liveUser.trialEndsAt === 'string'
                  ? liveUser.trialEndsAt
                  : liveUser.trialEndsAt.toISOString())
              : null;
            token.name = liveUser.name;
            token.companyName = liveUser.companyName;
            token.phone = liveUser.phone;
            token.address = liveUser.address;
          } else {
            // Deleted user
            token.isApprovedByAdmin = false;
            token.subscriptionStatus = 'REJECTED';
          }
        } catch (err) {
          console.warn('[JWT Sync] Live check error:', err);
        }
      }

      if (trigger === 'update' && session) {
        if (session.planTier) token.planTier = session.planTier;
        if (session.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus;
        if (session.isApprovedByAdmin !== undefined) token.isApprovedByAdmin = session.isApprovedByAdmin;
        if (session.subscriptionExpiresAt !== undefined) token.subscriptionExpiresAt = session.subscriptionExpiresAt;
        token.lastChecked = 0;
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
        session.user.name = (token.name as string) || session.user.name;
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
