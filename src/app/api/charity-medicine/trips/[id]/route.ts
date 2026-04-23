import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyTripFundings, rollbackTripFundings, buildTripName } from "@/lib/charity-trip-funding";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trip = await prisma.charityTrip.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        location: true,
        sponsor: { select: { id: true, fullName: true, type: true } },
        staffs: {
          include: {
            staff: true,
          },
        },
        gifts: {
          include: { giftType: true },
        },
        fundings: true,
        transactions: {
          orderBy: { transactionDate: "desc" },
          include: {
            batch: {
              include: { medicine: { select: { code: true, name: true, unit: true } } },
            },
          },
        },
        demandStats: {
          include: { medicine: { select: { code: true, name: true, unit: true } } },
        },
      },
    });

    if (!trip) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    // Ghép thêm donor info cho fundings
    const donationIds = trip.fundings.map((f) => f.donationCashId);
    const donations = donationIds.length
      ? await prisma.donationCash.findMany({
          where: { id: { in: donationIds } },
          include: { donor: { select: { id: true, fullName: true, type: true } } },
        })
      : [];
    const donationMap = new Map(donations.map((d) => [d.id, d]));

    const fundingsWithDonor = trip.fundings.map((f) => ({
      ...f,
      donation: donationMap.get(f.donationCashId) || null,
    }));

    return NextResponse.json({ trip: { ...trip, fundings: fundingsWithDonor } });
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
      staffIds,
      gifts,
      fundings,
    } = body;

    const currentTrip = await prisma.charityTrip.findUnique({
      where: { id: params.id },
      include: { location: true },
    });
    if (!currentTrip) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    // Resolve locationId thật để build tripName nếu cần
    let resolvedLocation = currentTrip.location;
    if (locationId && locationId !== currentTrip.locationId) {
      const loc = await prisma.charityLocation.findUnique({ where: { id: locationId } });
      if (!loc) return NextResponse.json({ error: "Địa điểm không hợp lệ" }, { status: 400 });
      resolvedLocation = loc;
    }

    const resolvedName = tripName?.trim() || buildTripName(resolvedLocation);
    const resolvedStartDate = startDate ? new Date(startDate) : currentTrip.startDate;

    await prisma.$transaction(async (tx) => {
      await tx.charityTrip.update({
        where: { id: params.id },
        data: {
          ...(tripName !== undefined && { tripName: resolvedName }),
          ...(locationId && { locationId }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(expectedPatients !== undefined && { expectedPatients }),
          ...(actualPatients !== undefined && { actualPatients }),
          ...(distanceKm !== undefined && { distanceKm }),
          ...(transport !== undefined && { transport: transport || null }),
          ...(targetAudience !== undefined && { targetAudience: targetAudience || null }),
          ...(demographics !== undefined && { demographics: demographics || null }),
          ...(notes !== undefined && { notes: notes || null }),
          ...(sponsorId !== undefined && { sponsorId: sponsorId || null }),
          ...(sponsorNote !== undefined && { sponsorNote: sponsorNote || null }),
        },
      });

      // Replace staffs nếu client gửi mảng
      if (Array.isArray(staffIds)) {
        await tx.charityTripStaff.deleteMany({ where: { tripId: params.id } });
        if (staffIds.length > 0) {
          await tx.charityTripStaff.createMany({
            data: staffIds.map((staffId: string) => ({ tripId: params.id, staffId })),
            skipDuplicates: true,
          });
        }
      }

      // Replace gifts nếu client gửi mảng
      if (Array.isArray(gifts)) {
        await tx.tripGift.deleteMany({ where: { tripId: params.id } });
        if (gifts.length > 0) {
          await tx.tripGift.createMany({
            data: gifts
              .filter((g: any) => g.giftTypeId && g.quantity > 0)
              .map((g: any) => ({
                tripId: params.id,
                giftTypeId: g.giftTypeId,
                quantity: g.quantity,
                notes: g.notes || null,
              })),
          });
        }
      }

      // Replace fundings: rollback cũ → apply mới
      if (Array.isArray(fundings)) {
        await rollbackTripFundings(tx, params.id);
        if (fundings.length > 0) {
          await applyTripFundings(tx, {
            tripId: params.id,
            tripName: resolvedName,
            tripStartDate: resolvedStartDate,
            fundings,
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.$transaction(async (tx) => {
      // Rollback fundings trước khi soft-delete trip
      await rollbackTripFundings(tx, params.id);
      await tx.charityTrip.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
