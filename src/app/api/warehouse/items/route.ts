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
      },
    });

    // Filter low stock / expiring soon ở app level (đơn giản hơn raw query)
    let result = items;
    if (lowStock) result = result.filter((i) => i.minQuantity > 0 && i.currentQuantity <= i.minQuantity);
    if (expiringSoon) {
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      result = result.filter((i) => i.expiryDate && new Date(i.expiryDate) <= in30Days);
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
    const { code, name, unit, category, minQuantity, expiryDate, notes, donorUnit, batchCode, expiryAlertMonths, currentQuantity } = body;

    if (!code || !name || !unit) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const existing = await prisma.warehouseItem.findFirst({ where: { code, deletedAt: null } });
    if (existing) return NextResponse.json({ error: "Mã hàng đã tồn tại" }, { status: 400 });

    const item = await prisma.warehouseItem.create({
      data: {
        code,
        name,
        unit,
        category: category || "OTHER",
        currentQuantity: currentQuantity || 0,
        minQuantity: minQuantity || 0,
        batchCode: batchCode || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        expiryAlertMonths: expiryAlertMonths || 1,
        notes: notes || null,
        donorUnit: donorUnit || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
