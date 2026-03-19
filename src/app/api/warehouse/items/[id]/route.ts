import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = await prisma.warehouseItem.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        transactions: {
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, unit, subUnit, subUnitRatio, unitPrice, category, minQuantity, currentQuantity, notes } = body;

    const item = await prisma.warehouseItem.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(unit && { unit }),
        ...(subUnit !== undefined && { subUnit: subUnit || null }),
        ...(subUnitRatio !== undefined && { subUnitRatio: subUnitRatio ? parseInt(subUnitRatio) : null }),
        ...(unitPrice !== undefined && { unitPrice: unitPrice ? parseFloat(unitPrice) : null }),
        ...(category && { category }),
        ...(currentQuantity !== undefined && { currentQuantity }),
        ...(minQuantity !== undefined && { minQuantity }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.warehouseItem.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
