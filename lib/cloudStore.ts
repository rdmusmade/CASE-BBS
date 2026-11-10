import { getFirestoreDb } from './firebase';
import crypto from 'crypto';

export interface CloudUser {
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
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloudProject {
  id: string;
  userId: string;
  projectName: string;
  clientName?: string | null;
  contractorName?: string | null;
  technicalAgency?: string | null;
  authorityStandard?: string;
  siteLocation?: string | null;
  rccGrade?: string;
  rebarGrade?: string;
  notes?: string | null;
  createdDate?: string;
  createdAt: string;
  updatedAt: string;
  members: any[];
  user?: {
    name?: string | null;
    email?: string | null;
    companyName?: string | null;
    phone?: string | null;
  };
}

export interface CloudStockTransaction {
  id: string;
  userId: string;
  transactionType: 'PROCUREMENT' | 'ISSUE';
  dia: number;
  quantityKg: number;
  steelGrade?: string;
  date: string;
  supplier?: string | null;
  invoiceNo?: string | null;
  projectId?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string;
  project?: {
    projectName: string;
    clientName?: string | null;
  } | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

function generateId(): string {
  try {
    return 'cm' + crypto.randomBytes(12).toString('hex');
  } catch {
    return 'cm' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}

// =========================================================================
// USERS REPOSITORY (Firestore Cloud Database)
// =========================================================================

export async function findUserById(id: string): Promise<CloudUser | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const doc = await db.collection('users').doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as CloudUser;
    }
    return null;
  } catch (err) {
    console.warn('[CloudStore] findUserById error:', err);
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<CloudUser | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  const clean = email.toLowerCase().trim();

  try {
    // 1. Direct check for Master Admin
    if (clean === 'admin' || clean === 'creativeassociates17@gmail.com' || clean === 'admin@smartbbs.com') {
      const adminDoc = await db.collection('users').doc('admin').get();
      if (adminDoc.exists) {
        return { id: adminDoc.id, ...adminDoc.data() } as CloudUser;
      }
      const adminById = await db.collection('users').doc('cmw90khi20000l2c1k5g3euvv').get();
      if (adminById.exists) {
        return { id: adminById.id, ...adminById.data() } as CloudUser;
      }
    }

    // 2. Direct email search (single fast round-trip)
    if (clean.includes('@')) {
      const snap = await db.collection('users').where('email', '==', clean).limit(1).get();
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as CloudUser;
      }
      return null;
    }

    // 3. Username or ID search
    const directDoc = await db.collection('users').doc(clean).get();
    if (directDoc.exists) {
      return { id: directDoc.id, ...directDoc.data() } as CloudUser;
    }

    const snap = await db.collection('users').where('email', '==', clean).limit(1).get();
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as CloudUser;
    }

    return null;
  } catch (err) {
    console.warn('[CloudStore] findUserByEmail error:', err);
    return null;
  }
}

export async function saveUser(user: Partial<CloudUser> & { email: string }): Promise<CloudUser> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore database is not connected');

  const now = new Date().toISOString();
  const id = user.id || generateId();
  const cleanEmail = user.email.toLowerCase().trim();

  const fullUser: CloudUser = {
    id,
    email: cleanEmail,
    passwordHash: user.passwordHash || null,
    name: user.name || cleanEmail.split('@')[0],
    companyName: user.companyName || '',
    phone: user.phone || '',
    address: user.address || '',
    role: user.role || 'STANDARD_USER',
    isApprovedByAdmin: user.isApprovedByAdmin ?? false,
    subscriptionStatus: user.subscriptionStatus || 'PENDING',
    planTier: user.planTier || 'FREE_TRIAL',
    trialStartedAt: user.trialStartedAt || null,
    trialEndsAt: user.trialEndsAt || null,
    subscriptionExpiresAt: user.subscriptionExpiresAt || null,
    createdAt: user.createdAt || now,
    updatedAt: now,
  };

  await db.collection('users').doc(id).set(fullUser, { merge: true });
  return fullUser;
}

