import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId") || "";
    const type = searchParams.get("type") || "";
    const fromDate = searchParams.get("from") || "";
    const toDate = searchParams.get("to") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (itemId) where.itemId = itemId;
    if (type) where.type = type;
    if (fromDate || toDate) {
      where.transactionDate = {};
      if (fromDate) where.transactionDate.gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        where.transactionDate.lte = to;
      }
    }

    const transactions = await prisma.warehouseTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      take: limit,
      include: {
        item: { select: { id: true, code: true, name: true, unit: true } },
      },
    });

    return NextResponse.json({ transactions });
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
    const { itemId, type, quantity, donorUnit, purpose, handledBy, transactionDate, notes } = body;

    if (!itemId || !type || !quantity) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }
    if (quantity <= 0) {
      return NextResponse.json({ error: "Số lượng phải lớn hơn 0" }, { status: 400 });
    }

    // Kiểm tra tồn kho nếu xuất
    if (type === "EXPORT") {
      const item = await prisma.warehouseItem.findFirst({ where: { id: itemId, deletedAt: null } });
      if (!item) return NextResponse.json({ error: "Mặt hàng không tồn tại" }, { status: 404 });
      if (item.currentQuantity < quantity) {
        return NextResponse.json({ error: `Tồn kho không đủ (hiện có ${item.currentQuantity})` }, { status: 400 });
      }
    }

    // Transaction: tạo log + cập nhật tồn kho
    const [transaction] = await prisma.$transaction([
      prisma.warehouseTransaction.create({
        data: {
          itemId,
          type,
          quantity,
          donorUnit: donorUnit || null,
          purpose: purpose || null,
          handledBy: handledBy || null,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          notes: notes || null,
        },
        include: {
          item: { select: { id: true, code: true, name: true, unit: true } },
        },
      }),
      prisma.warehouseItem.update({
        where: { id: itemId },
        data: {
          currentQuantity: {
            [type === "IMPORT" ? "increment" : "decrement"]: quantity,
          },
        },
      }),
    ]);

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
