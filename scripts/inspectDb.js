const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log('USERS:', users);

  const projects = await prisma.project.findMany({
    include: {
      members: {
        include: {
          rebarItems: true,
        },
      },
    },
  });

  console.log(`\nTOTAL PROJECTS: ${projects.length}`);
  for (const p of projects) {
    console.log(`\nProject: [${p.id}] ${p.projectName} (User: ${p.userId})`);
    console.log(`Members count: ${p.members.length}`);
    for (const m of p.members) {
      console.log(`  - Member: [${m.memberTag}] ${m.memberType} (${m.subType}) -> ${m.rebarItems.length} bars`);
    }
  }
}

inspect()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