export async function updateUser(id: string, updates: Partial<CloudUser>): Promise<CloudUser | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  const now = new Date().toISOString();
  const dataToUpdate = { ...updates, updatedAt: now };

  await db.collection('users').doc(id).set(dataToUpdate, { merge: true });
  return findUserById(id);
}

export async function getAllUsers(): Promise<CloudUser[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const snap = await db.collection('users').get();
    const users: CloudUser[] = [];
    const seenEmails = new Set<string>();

    snap.forEach((doc) => {
      const data = doc.data() as CloudUser;
      // Deduplicate if admin alias doc exists
      if (!seenEmails.has(data.email)) {
        seenEmails.add(data.email);
        users.push({ ...data, id: doc.id });
      }
    });

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return users;
  } catch (err) {
    console.warn('[CloudStore] getAllUsers error:', err);
    return [];
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const userDoc = await db.collection('users').doc(id).get();
    const userEmail = userDoc.exists ? (userDoc.data()?.email as string) : null;

    // Delete primary doc by ID
    await db.collection('users').doc(id).delete();

    // Delete any alias docs by email
    if (userEmail) {
      await db.collection('users').doc(userEmail).delete().catch(() => {});
      const emailSnap = await db.collection('users').where('email', '==', userEmail).get();
      for (const d of emailSnap.docs) {
        await d.ref.delete().catch(() => {});
      }

      // Delete user's projects by email
      const projSnapEmail = await db.collection('projects').where('userId', '==', userEmail).get();
      for (const d of projSnapEmail.docs) {
        await d.ref.delete().catch(() => {});
      }

      // Delete user's stock transactions by email
      const stockSnapEmail = await db.collection('stockTransactions').where('userId', '==', userEmail).get();
      for (const d of stockSnapEmail.docs) {
        await d.ref.delete().catch(() => {});
      }
    }

    // Delete user's projects by ID
    const projSnap = await db.collection('projects').where('userId', '==', id).get();
    for (const d of projSnap.docs) {
      await d.ref.delete().catch(() => {});
    }

    // Delete user's stock transactions by ID
    const stockSnap = await db.collection('stockTransactions').where('userId', '==', id).get();
    for (const d of stockSnap.docs) {
      await d.ref.delete().catch(() => {});
    }

    return true;
  } catch (err) {
    console.warn('[CloudStore] deleteUser error:', err);
    return false;
  }
}

// =========================================================================
// PROJECTS & MEMBERS REPOSITORY (Firestore Cloud Database)
// =========================================================================

export async function findProjects(userId: string, isSysAdmin: boolean): Promise<CloudProject[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    let snap;
    if (isSysAdmin) {
      snap = await db.collection('projects').get();
    } else {
      snap = await db.collection('projects').where('userId', '==', userId).get();
    }

    const projects: CloudProject[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      projects.push({
        id: doc.id,
        userId: d.userId,
        projectName: d.projectName,
        clientName: d.clientName || null,
        contractorName: d.contractorName || null,
        technicalAgency: d.technicalAgency || null,
        authorityStandard: d.authorityStandard || 'MAHARASHTRA_PWD',
        siteLocation: d.siteLocation || null,
        rccGrade: d.rccGrade || 'M25',
        rebarGrade: d.rebarGrade || 'Fe500D',
        notes: d.notes || null,
        createdDate: d.createdDate || d.createdAt,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        members: d.members || [],
        user: d.user || null,
      });
    });

    projects.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return projects;
  } catch (err) {
    console.warn('[CloudStore] findProjects error:', err);
    return [];
  }
}

export async function findProjectById(id: string, userId: string, isSysAdmin: boolean): Promise<CloudProject | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const doc = await db.collection('projects').doc(id).get();
    if (!doc.exists) return null;

    const d = doc.data()!;
    // Zero data leakage enforcement
    if (!isSysAdmin && d.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      userId: d.userId,
      projectName: d.projectName,
      clientName: d.clientName || null,
      contractorName: d.contractorName || null,
      technicalAgency: d.technicalAgency || null,
      authorityStandard: d.authorityStandard || 'MAHARASHTRA_PWD',
      siteLocation: d.siteLocation || null,
      rccGrade: d.rccGrade || 'M25',
      rebarGrade: d.rebarGrade || 'Fe500D',
      notes: d.notes || null,
      createdDate: d.createdDate || d.createdAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      members: d.members || [],
      user: d.user || null,
    };
  } catch (err) {
    console.warn('[CloudStore] findProjectById error:', err);
    return null;
  }
}

