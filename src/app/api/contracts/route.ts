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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (donorId) where.donorId = donorId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
        { donor: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          donor: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
        orderBy: { signedDate: "desc" },
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const contract = await prisma.contract.create({
      data: {
        ...body,
        signedDate: new Date(body.signedDate),
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      include: { donor: true },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
