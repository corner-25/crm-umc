import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const locationId = searchParams.get("locationId") || "";

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;

    const trips = await prisma.charityTrip.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        location: { select: { id: true, province: true, district: true } },
        _count: { select: { transactions: true, demandStats: true } },
      },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { tripCode, locationId, startDate, endDate, expectedPatients, demographics, notes } = body;

    if (!tripCode || !locationId || !startDate || !endDate) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const existing = await prisma.charityTrip.findFirst({ where: { tripCode, deletedAt: null } });
    if (existing) return NextResponse.json({ error: "Mã chuyến đã tồn tại" }, { status: 400 });

    const trip = await prisma.charityTrip.create({
      data: {
        tripCode,
        locationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        expectedPatients: expectedPatients || null,
        demographics: demographics || null,
        notes: notes || null,
      },
      include: { location: { select: { province: true, district: true } } },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