export async function createProject(data: {
  userId: string;
  projectName: string;
  clientName?: string | null;
  contractorName?: string | null;
  technicalAgency?: string | null;
  authorityStandard?: string;
  siteLocation?: string | null;
  rccGrade?: string;
  rebarGrade?: string;
  notes?: string | null;
  user?: any;
}): Promise<CloudProject> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore database is not connected');

  const now = new Date().toISOString();
  const id = generateId();

  const newProject: CloudProject = {
    id,
    userId: data.userId,
    projectName: data.projectName,
    clientName: data.clientName || null,
    contractorName: data.contractorName || null,
    technicalAgency: data.technicalAgency || null,
    authorityStandard: data.authorityStandard || 'MAHARASHTRA_PWD',
    siteLocation: data.siteLocation || null,
    rccGrade: data.rccGrade || 'M25',
    rebarGrade: data.rebarGrade || 'Fe500D',
    notes: data.notes || null,
    createdDate: now,
    createdAt: now,
    updatedAt: now,
    members: [],
    user: data.user || null,
  };

  await db.collection('projects').doc(id).set(newProject);
  return newProject;
}

export async function deleteProject(id: string, userId: string, isSysAdmin: boolean): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const doc = await db.collection('projects').doc(id).get();
    if (!doc.exists) return false;

    const d = doc.data()!;
    if (!isSysAdmin && d.userId !== userId) {
      return false; // Forbidden
    }

    await db.collection('projects').doc(id).delete();
    return true;
  } catch (err) {
    console.warn('[CloudStore] deleteProject error:', err);
    return false;
  }
}

export async function addMemberToProject(
  projectId: string,
  member: any,
  userId: string,
  isSysAdmin: boolean
): Promise<any> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore database is not connected');

  const doc = await db.collection('projects').doc(projectId).get();
  if (!doc.exists) throw new Error('Project not found');

  const projectData = doc.data()!;
  if (!isSysAdmin && projectData.userId !== userId) {
    throw new Error('Unauthorized project access');
  }

  const memberId = member.id || generateId();
  const now = new Date().toISOString();

  const completeMember = {
    id: memberId,
    projectId,
    memberTag: member.memberTag || 'M-1',
    memberType: member.memberType || 'BEAM',
    subType: member.subType || 'STANDARD',
    clearCover: member.clearCover || 40,
    concreteGrade: member.concreteGrade || 'M25',
    steelGrade: member.steelGrade || 'Fe500D',
    dimensionsJson: typeof member.dimensionsJson === 'string' ? member.dimensionsJson : JSON.stringify(member.dimensionsJson || {}),
    remarks: member.remarks || '',
    sortOrder: member.sortOrder || 0,
    createdAt: now,
    updatedAt: now,
    rebarItems: (member.rebarItems || []).map((item: any, idx: number) => ({
      id: item.id || generateId(),
      memberId,
      barMark: item.barMark || String(idx + 1),
      shapeCode: item.shapeCode || '20',
      dia: Number(item.dia) || 12,
      count: Number(item.count) || 1,
      dimA: Number(item.dimA) || 0,
      dimB: Number(item.dimB) || 0,
      dimC: Number(item.dimC) || 0,
      dimD: Number(item.dimD) || 0,
      dimE: Number(item.dimE) || 0,
      calculatedCutLength: Number(item.calculatedCutLength) || 0,
      unitWeight: Number(item.unitWeight) || (Number(item.dia) * Number(item.dia)) / 162.2,
      isPayable: item.isPayable !== false,
      isChair: Boolean(item.isChair),
      isLap: Boolean(item.isLap),
      remarks: item.remarks || '',
      createdAt: now,
      updatedAt: now,
    })),
  };

  const existingMembers = projectData.members || [];
  const updatedMembers = [...existingMembers, completeMember];

  await db.collection('projects').doc(projectId).update({
    members: updatedMembers,
    updatedAt: now,
  });

  return completeMember;
}

