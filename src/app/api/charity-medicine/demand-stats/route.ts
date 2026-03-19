import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId") || "";
    const medicineId = searchParams.get("medicineId") || "";

    const where: any = {};
    if (tripId) where.tripId = tripId;
    if (medicineId) where.medicineId = medicineId;

    const stats = await prisma.charityDemandStat.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        trip: { include: { location: { select: { province: true, district: true } } } },
        medicine: { select: { id: true, code: true, name: true, unit: true, category: true } },
      },
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Cập nhật thống kê nhu cầu sau chuyến đi
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { tripId, medicineId, quantityUsed, quantityShort, notes } = body;

    if (!tripId || !medicineId) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Upsert: cập nhật nếu đã có, tạo mới nếu chưa
    const stat = await prisma.charityDemandStat.upsert({
      where: { tripId_medicineId: { tripId, medicineId } },
      create: {
        tripId,
        medicineId,
        quantityUsed: quantityUsed || 0,
        quantityShort: quantityShort || 0,
        notes: notes || null,
      },
      update: {
        quantityUsed: quantityUsed || 0,
        quantityShort: quantityShort || 0,
        notes: notes || null,
      },
      include: {
        medicine: { select: { code: true, name: true, unit: true } },
        trip: { select: { tripCode: true } },
      },
    });

    return NextResponse.json({ stat });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
