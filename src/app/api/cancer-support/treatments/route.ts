import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const medicationId = searchParams.get("medicationId");
    const status = searchParams.get("status");

    const where: any = {
      deletedAt: null,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (medicationId) {
      where.medicationId = medicationId;
    }

    if (status) {
      where.status = status;
    }

    const treatments = await prisma.patientTreatment.findMany({
      where,
      include: {
        patient: true,
        medication: true,
        sponsor: {
          select: {
            id: true,
            fullName: true,
            company: true,
          },
        },
      },
      orderBy: {
        treatmentDate: "desc",
      },
    });

    return NextResponse.json({ treatments });
  } catch (error) {
    console.error("Error fetching treatments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, medicationId, treatmentDate } = body;

    // Lấy thông tin thuốc để tính toán
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      include: {
        sponsors: {
          where: { isActive: true },
          include: {
            sponsor: true,
          },
        },
      },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Thuốc không tồn tại" },
        { status: 404 }
      );
    }

    // Đếm số chu kỳ hiện tại cho bệnh nhân + thuốc này
    const currentCycleCount = await prisma.patientTreatment.count({
      where: {
        patientId,
        medicationId,
        deletedAt: null,
      },
    });

    const cycleNumber = currentCycleCount + 1;

    // Tính ngày chu kỳ tiếp theo
    const treatmentDateObj = new Date(treatmentDate);
    const nextCycleDate = addDays(treatmentDateObj, medication.cycleDays);

    // Tính toán tài trợ theo chính sách
    let isSponsored = false;
    let sponsorId = null;
    let donationAmount = null;

    if (medication.sponsorPolicy === "BUY_1_GET_1") {
      // Chu kỳ chẵn được tài trợ
      isSponsored = cycleNumber % 2 === 0;
    } else if (medication.sponsorPolicy === "BUY_2_GET_1") {
      // Chu kỳ chia hết cho 3 được tài trợ
      isSponsored = cycleNumber % 3 === 0;
    } else if (medication.sponsorPolicy === "BUY_3_GET_1") {
      // Chu kỳ chia hết cho 4 được tài trợ
      isSponsored = cycleNumber % 4 === 0;
    } else if (medication.sponsorPolicy === "FULL_SPONSOR") {
      // Tài trợ 100%
      isSponsored = true;
    }

    // Nếu được tài trợ, lấy sponsor đầu tiên (hoặc có thể để user chọn)
    if (isSponsored && medication.sponsors.length > 0) {
      sponsorId = body.sponsorId || medication.sponsors[0].sponsorId;
      donationAmount = medication.unitPrice;
    }

    // Sử dụng transaction để tạo cả treatment và donation
    const result = await prisma.$transaction(async (tx) => {
      // Tạo treatment
      const treatment = await tx.patientTreatment.create({
        data: {
          patientId,
          medicationId,
          cycleNumber,
          treatmentDate: treatmentDateObj,
          nextCycleDate,
          isSponsored,
          sponsorId,
          donationAmount,
          status: body.status || "UPCOMING",
          notes: body.notes,
        },
        include: {
          patient: true,
          medication: true,
          sponsor: {
            select: {
              id: true,
              fullName: true,
              company: true,
            },
          },
        },
      });

      // Nếu được tài trợ, tự động tạo donation
      if (isSponsored && sponsorId && donationAmount) {
        await tx.donationInKind.create({
          data: {
            donorId: sponsorId,
            itemName: medication.name,
            category: "MEDICINE",
            quantity: 1,
            unit: "liều",
            condition: "NEW",
            estimatedValue: donationAmount,
            receivingLocation: "Bệnh viện",
            storageLocation: "Kho thuốc",
            distributionStatus: "RECEIVED",
            imageUrls: [],
          },
        });
      }

      return treatment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating treatment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
