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

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (donorId) {
      where.donorId = donorId;
    }

    const [donations, total] = await Promise.all([
      prisma.donationVolunteer.findMany({
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
        orderBy: {
          startDate: "desc",
        },
      }),
      prisma.donationVolunteer.count({ where }),
    ]);

    return NextResponse.json({
      donations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching volunteer donations:", error);
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

    // Calculate total value
    const totalValue = Number(body.hours) * Number(body.hourlyRate);

    const donation = await prisma.donationVolunteer.create({
      data: {
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        totalValue,
      },
      include: {
        donor: true,
      },
    });

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error("Error creating volunteer donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
