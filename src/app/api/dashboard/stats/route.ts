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

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Count donors
    const totalDonors = await prisma.donor.count({
      where: { deletedAt: null },
    });

    // Count donations
    const [cashCount, inKindCount, volunteerCount] = await Promise.all([
      prisma.donationCash.count({ where: { deletedAt: null } }),
      prisma.donationInKind.count({ where: { deletedAt: null } }),
      prisma.donationVolunteer.count({ where: { deletedAt: null } }),
    ]);

    const totalDonations = cashCount + inKindCount + volunteerCount;

    // Sum cash donations
    const cashSum = await prisma.donationCash.aggregate({
      where: {
        deletedAt: null,
        currency: "VND",
        ...(Object.keys(dateFilter).length > 0 && { receivedDate: dateFilter }),
      },
      _sum: {
        amount: true,
      },
    });

    // Sum in-kind donations (estimated value)
    const inKindSum = await prisma.donationInKind.aggregate({
      where: {
        deletedAt: null,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _sum: {
        estimatedValue: true,
      },
    });

    // Sum volunteer donations (total value)
    const volunteerSum = await prisma.donationVolunteer.aggregate({
      where: {
        deletedAt: null,
        ...(Object.keys(dateFilter).length > 0 && { startDate: dateFilter }),
      },
      _sum: {
        totalValue: true,
      },
    });

    const totalCash = Number(cashSum._sum.amount || 0);
    const totalInKind = Number(inKindSum._sum.estimatedValue || 0);
    const totalVolunteer = Number(volunteerSum._sum.totalValue || 0);
    const grandTotal = totalCash + totalInKind + totalVolunteer;

    // Get donations by type for pie chart
    const donationsByType = [
      { type: "Tiền mặt", value: totalCash, count: cashCount },
      { type: "Hiện vật", value: totalInKind, count: inKindCount },
      { type: "Tình nguyện", value: totalVolunteer, count: volunteerCount },
    ];

    // Get top donors by total value
    const donors = await prisma.donor.findMany({
      where: { deletedAt: null },
      include: {
        cashDonations: {
          where: { deletedAt: null },
          select: { amount: true, currency: true },
        },
        inKindDonations: {
          where: { deletedAt: null },
          select: { estimatedValue: true },
        },
        volunteerDonations: {
          where: { deletedAt: null },
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
