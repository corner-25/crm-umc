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
        },
      });
      const fromDate = new Date(from);
      const toDate = new Date(to);
      totalDonors = donorsWithFirstDonationInRange.filter((donor) => {
        const dates: Date[] = [
          ...(donor.cashDonations[0] ? [new Date(donor.cashDonations[0].receivedDate)] : []),
          ...(donor.inKindDonations[0] ? [new Date(donor.inKindDonations[0].createdAt)] : []),
        ];
        if (dates.length === 0) return false;
        const firstDonation = new Date(Math.min(...dates.map((d) => d.getTime())));
        return firstDonation >= fromDate && firstDonation <= toDate;
      }).length;
    } else {
      totalDonors = await prisma.donor.count({ where: { deletedAt: null } });
    }

    // Count + sum donations (filtered by date if set)
    const [cashCount, inKindCount, cashSum, inKindSum, usedSum] = await Promise.all([
      prisma.donationCash.count({ where: { deletedAt: null, ...cashDateFilter } }),
      prisma.donationInKind.count({ where: { deletedAt: null, ...inKindDateFilter } }),
      prisma.donationCash.aggregate({ where: { deletedAt: null, currency: "VND", ...cashDateFilter }, _sum: { amount: true } }),
      prisma.donationInKind.aggregate({ where: { deletedAt: null, ...inKindDateFilter }, _sum: { estimatedValue: true } }),
      prisma.donationCash.aggregate({ where: { deletedAt: null, currency: "VND", ...cashDateFilter }, _sum: { usedAmount: true } }),
    ]);

    const totalDonations = cashCount + inKindCount;
    const totalCash = Number(cashSum._sum.amount || 0);
    const totalUsed = Number(usedSum._sum.usedAmount || 0);
    const totalRemaining = totalCash - totalUsed;
    const totalInKind = Number(inKindSum._sum.estimatedValue || 0);
    const grandTotal = totalCash + totalInKind;

    // Get donations by type for pie chart (không bao gồm tình nguyện)
    const donationsByType = [
      { type: "Tiền mặt", value: totalCash, count: cashCount },
      { type: "Hiện vật", value: totalInKind, count: inKindCount },
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
      },
    });

    const donorStats = donors
      .map((donor) => {
        const cashTotal = donor.cashDonations
          .filter((d) => d.currency === "VND")
          .reduce((sum, d) => sum + Number(d.amount), 0);
        const inKindTotal = donor.inKindDonations.reduce(
          (sum, d) => sum + Number(d.estimatedValue || 0),
          0
        );
        const total = cashTotal + inKindTotal;
        const count =
          donor.cashDonations.length +
          donor.inKindDonations.length;

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
      let purposes: string[] = [];
      try {
        const parsed = JSON.parse(d.purpose || "");
        if (Array.isArray(parsed)) purposes = parsed;
      } catch {}
      if (purposes.length === 0) purposes = [d.purpose || "Khác"];
      for (const p of purposes) {
        cashByPurposeMap[p] = (cashByPurposeMap[p] || 0) + Number(d.amount);
      }
    }
    const cashByPurpose = Object.entries(cashByPurposeMap)
      .map(([purpose, value]) => ({ purpose, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      totalDonors,
      totalDonations,
      totalCash,
      totalUsed,
      totalRemaining,
      totalInKind,
      grandTotal,
      donationsByType,
      topDonorsByValue,
      topDonorsByFrequency,
      donorsByType,
      cashByPurpose,
      cashCount,
      inKindCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
