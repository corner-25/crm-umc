import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const giftTypes = await prisma.tripGiftType.findMany({
      where: { deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ giftTypes });
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
    const { name, unit, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Thiếu tên quà" }, { status: 400 });
    }

    const existing = await prisma.tripGiftType.findFirst({
      where: { name: name.trim(), deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "Loại quà đã tồn tại" }, { status: 400 });
    }

    const giftType = await prisma.tripGiftType.create({
      data: {
        name: name.trim(),
        unit: unit?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ giftType }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
