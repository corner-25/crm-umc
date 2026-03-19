import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const expiringSoon = searchParams.get("expiringSoon") === "true";

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;

    const items = await prisma.warehouseItem.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { transactions: true } },
        // Lấy các lô IMPORT còn hạn sử dụng để hiển thị HSD gần nhất
        transactions: {
          where: { type: "IMPORT", expiryDate: { not: null } },
          select: { batchCode: true, expiryDate: true, expiryAlertMonths: true, quantity: true, transactionDate: true },
          orderBy: { expiryDate: "asc" },
        },
      },
    });

    // Enrich: thêm nearestExpiry (HSD gần nhất từ các lô)
    const enriched = items.map((item) => {
      const batches = item.transactions.filter((t) => t.expiryDate);
      const nearestBatch = batches[0] || null;
      return {
        ...item,
        nearestExpiry: nearestBatch?.expiryDate || null,
        nearestBatchCode: nearestBatch?.batchCode || null,
        nearestExpiryAlertMonths: nearestBatch?.expiryAlertMonths || 1,
        batches: batches.map((b) => ({
          batchCode: b.batchCode,
          expiryDate: b.expiryDate,
          expiryAlertMonths: b.expiryAlertMonths,
          quantity: b.quantity,
        })),
      };
    });

    let result = enriched;
    if (lowStock) result = result.filter((i) => i.minQuantity > 0 && i.currentQuantity <= i.minQuantity);
    if (expiringSoon) {
      const now = new Date();
      result = result.filter((i) => {
        if (!i.nearestExpiry) return false;
        const alertMonths = i.nearestExpiryAlertMonths || 1;
        const alertDate = new Date(i.nearestExpiry);
        alertDate.setMonth(alertDate.getMonth() - alertMonths);
        return now >= alertDate;
      });
    }

    return NextResponse.json({ items: result });
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
    const { code: inputCode, name, unit, subUnit, subUnitRatio, unitPrice, category, minQuantity, currentQuantity, notes } = body;

    if (!name || !unit) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Auto-generate code if not provided
    let code = inputCode;
    if (!code) {
      const catPrefix: Record<string, string> = {
        FOOD: "TP", MEDICINE: "TH", GIFT: "QT", EQUIPMENT: "TB", OTHER: "KH",
      };
      const prefix = catPrefix[category || "OTHER"] || "KH";
      const count = await prisma.warehouseItem.count({ where: { code: { startsWith: prefix + "-" } } });
      code = `${prefix}-${String(count + 1).padStart(3, "0")}`;
      // Check collision and increment
      let existing = await prisma.warehouseItem.findFirst({ where: { code, deletedAt: null } });
      let attempt = count + 1;
      while (existing) {
        attempt++;
        code = `${prefix}-${String(attempt).padStart(3, "0")}`;
        existing = await prisma.warehouseItem.findFirst({ where: { code, deletedAt: null } });
      }
    } else {
      const existing = await prisma.warehouseItem.findFirst({ where: { code, deletedAt: null } });
      if (existing) return NextResponse.json({ error: "Mã hàng đã tồn tại" }, { status: 400 });
    }

    const item = await prisma.warehouseItem.create({
      data: {
        code,
        name,
        unit,
        subUnit: subUnit || null,
        subUnitRatio: subUnitRatio ? parseInt(subUnitRatio) : null,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        category: category || "OTHER",
        currentQuantity: currentQuantity || 0,
        minQuantity: minQuantity || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
