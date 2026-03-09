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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const donorId = searchParams.get("donorId");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const hasRemaining = searchParams.get("hasRemaining"); // "true" = chưa sử dụng hết

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (donorId) where.donorId = donorId;

    if (fromDate || toDate) {
      where.receivedDate = {};
      if (fromDate) where.receivedDate.gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        where.receivedDate.lte = to;
      }
    }

    const [donations, total] = await Promise.all([
      prisma.donationCash.findMany({
        where,
        skip,
        take: limit,
        include: {
          donor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { receivedDate: "desc" },
      }),
      prisma.donationCash.count({ where }),
    ]);

    // Filter chưa sử dụng hết ở app level (Prisma không so sánh 2 cột trực tiếp)
    const filteredDonations = hasRemaining === "true"
      ? donations.filter((d: any) => Number(d.usedAmount) < Number(d.amount))
      : donations;

    return NextResponse.json({
      donations: filteredDonations,
      pagination: {
        page,
        limit,
        total: hasRemaining === "true" ? filteredDonations.length : total,
        totalPages: Math.ceil((hasRemaining === "true" ? filteredDonations.length : total) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cash donations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Tính lại usedAmount từ usageItems
    const usageItems = Array.isArray(body.usageItems) ? body.usageItems : [];
    const usedAmount = usageItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    const donation = await prisma.donationCash.create({
      data: {
        ...body,
        receivedDate: new Date(body.receivedDate),
        usedAmount,
      },
      include: {
        donor: true,
      },
    });

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error("Error creating cash donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
