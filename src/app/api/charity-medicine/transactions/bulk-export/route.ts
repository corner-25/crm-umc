import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Xuất nhiều thuốc cùng lúc cho 1 chuyến đi (FEFO tự động)
// Body: { tripId, handledBy, transactionDate, items: [{ medicineId, quantity }] }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tripId, handledBy, transactionDate, items } = await request.json();

    if (!tripId || !items?.length) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const txDate = transactionDate ? new Date(transactionDate) : new Date();
    const errors: string[] = [];
    const toCreate: any[] = [];

    for (const item of items) {
      if (!item.medicineId || !item.quantity || item.quantity <= 0) continue;

      // Lấy các lô còn hàng, FEFO
      const batches = await prisma.medicineBatch.findMany({
        where: { medicineId: item.medicineId, deletedAt: null, currentStock: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
        include: { medicine: { select: { name: true } } },
      });

      const totalStock = batches.reduce((s: number, b: any) => s + b.currentStock, 0);
      if (totalStock < item.quantity) {
        errors.push(`${batches[0]?.medicine?.name || item.medicineId}: tồn ${totalStock}, cần ${item.quantity}`);
        continue;
      }

      // Phân bổ FEFO
      let remaining = item.quantity;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, batch.currentStock);
        toCreate.push({ batchId: batch.id, take, medicineName: batch.medicine?.name });
        remaining -= take;
      }
    }

    if (errors.length > 0 && toCreate.length === 0) {
      return NextResponse.json({ error: `Không đủ tồn kho: ${errors.join("; ")}` }, { status: 400 });
    }

    // Thực hiện trong 1 transaction
    const created = await prisma.$transaction(
      toCreate.map(({ batchId, take }) => [
        prisma.medicineTransaction.create({
          data: { batchId, tripId, type: "EXPORT", quantity: take, handledBy: handledBy || null, transactionDate: txDate },
        }),
        prisma.medicineBatch.update({
          where: { id: batchId },
          data: { currentStock: { decrement: take } },
        }),
      ]).flat()
    );

    return NextResponse.json({
      success: true,
      exported: toCreate.length,
      warnings: errors,
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