export async function deleteMemberFromProject(
  memberId: string,
  projectId: string | null,
  userId: string,
  isSysAdmin: boolean
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    if (projectId) {
      const doc = await db.collection('projects').doc(projectId).get();
      if (!doc.exists) return false;

      const pData = doc.data()!;
      if (!isSysAdmin && pData.userId !== userId) return false;

      const updatedMembers = (pData.members || []).filter((m: any) => m.id !== memberId);
      await db.collection('projects').doc(projectId).update({
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    // If projectId not provided, find project containing this member
    let snap;
    if (isSysAdmin) {
      snap = await db.collection('projects').get();
    } else {
      snap = await db.collection('projects').where('userId', '==', userId).get();
    }

    for (const doc of snap.docs) {
      const pData = doc.data();
      const members = pData.members || [];
      const hasMember = members.some((m: any) => m.id === memberId);
      if (hasMember) {
        const updatedMembers = members.filter((m: any) => m.id !== memberId);
        await doc.ref.update({
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
    }

    return false;
  } catch (err) {
    console.warn('[CloudStore] deleteMemberFromProject error:', err);
    return false;
  }
}

// =========================================================================
// STEEL STOCK TRANSACTIONS REPOSITORY (Firestore Cloud Database)
// =========================================================================

export async function findStockTransactions(userId: string, isSysAdmin: boolean): Promise<CloudStockTransaction[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    let snap;
    if (isSysAdmin) {
      snap = await db.collection('stockTransactions').get();
    } else {
      snap = await db.collection('stockTransactions').where('userId', '==', userId).get();
    }

    const txs: CloudStockTransaction[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      txs.push({
        id: doc.id,
        userId: d.userId,
        transactionType: d.transactionType,
        dia: Number(d.dia),
        quantityKg: Number(d.quantityKg),
        steelGrade: d.steelGrade || 'Fe500D',
        date: d.date,
        supplier: d.supplier || null,
        invoiceNo: d.invoiceNo || null,
        projectId: d.projectId || null,
        remarks: d.remarks || null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        project: d.project || null,
        user: d.user || null,
      });
    });

    txs.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    return txs;
  } catch (err) {
    console.warn('[CloudStore] findStockTransactions error:', err);
    return [];
  }
}

export async function createStockTransaction(data: {
  userId: string;
  transactionType: 'PROCUREMENT' | 'ISSUE';
  dia: number;
  quantityKg: number;
  steelGrade?: string;
  date?: string;
  supplier?: string | null;
  invoiceNo?: string | null;
  projectId?: string | null;
  remarks?: string | null;
  project?: any;
  user?: any;
}): Promise<CloudStockTransaction> {
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore database is not connected');

  const now = new Date().toISOString();
  const id = generateId();

  const newTx: CloudStockTransaction = {
    id,
    userId: data.userId,
    transactionType: data.transactionType,
    dia: Number(data.dia),
    quantityKg: Number(data.quantityKg),
    steelGrade: data.steelGrade || 'Fe500D',
    date: data.date || now,
    supplier: data.supplier || null,
    invoiceNo: data.invoiceNo || null,
    projectId: data.projectId || null,
    remarks: data.remarks || null,
    createdAt: now,
    updatedAt: now,
    project: data.project || null,
    user: data.user || null,
  };

  await db.collection('stockTransactions').doc(id).set(newTx);
  return newTx;
}

export async function deleteStockTransaction(id: string, userId: string, isSysAdmin: boolean): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const doc = await db.collection('stockTransactions').doc(id).get();
    if (!doc.exists) return false;

    const d = doc.data()!;
    if (!isSysAdmin && d.userId !== userId) {
      return false; // Forbidden
    }

    await db.collection('stockTransactions').doc(id).delete();
    return true;
  } catch (err) {
    console.warn('[CloudStore] deleteStockTransaction error:', err);
    return false;
  }
}
