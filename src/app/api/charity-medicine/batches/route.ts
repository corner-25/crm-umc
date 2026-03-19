import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const medicineId = searchParams.get("medicineId") || "";
    const hasStock = searchParams.get("hasStock") === "true";

    const where: any = { deletedAt: null };
    if (medicineId) where.medicineId = medicineId;
    if (hasStock) where.currentStock = { gt: 0 };

    const batches = await prisma.medicineBatch.findMany({
      where,
      orderBy: { expiryDate: "asc" }, // FEFO: hết hạn trước lên đầu
      include: {
        medicine: { select: { id: true, code: true, name: true, unit: true } },
      },
    });

    return NextResponse.json({ batches });
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
    const { medicineId, batchCode, expiryDate, quantity, unitCost, supplier, notes, handledBy, transactionDate } = body;

    if (!medicineId || !expiryDate || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Tạo lô + giao dịch nhập kho trong transaction
    const [batch] = await prisma.$transaction([
      prisma.medicineBatch.create({
        data: {
          medicineId,
          batchCode: batchCode || null,
          expiryDate: new Date(expiryDate),
          currentStock: quantity,
          initialQuantity: quantity,
          unitCost: unitCost || null,
          supplier: supplier || null,
          notes: notes || null,
        },
        include: { medicine: { select: { code: true, name: true, unit: true } } },
      }),
    ]);

    // Tạo giao dịch IMPORT
    await prisma.medicineTransaction.create({
      data: {
        batchId: batch.id,
        type: "IMPORT",
        quantity,
        handledBy: handledBy || null,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
