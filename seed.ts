import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './src/config/Prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'tanvir@ecospark.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user seeded record:', adminUser);
}

main()
  .catch((e) => {
    console.error(' Seeding failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
