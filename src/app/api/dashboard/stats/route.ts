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

    // Count donors (always total, not filtered by date)
    const totalDonors = await prisma.donor.count({
      where: { deletedAt: null },
    });

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

    // Get top donors by total value (filtered by date)
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

    const topDonors = donors
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
          totalValue: total,
          donationCount: count,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

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
      topDonors,
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
