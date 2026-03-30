import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Trả về danh sách thuốc gợi ý cho chuyến mới:
// - Tính số lần xuất hiện & tổng lượng dùng trong các chuyến trước
// - Kết hợp với tồn kho hiện tại của từng thuốc
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Lấy toàn bộ demand stats của các chuyến đã qua
    const demandStats = await prisma.charityDemandStat.findMany({
      include: {
        medicine: { select: { id: true, code: true, name: true, unit: true, category: true } },
      },
    });

    // Tổng hợp theo medicineId
    const medicineMap: Record<string, {
      medicine: { id: string; code: string; name: string; unit: string; category: string };
      tripCount: number;      // số chuyến có dùng thuốc này
      totalUsed: number;      // tổng số lượng đã dùng
      avgPerTrip: number;     // trung bình mỗi chuyến
    }> = {};

    for (const stat of demandStats) {
      const id = stat.medicineId;
      if (!medicineMap[id]) {
        medicineMap[id] = {
          medicine: stat.medicine as any,
          tripCount: 0,
          totalUsed: 0,
          avgPerTrip: 0,
        };
      }
      medicineMap[id].tripCount += 1;
      medicineMap[id].totalUsed += stat.quantityUsed;
    }

    // Tính trung bình
    for (const entry of Object.values(medicineMap)) {
      entry.avgPerTrip = entry.tripCount > 0
        ? Math.ceil(entry.totalUsed / entry.tripCount)
        : 0;
    }

    // Lấy tồn kho hiện tại của từng thuốc (sum tất cả lô còn hàng)
    const batches = await prisma.medicineBatch.findMany({
      where: { deletedAt: null, currentStock: { gt: 0 } },
      select: { medicineId: true, currentStock: true },
    });

    const stockMap: Record<string, number> = {};
    for (const b of batches) {
      stockMap[b.medicineId] = (stockMap[b.medicineId] || 0) + b.currentStock;
    }

    // Xây kết quả: thuốc có trong lịch sử, sắp theo tần suất giảm dần
    const suggestions = Object.values(medicineMap)
      .sort((a, b) => b.tripCount - a.tripCount)
      .map((entry) => {
        const currentStock = stockMap[entry.medicine.id] || 0;
        const suggested = entry.avgPerTrip;
        const toImport = Math.max(0, suggested - currentStock);
        return {
          medicineId: entry.medicine.id,
          code: entry.medicine.code,
          name: entry.medicine.name,
          unit: entry.medicine.unit,
          category: entry.medicine.category,
          tripCount: entry.tripCount,
          avgPerTrip: entry.avgPerTrip,
          currentStock,
          suggested,
          toImport,   // số cần nhập thêm = gợi ý - tồn kho
        };
      });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
