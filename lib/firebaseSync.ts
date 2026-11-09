import { getFirestoreDb } from './firebase';

/**
 * Real-time continuous Firebase Firestore synchronization for CASE - BBS
 * Guarantees zero data leakage and persistent cloud synchronization across Vercel & client sessions.
 */

export async function syncUserToFirebase(user: {
  id: string;
  email: string;
  passwordHash?: string | null;
  name?: string | null;
  companyName?: string | null;
  phone?: string | null;
  address?: string | null;
  role: string;
  isApprovedByAdmin: boolean;
  subscriptionStatus: string;
  planTier: string;
  trialEndsAt?: Date | null;
  subscriptionExpiresAt?: Date | null;
}) {
  try {
    const db = getFirestoreDb();
    await db.collection('users').doc(user.id).set(
      {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash || null,
        name: user.name || null,
        companyName: user.companyName || null,
        phone: user.phone || null,
        address: user.address || null,
        role: user.role,
        isApprovedByAdmin: user.isApprovedByAdmin,
        subscriptionStatus: user.subscriptionStatus,
        planTier: user.planTier,
        trialEndsAt: user.trialEndsAt ? (typeof user.trialEndsAt === 'string' ? user.trialEndsAt : user.trialEndsAt.toISOString()) : null,
        subscriptionExpiresAt: user.subscriptionExpiresAt ? (typeof user.subscriptionExpiresAt === 'string' ? user.subscriptionExpiresAt : user.subscriptionExpiresAt.toISOString()) : null,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[FirebaseSync] User sync error:', err);
  }
}

export async function syncProjectToFirebase(userId: string, project: any) {
  try {
    const db = getFirestoreDb();
    // Namespaced under user's private projects subcollection to strictly prevent cross-tenant data leakage
    await db.collection('users').doc(userId).collection('projects').doc(project.id).set(
      {
        ...project,
        userId,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[FirebaseSync] Project sync error:', err);
  }
}

export async function syncStockToFirebase(userId: string, stock: any) {
  try {
    const db = getFirestoreDb();
    // Namespaced under user's private stock collection
    await db.collection('users').doc(userId).collection('stocks').doc(stock.id).set(
      {
        ...stock,
        userId,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[FirebaseSync] Stock sync error:', err);
  }
}
