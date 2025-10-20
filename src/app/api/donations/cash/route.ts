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
        orderBy: {
          receivedDate: "desc",
        },
      }),
      prisma.donationCash.count({ where }),
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

    const donation = await prisma.donationCash.create({
      data: {
        ...body,
        receivedDate: new Date(body.receivedDate),
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
