import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const medicine = await prisma.charityMedicine.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        batches: {
          where: { deletedAt: null },
          orderBy: { expiryDate: "asc" },
          include: {
            transactions: { orderBy: { transactionDate: "desc" }, take: 10 },
          },
        },
        demandStats: {
          include: { trip: { include: { location: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!medicine) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ medicine });
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
    const { name, activeIngredient, unit, category, notes } = body;

    const medicine = await prisma.charityMedicine.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(activeIngredient !== undefined && { activeIngredient }),
        ...(unit && { unit }),
        ...(category && { category }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ medicine });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.charityMedicine.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
