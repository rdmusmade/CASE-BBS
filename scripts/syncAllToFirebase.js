const { PrismaClient } = require('@prisma/client');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING FIREBASE FIRESTORE FULL SYNC ---');

  const keyPath = path.join(__dirname, '..', 'firebase-service-account.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error('firebase-service-account.json not found!');
  }

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  if (!getApps().length) {
    initializeApp({
      credential: cert(key),
      projectId: 'creative-associate-llp-9d611',
    });
  }

  const db = getFirestore();

  // 1. Sync Users
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users to sync.`);
  for (const u of users) {
    await db.collection('users').doc(u.id).set(
      {
        id: u.id,
        email: u.email,
        name: u.name || null,
        companyName: u.companyName || null,
        phone: u.phone || null,
        address: u.address || null,
        role: u.role,
        isApprovedByAdmin: u.isApprovedByAdmin,
        subscriptionStatus: u.subscriptionStatus,
        planTier: u.planTier,
        trialStartedAt: u.trialStartedAt ? u.trialStartedAt.toISOString() : null,
        trialEndsAt: u.trialEndsAt ? u.trialEndsAt.toISOString() : null,
        subscriptionExpiresAt: u.subscriptionExpiresAt ? u.subscriptionExpiresAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`✓ Synced User: ${u.email} (${u.role})`);
  }

  // 2. Sync Projects & Members
  const projects = await prisma.project.findMany({
    include: {
      members: {
        include: { rebarItems: true },
      },
    },
  });
  console.log(`Found ${projects.length} projects to sync.`);
  for (const p of projects) {
    await db.collection('users').doc(p.userId).collection('projects').doc(p.id).set(
      {
        id: p.id,
        userId: p.userId,
        projectName: p.projectName,
        clientName: p.clientName,
        contractorName: p.contractorName,
        technicalAgency: p.technicalAgency,
        authorityStandard: p.authorityStandard,
        siteLocation: p.siteLocation,
        rccGrade: p.rccGrade,
        rebarGrade: p.rebarGrade,
        notes: p.notes,
        createdDate: p.createdDate.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        membersCount: p.members.length,
        members: p.members.map((m) => ({
          id: m.id,
          memberTag: m.memberTag,
          memberType: m.memberType,
          clearCover: m.clearCover,
          concreteGrade: m.concreteGrade,
          steelGrade: m.steelGrade,
          remarks: m.remarks,
          rebarItems: m.rebarItems.map((r) => ({
            id: r.id,
            barMark: r.barMark,
            shapeCode: r.shapeCode,
            dia: r.dia,
            count: r.count,
            dimA: r.dimA,
            dimB: r.dimB,
            dimC: r.dimC,
            dimD: r.dimD,
            dimE: r.dimE,
            calculatedCutLength: r.calculatedCutLength,
            unitWeight: r.unitWeight,
            isPayable: r.isPayable,
            isChair: r.isChair,
            isLap: r.isLap,
          })),
        })),
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`✓ Synced Project: ${p.projectName} with ${p.members.length} members`);
  }

  // 3. Sync Stock Transactions
  const stocks = await prisma.stockTransaction.findMany();
  console.log(`Found ${stocks.length} stock transactions to sync.`);
  for (const s of stocks) {
    await db.collection('users').doc(s.userId).collection('stocks').doc(s.id).set(
      {
        id: s.id,
        userId: s.userId,
        transactionType: s.transactionType,
        dia: s.dia,
        quantityKg: s.quantityKg,
        steelGrade: s.steelGrade,
        date: s.date.toISOString(),
        supplier: s.supplier,
        invoiceNo: s.invoiceNo,
        projectId: s.projectId,
        remarks: s.remarks,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`✓ Synced Stock Tx: ${s.transactionType} ${s.dia}mm ${s.quantityKg}kg`);
  }

  console.log('--- ALL RECORDS SUCCESSFULLY SYNCED TO FIREBASE FIRESTORE! ---');
}

main()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
