import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@hospital.com';
  const password = 'admin123';

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', email);
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Role:', admin.role);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
