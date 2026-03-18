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

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { activeIngredient: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;

    const medicines = await prisma.charityMedicine.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        batches: {
          where: { deletedAt: null, currentStock: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
          select: { id: true, batchCode: true, expiryDate: true, currentStock: true },
        },
        _count: { select: { batches: true, demandStats: true } },
      },
    });

    // Enrich: tổng tồn kho & HSD gần nhất
    const enriched = medicines.map((med) => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.currentStock, 0);
      const nearestExpiry = med.batches[0]?.expiryDate || null;
      return { ...med, totalStock, nearestExpiry };
    });

    return NextResponse.json({ medicines: enriched });
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
    const { code, name, activeIngredient, unit, category, notes } = body;

    if (!code || !name || !unit) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const existing = await prisma.charityMedicine.findFirst({ where: { code, deletedAt: null } });
    if (existing) return NextResponse.json({ error: "Mã thuốc đã tồn tại" }, { status: 400 });

    const medicine = await prisma.charityMedicine.create({
      data: { code, name, activeIngredient: activeIngredient || null, unit, category: category || "OTHER", notes: notes || null },
    });

    return NextResponse.json({ medicine }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
