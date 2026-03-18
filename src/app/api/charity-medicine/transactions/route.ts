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
    const batchId = searchParams.get("batchId") || "";
    const type = searchParams.get("type") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (tripId) where.tripId = tripId;
    if (batchId) where.batchId = batchId;
    if (type) where.type = type;

    const transactions = await prisma.medicineTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      take: limit,
      include: {
        batch: {
          include: { medicine: { select: { id: true, code: true, name: true, unit: true } } },
        },
        trip: { select: { id: true, tripCode: true, location: { select: { province: true, district: true } } } },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Xuất thuốc cho chuyến đi (FEFO) hoặc thu hồi
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { batchId, tripId, type, quantity, handledBy, transactionDate, notes } = body;

    if (!batchId || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (type === "EXPORT" && !tripId) {
      return NextResponse.json({ error: "Xuất thuốc phải chọn chuyến đi" }, { status: 400 });
    }

    const batch = await prisma.medicineBatch.findFirst({ where: { id: batchId, deletedAt: null } });
    if (!batch) return NextResponse.json({ error: "Lô thuốc không tồn tại" }, { status: 404 });

    // Kiểm tra tồn kho khi xuất hoặc điều chỉnh giảm
    if (type === "EXPORT" || type === "ADJUSTMENT") {
      if (batch.currentStock < quantity) {
        return NextResponse.json({ error: `Tồn kho lô không đủ (hiện có ${batch.currentStock})` }, { status: 400 });
      }
    }

    // Cập nhật tồn kho
    const stockChange = type === "IMPORT" || type === "RETURN" ? quantity : -quantity;

    const [transaction] = await prisma.$transaction([
      prisma.medicineTransaction.create({
        data: {
          batchId,
          tripId: tripId || null,
          type,
          quantity,
          handledBy: handledBy || null,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          notes: notes || null,
        },
        include: {
          batch: { include: { medicine: { select: { code: true, name: true, unit: true } } } },
          trip: { select: { tripCode: true } },
        },
      }),
      prisma.medicineBatch.update({
        where: { id: batchId },
        data: { currentStock: { increment: stockChange } },
      }),
    ]);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
