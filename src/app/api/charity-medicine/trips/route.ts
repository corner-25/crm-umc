import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyTripFundings, buildTripName } from "@/lib/charity-trip-funding";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId") || "";

    const where: any = { deletedAt: null };
    if (locationId) where.locationId = locationId;

    const trips = await prisma.charityTrip.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        location: { select: { id: true, province: true, district: true, ward: true } },
        sponsor: { select: { id: true, fullName: true, type: true } },
        staffs: {
          include: {
            staff: { select: { id: true, fullName: true, staffCode: true, department: true, role: true } },
          },
        },
        gifts: {
          include: {
            giftType: { select: { id: true, name: true, unit: true } },
          },
        },
        fundings: true,
        _count: { select: { transactions: true, demandStats: true } },
      },
    });

    return NextResponse.json({ trips });
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
    const {
      tripName,
      locationId,
      startDate,
      endDate,
      expectedPatients,
      actualPatients,
      distanceKm,
      transport,
      targetAudience,
      demographics,
      notes,
      sponsorId,
      sponsorNote,
      staffIds,     // string[] - danh sách NVYT
      gifts,        // [{giftTypeId, quantity, notes}]
      fundings,     // [{source: "EXISTING"|"NEW", donationCashId?, donorId?, amount, notes?}]
    } = body;

    if (!locationId || !startDate || !endDate) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Auto-gen mã chuyến: TT-YYYY-XXX (reset theo năm)
    const year = new Date(startDate).getFullYear();
    const prefix = `TT-${year}-`;
    const latestInYear = await prisma.charityTrip.findFirst({
      where: { tripCode: { startsWith: prefix } },
      orderBy: { tripCode: "desc" },
      select: { tripCode: true },
    });
    let nextSeq = 1;
    if (latestInYear?.tripCode) {
      const parts = latestInYear.tripCode.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(lastNum)) nextSeq = lastNum + 1;
    }
    const tripCode = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    const location = await prisma.charityLocation.findUnique({
      where: { id: locationId },
    });
    if (!location) return NextResponse.json({ error: "Địa điểm không hợp lệ" }, { status: 400 });

    const computedName = tripName?.trim() || buildTripName(location);

    const trip = await prisma.$transaction(async (tx) => {
      // 1. Tạo chuyến
      const created = await tx.charityTrip.create({
        data: {
          tripCode,
          tripName: computedName,
          locationId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          expectedPatients: expectedPatients ?? null,
          actualPatients: actualPatients ?? null,
          distanceKm: distanceKm ?? null,
          transport: transport || null,
          targetAudience: targetAudience || null,
          demographics: demographics || null,
          notes: notes || null,
          sponsorId: sponsorId || null,
          sponsorNote: sponsorNote || null,
        },
      });

      // 2. Gắn NVYT
      if (Array.isArray(staffIds) && staffIds.length > 0) {
        await tx.charityTripStaff.createMany({
          data: staffIds.map((staffId: string) => ({
            tripId: created.id,
            staffId,
          })),
          skipDuplicates: true,
        });
      }

      // 3. Gắn quà
      if (Array.isArray(gifts) && gifts.length > 0) {
        await tx.tripGift.createMany({
          data: gifts
            .filter((g: any) => g.giftTypeId && g.quantity > 0)
            .map((g: any) => ({
              tripId: created.id,
              giftTypeId: g.giftTypeId,
              quantity: g.quantity,
              notes: g.notes || null,
            })),
        });
      }

      // 4. Xử lý nguồn tài trợ
      if (Array.isArray(fundings) && fundings.length > 0) {
        await applyTripFundings(tx, {
          tripId: created.id,
          tripName: computedName,
          tripStartDate: new Date(startDate),
          fundings,
        });
      }

      return created;
    });

    const full = await prisma.charityTrip.findUnique({
      where: { id: trip.id },
      include: {
        location: true,
        sponsor: true,
        staffs: { include: { staff: true } },
        gifts: { include: { giftType: true } },
        fundings: true,
      },
    });

    return NextResponse.json({ trip: full }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
