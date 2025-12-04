import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Determine the snapshot date (end of filter period or now)
    let snapshotDate: Date;
    if (endDate) {
      snapshotDate = new Date(endDate);
      snapshotDate.setHours(23, 59, 59, 999);
    } else {
      snapshotDate = new Date();
    }

    // Date range filter for "in period" queries
    const periodFilter: any = {};
    if (startDate) {
      periodFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      periodFilter.lte = end;
    }

    // 1. Tổng số NB tham gia: Count all patients created up to snapshot date
    const totalPatients = await prisma.cancerPatient.count({
      where: {
        deletedAt: null,
        createdAt: {
          lte: snapshotDate,
        },
      },
    });

    // 2. Số NB đang tham gia: Count ACTIVE patients at snapshot date
    // (patients who were created before snapshot and haven't changed to other status)
    const activePatients = await prisma.cancerPatient.count({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        createdAt: {
          lte: snapshotDate,
        },
        // If we track status changes with timestamps, we'd check updatedAt here
        // For now, we assume current status reflects state at snapshot
      },
    });

    // 3. Số NB tham gia mới: Patients created within the filter period
    const newPatientsWhere: any = {
      deletedAt: null,
    };
    if (Object.keys(periodFilter).length > 0) {
      newPatientsWhere.createdAt = periodFilter;
    }
    // Only count patients without special subStatus (not transferred in or rejoined)
    newPatientsWhere.subStatus = null;

    const newPatients = await prisma.cancerPatient.count({
      where: newPatientsWhere,
    });

    // 4. Số NB được tiếp nhận từ BV khác: Patients with TRANSFERRED_IN subStatus created in period
    const transferredInWhere: any = {
      deletedAt: null,
      subStatus: "TRANSFERRED_IN",
    };
    if (Object.keys(periodFilter).length > 0) {
      transferredInWhere.createdAt = periodFilter;
    }

    const transferredIn = await prisma.cancerPatient.count({
      where: transferredInWhere,
    });

    // 5. Số NB chuyển đi viện khác: Patients with TRANSFERRED_OUT status
    // Note: We should track when status changed, but for now check createdAt or updatedAt
    const transferredOutWhere: any = {
      deletedAt: null,
      status: "TRANSFERRED_OUT",
    };
    if (Object.keys(periodFilter).length > 0) {
      transferredOutWhere.updatedAt = periodFilter;
    }

    const transferredOut = await prisma.cancerPatient.count({
      where: transferredOutWhere,
    });

    // 6. Số NB ngừng tham gia: Patients with DISCONTINUED status in period
    const discontinuedWhere: any = {
      deletedAt: null,
      status: "DISCONTINUED",
    };
    if (Object.keys(periodFilter).length > 0) {
      discontinuedWhere.updatedAt = periodFilter;
    }

    const discontinued = await prisma.cancerPatient.count({
      where: discontinuedWhere,
    });

    // 7. Số NB tham gia lại CT: Patients with REJOINED subStatus created in period
    const rejoinedWhere: any = {
      deletedAt: null,
      subStatus: "REJOINED",
    };
    if (Object.keys(periodFilter).length > 0) {
      rejoinedWhere.createdAt = periodFilter;
    }

    const rejoined = await prisma.cancerPatient.count({
      where: rejoinedWhere,
    });

    return NextResponse.json({
      totalPatients,
      activePatients,
      newPatients,
      transferredIn,
      transferredOut,
      discontinued,
      rejoined,
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
