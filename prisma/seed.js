const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing ALL dummy data from CASE - BBS database...');

  // 1. Delete all transactional, structural, and user dummy data
  await prisma.rebarItem.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.stockTransaction.deleteMany({});
  await prisma.cuttingRun.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✓ All dummy data deleted cleanly.');

  // 2. Create the ONLY authorized System Administrator account
  // Admin ID: admin | Password: 2484553644
  const adminId = 'admin';
  const adminPassword = '2484553644';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const adminUser = await prisma.user.create({
    data: {
      email: adminId,
      passwordHash,
      name: 'Creative Associate LLP',
      companyName: 'Creative Associate LLP',
      address: 'Shop No. 20, Union Building, Near Shivaji Maharaj Statue, A P Rahurifactory, Tal Rahuri, Dist Ahilyanagar, 413 706.',
      phone: '+91 8484 86 6868',
      role: 'SYSTEM_ADMIN',
      subscriptionStatus: 'ACTIVE',
      planTier: 'ENTERPRISE',
      isApprovedByAdmin: true,
    },
  });

  console.log(`✓ Master Admin seeded successfully for CASE - BBS:`);
  console.log(`   Admin ID: ${adminUser.email}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Name: ${adminUser.name}`);
  console.log(`   Firm: ${adminUser.companyName}`);
  console.log(`   Phone: ${adminUser.phone}`);
  console.log(`   Address: ${adminUser.address}`);
  console.log(`   Role: ${adminUser.role}`);
  console.log(`✓ Database is pristine with ZERO dummy projects and ZERO dummy users.`);
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
