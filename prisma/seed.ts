import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      email: 'admin@hospital.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create a few sample donors
  const donor1 = await prisma.donor.create({
    data: {
      fullName: 'Nguyễn Văn An',
      email: 'nguyenvanan@example.com',
      phone: '0901234567',
      address: '123 Lê Lợi, Q1, TP.HCM',
      type: 'INDIVIDUAL',
      tier: 'VIP',
      occupation: 'Doanh nhân',
      company: 'ABC Corp',
      position: 'CEO',
      birthday: new Date('1980-05-15'),
      firstDonationDate: new Date('2023-01-10'),
      personalInterests: 'Y tế, giáo dục',
      areasOfInterest: ['Thiết bị y tế', 'Hỗ trợ bệnh nhân nghèo'],
      notes: 'Nhà tài trợ VIP, rất quan tâm đến hoạt động từ thiện',
      managerId: admin.id,
    },
  });

  console.log('✅ Created donor:', donor1.fullName);

  const donor2 = await prisma.donor.create({
    data: {
      fullName: 'Công ty TNHH XYZ',
      email: 'contact@xyz.com',
      phone: '0287654321',
      address: '456 Nguyễn Huệ, Q1, TP.HCM',
      type: 'COMPANY',
      tier: 'REGULAR',
      company: 'XYZ Limited',
      firstDonationDate: new Date('2023-03-20'),
      areasOfInterest: ['Thuốc men', 'Vật tư y tế'],
      notes: 'Công ty dược phẩm, thường xuyên tài trợ thuốc',
      managerId: admin.id,
    },
  });

  console.log('✅ Created donor:', donor2.fullName);

  // Create sample cash donation
  const cashDonation = await prisma.donationCash.create({
    data: {
      donorId: donor1.id,
      amount: 50000000,
      currency: 'VND',
      paymentMethod: 'BANK_TRANSFER',
      receivedDate: new Date('2024-01-15'),
      purpose: 'Hỗ trợ mua thiết bị y tế cho khoa Nhi',
      status: 'RECEIVED',
    },
  });

  console.log('✅ Created cash donation: 50,000,000 VND');

  // Create sample in-kind donation
  const inKindDonation = await prisma.donationInKind.create({
    data: {
      donorId: donor2.id,
      itemName: 'Máy thở hô hấp',
      category: 'MEDICAL_EQUIPMENT',
      quantity: 5,
      unit: 'cái',
      condition: 'NEW',
      estimatedValue: 100000000,
      receivingLocation: 'Kho tổng',
      storageLocation: 'Kho B - Tầng 2',
      distributionStatus: 'RECEIVED',
    },
  });

  console.log('✅ Created in-kind donation: Máy thở hô hấp');

  // Create sample volunteer donation
  const volunteerDonation = await prisma.donationVolunteer.create({
    data: {
      donorId: donor1.id,
      workType: 'MEDICAL',
      skills: 'Bác sĩ tim mạch, 15 năm kinh nghiệm',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-05'),
      hours: 40,
      hourlyRate: 500000,
      totalValue: 20000000,
      rating: 5,
      reviewNotes: 'Rất tận tâm, nhiệt tình hỗ trợ bệnh nhân',
    },
  });

  console.log('✅ Created volunteer donation: 40 hours');

  // Create sample interaction
  const interaction = await prisma.interaction.create({
    data: {
      donorId: donor1.id,
      type: 'CALL',
      date: new Date('2024-03-10'),
      content: 'Gọi điện cảm ơn và thông báo về chương trình mới',
    },
  });

  console.log('✅ Created interaction');

  // Create sample email template
  const template = await prisma.emailTemplate.create({
    data: {
      name: 'Email cảm ơn tài trợ tiền mặt',
      subject: 'Cảm ơn sự đóng góp của {tên}',
      body: `
Kính gửi {tên},

Bệnh viện ABC xin chân thành cảm ơn sự đóng góp quý báu của Quý vị/Công ty với số tiền {số_tiền} vào ngày {ngày}.

Sự hỗ trợ của Quý vị/Công ty sẽ giúp chúng tôi {mục_đích}, góp phần nâng cao chất lượng chăm sóc sức khỏe cho người dân.

Một lần nữa, xin chân thành cảm ơn!

Trân trọng,
Ban Quản lý Bệnh viện ABC
      `.trim(),
      type: 'THANK_YOU',
    },
  });

  console.log('✅ Created email template:', template.name);

  // Create sample reminder
  const reminder = await prisma.reminder.create({
    data: {
      donorId: donor1.id,
      type: 'BIRTHDAY',
      dueDate: new Date('2024-05-12'),
      title: 'Sinh nhật Nguyễn Văn An',
      description: 'Gửi thiệp chúc mừng sinh nhật',
      isCompleted: false,
    },
  });

  console.log('✅ Created reminder');

  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
