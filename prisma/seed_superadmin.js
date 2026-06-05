const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@ethar.ai';
  const password = 'admin';
  const name = 'Super Admin';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log('Seeding/Updating Super Admin...');

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'SUPERADMIN',
      passwordHash
    },
    create: {
      email,
      name,
      role: 'SUPERADMIN',
      passwordHash
    }
  });

  console.log(`Successfully set ${user.email} (${user.name}) as SUPERADMIN.`);

  // Optional: check if there are other SUPERADMINs and make sure they are not SUPERADMIN
  const otherSuperadmins = await prisma.user.findMany({
    where: {
      role: 'SUPERADMIN',
      NOT: { email }
    }
  });

  if (otherSuperadmins.length > 0) {
    console.log(`Found ${otherSuperadmins.length} other SUPERADMINs, demoting them to MEMBER...`);
    await prisma.user.updateMany({
      where: {
        role: 'SUPERADMIN',
        NOT: { email }
      },
      data: {
        role: 'MEMBER'
      }
    });
  }

  console.log('Database seeding complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
