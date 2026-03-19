import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, eachMonthOfInterval, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to last 6 months if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(new Date().setMonth(endDate.getMonth() - 5));

    // Get all months in the range
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        // Cash donations (tài trợ)
        const cashResult = await prisma.donationCash.aggregate({
          where: {
            deletedAt: null,
            receivedDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        });

        // Cash used (sử dụng - theo ngày nhận để đơn giản)
        // Tổng usedAmount của các khoản nhận trong tháng này
        const cashUsedResult = await prisma.donationCash.aggregate({
          where: {
            deletedAt: null,
            receivedDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { usedAmount: true },
        });

        // In-kind donations
        const inKindResult = await prisma.donationInKind.aggregate({
          where: {
            deletedAt: null,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { estimatedValue: true },
        });

        // Volunteer donations
        const volunteerResult = await prisma.donationVolunteer.aggregate({
          where: {
            deletedAt: null,
            startDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalValue: true },
        });

        const cash = Number(cashResult._sum.amount || 0);
        const cashUsed = Number(cashUsedResult._sum.usedAmount || 0);
        const cashRemaining = cash - cashUsed;
        const inKind = Number(inKindResult._sum.estimatedValue || 0);
        const volunteer = Number(volunteerResult._sum.totalValue || 0);

        return {
          month: format(month, "MM/yyyy"),
          cash,
          cashUsed,
          cashRemaining,
          inKind,
          volunteer,
          total: cash + inKind + volunteer,
        };
      })
    );

    return NextResponse.json({ trends: monthlyData });
  } catch (error) {
    console.error("Fetch trends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
