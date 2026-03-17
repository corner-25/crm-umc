import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const hasDateFilter = !!(from || to);
    const cashDateFilter = hasDateFilter ? { receivedDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {};
    const inKindDateFilter = hasDateFilter ? { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {};
    const volunteerDateFilter = hasDateFilter ? { startDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {};

    // Count donors — nếu có filter năm thì tính theo năm tài trợ đầu tiên của donor
    let totalDonors: number;
    if (hasDateFilter && from && to) {
      // Lấy donors có khoản tài trợ đầu tiên (bất kỳ loại) trong khoảng năm được chọn
      const donorsWithFirstDonationInRange = await prisma.donor.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          cashDonations: { where: { deletedAt: null }, select: { receivedDate: true }, orderBy: { receivedDate: "asc" }, take: 1 },
          inKindDonations: { where: { deletedAt: null }, select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
          volunteerDonations: { where: { deletedAt: null }, select: { startDate: true }, orderBy: { startDate: "asc" }, take: 1 },
        },
      });
      const fromDate = new Date(from);
      const toDate = new Date(to);
      totalDonors = donorsWithFirstDonationInRange.filter((donor) => {
        const dates: Date[] = [
          ...(donor.cashDonations[0] ? [new Date(donor.cashDonations[0].receivedDate)] : []),
          ...(donor.inKindDonations[0] ? [new Date(donor.inKindDonations[0].createdAt)] : []),
          ...(donor.volunteerDonations[0] ? [new Date(donor.volunteerDonations[0].startDate)] : []),
        ];
        if (dates.length === 0) return false;
        const firstDonation = new Date(Math.min(...dates.map((d) => d.getTime())));
        return firstDonation >= fromDate && firstDonation <= toDate;
      }).length;
    } else {
      totalDonors = await prisma.donor.count({ where: { deletedAt: null } });
    }

    // Count + sum donations (filtered by date if set)
    const [cashCount, inKindCount, volunteerCount, cashSum, inKindSum, volunteerSum, usedSum] = await Promise.all([
      prisma.donationCash.count({ where: { deletedAt: null, ...cashDateFilter } }),
      prisma.donationInKind.count({ where: { deletedAt: null, ...inKindDateFilter } }),
      prisma.donationVolunteer.count({ where: { deletedAt: null, ...volunteerDateFilter } }),
      prisma.donationCash.aggregate({ where: { deletedAt: null, currency: "VND", ...cashDateFilter }, _sum: { amount: true } }),
      prisma.donationInKind.aggregate({ where: { deletedAt: null, ...inKindDateFilter }, _sum: { estimatedValue: true } }),
      prisma.donationVolunteer.aggregate({ where: { deletedAt: null, ...volunteerDateFilter }, _sum: { totalValue: true } }),
      prisma.donationCash.aggregate({ where: { deletedAt: null, currency: "VND", ...cashDateFilter }, _sum: { usedAmount: true } }),
    ]);

    const totalDonations = cashCount + inKindCount + volunteerCount;
    const totalCash = Number(cashSum._sum.amount || 0);
    const totalUsed = Number(usedSum._sum.usedAmount || 0);
    const totalRemaining = totalCash - totalUsed;
    const totalInKind = Number(inKindSum._sum.estimatedValue || 0);
    const totalVolunteer = Number(volunteerSum._sum.totalValue || 0);
    const grandTotal = totalCash + totalInKind + totalVolunteer;

    // Get donations by type for pie chart
    const donationsByType = [
      { type: "Tiền mặt", value: totalCash, count: cashCount },
      { type: "Hiện vật", value: totalInKind, count: inKindCount },
      { type: "Tình nguyện", value: totalVolunteer, count: volunteerCount },
    ];

    // Get donors with donations (filtered by date)
    const donors = await prisma.donor.findMany({
      where: { deletedAt: null },
      include: {
        cashDonations: {
          where: { deletedAt: null, ...cashDateFilter },
          select: { amount: true, currency: true },
        },
        inKindDonations: {
          where: { deletedAt: null, ...inKindDateFilter },
          select: { estimatedValue: true },
        },
        volunteerDonations: {
          where: { deletedAt: null, ...volunteerDateFilter },
          select: { totalValue: true },
        },
      },
    });

    const donorStats = donors
      .map((donor) => {
        const cashTotal = donor.cashDonations
          .filter((d) => d.currency === "VND")
          .reduce((sum, d) => sum + Number(d.amount), 0);
        const inKindTotal = donor.inKindDonations.reduce(
          (sum, d) => sum + Number(d.estimatedValue),
          0
        );
        const volunteerTotal = donor.volunteerDonations.reduce(
          (sum, d) => sum + Number(d.totalValue),
          0
        );
        const total = cashTotal + inKindTotal + volunteerTotal;
        const count =
          donor.cashDonations.length +
          donor.inKindDonations.length +
          donor.volunteerDonations.length;

        return {
          id: donor.id,
          fullName: donor.fullName,
          tier: donor.tier,
          type: donor.type,
          totalValue: total,
          donationCount: count,
        };
      });

    // Top 10 by value
    const topDonorsByValue = [...donorStats]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Top 10 by frequency
    const topDonorsByFrequency = [...donorStats]
      .filter((d) => d.donationCount > 0)
      .sort((a, b) => b.donationCount - a.donationCount || b.totalValue - a.totalValue)
      .slice(0, 10);

    // Donors by type (Cá nhân, Doanh nghiệp, Tổ chức, Cộng đồng)
    const donorTypeLabels: Record<string, string> = {
      INDIVIDUAL: "Cá nhân",
      COMPANY: "Doanh nghiệp",
      ORGANIZATION: "Tổ chức",
      COMMUNITY: "Cộng đồng",
    };
    const donorsByType = Object.entries(
      donorStats.reduce((acc, d) => {
        if (d.donationCount > 0 || !hasDateFilter) {
          acc[d.type] = (acc[d.type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({ type: donorTypeLabels[type] || type, count }));

    // Cash by purpose
    const cashDonations = await prisma.donationCash.findMany({
      where: { deletedAt: null, currency: "VND", ...cashDateFilter },
      select: { purpose: true, amount: true },
    });
    const cashByPurposeMap: Record<string, number> = {};
    for (const d of cashDonations) {
      const key = d.purpose || "Khác";
      cashByPurposeMap[key] = (cashByPurposeMap[key] || 0) + Number(d.amount);
    }
    const cashByPurpose = Object.entries(cashByPurposeMap)
      .map(([purpose, value]) => ({ purpose, value }))
      .sort((a, b) => b.value - a.value);

    // In-kind by category
    const inKindCategoryLabels: Record<string, string> = {
      MEDICAL_EQUIPMENT: "Thiết bị y tế",
      MEDICINE: "Thuốc",
      SUPPLIES: "Đồ dùng",
      FOOD: "Thực phẩm",
      OTHER: "Khác",
    };
    const inKindDonations = await prisma.donationInKind.findMany({
      where: { deletedAt: null, ...inKindDateFilter },
      select: { category: true, estimatedValue: true },
    });
    const inKindByCategoryMap: Record<string, number> = {};
    for (const d of inKindDonations) {
      const key = d.category;
      inKindByCategoryMap[key] = (inKindByCategoryMap[key] || 0) + Number(d.estimatedValue);
    }
    const inKindByCategory = Object.entries(inKindByCategoryMap)
      .map(([category, value]) => ({ category: inKindCategoryLabels[category] || category, value }))
      .sort((a, b) => b.value - a.value);

    // Cancer support stats
    const [activePatientsCount, treatmentStats, treatmentSponsorSum] = await Promise.all([
      prisma.cancerPatient.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.patientTreatment.aggregate({
        where: { deletedAt: null, status: "COMPLETED" },
        _count: true,
      }),
      prisma.patientTreatment.aggregate({
        where: { deletedAt: null, isSponsored: true },
        _sum: { donationAmount: true },
      }),
    ]);
    const cancerStats = {
      activePatients: activePatientsCount,
      completedCycles: treatmentStats._count,
      totalSponsorAmount: Number(treatmentSponsorSum._sum.donationAmount || 0),
    };

    return NextResponse.json({
      totalDonors,
      totalDonations,
      totalCash,
      totalUsed,
      totalRemaining,
      totalInKind,
      totalVolunteer,
      grandTotal,
      donationsByType,
      topDonorsByValue,
      topDonorsByFrequency,
      donorsByType,
      cashByPurpose,
      inKindByCategory,
      cancerStats,
      cashCount,
      inKindCount,
      volunteerCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
