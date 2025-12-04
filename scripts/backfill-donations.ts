import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Lấy tất cả treatments được tài trợ nhưng chưa có donation
  const sponsoredTreatments = await prisma.patientTreatment.findMany({
    where: {
      isSponsored: true,
      deletedAt: null,
    },
    include: {
      medication: true,
      sponsor: true,
    },
  });

  console.log(`Found ${sponsoredTreatments.length} sponsored treatments`);

  let created = 0;

  for (const treatment of sponsoredTreatments) {
    if (!treatment.sponsorId || !treatment.donationAmount) {
      console.log(`Skipping treatment ${treatment.id} - missing sponsor or amount`);
      continue;
    }

    // Kiểm tra xem đã có donation cho treatment này chưa
    const existingDonation = await prisma.donationInKind.findFirst({
      where: {
        donorId: treatment.sponsorId,
        itemName: treatment.medication.name,
        estimatedValue: treatment.donationAmount,
        createdAt: {
          gte: new Date(treatment.createdAt.getTime() - 1000), // Trong khoảng 1s
          lte: new Date(treatment.createdAt.getTime() + 1000),
        },
      },
    });

    if (existingDonation) {
      console.log(`Donation already exists for treatment ${treatment.id}`);
      continue;
    }

    // Tạo donation
    await prisma.donationInKind.create({
      data: {
        donorId: treatment.sponsorId,
        itemName: treatment.medication.name,
        category: 'MEDICINE',
        quantity: 1,
        unit: 'liều',
        condition: 'NEW',
        estimatedValue: treatment.donationAmount,
        receivingLocation: 'Bệnh viện',
        storageLocation: 'Kho thuốc',
        distributionStatus: 'RECEIVED',
        imageUrls: [],
      },
    });

    created++;
    console.log(`✅ Created donation for treatment ${treatment.id} (${treatment.medication.name})`);
  }

  console.log(`\n✅ Created ${created} donations from existing treatments`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
