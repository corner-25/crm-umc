import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trips = await prisma.charityTrip.findMany({
      where: { deletedAt: null },
      include: {
        location: { select: { province: true, district: true, ward: true } },
        transactions: {
          where: { type: "EXPORT" },
          include: {
            batch: { select: { unitCost: true } },
          },
        },
      },
    });

    // Aggregate by province
    const map: Record<string, {
      province: string;
      tripCount: number;
      totalPatients: number;
      totalMedicineCost: number;
      districts: Set<string>;
      wards: Set<string>;
      lastVisit: string | null;
      trips: { tripCode: string; date: string; district: string; ward: string; patients: number; cost: number }[];
    }> = {};

    for (const trip of trips) {
      const province = trip.location?.province || "Không rõ";
      if (!map[province]) {
        map[province] = {
          province,
          tripCount: 0,
          totalPatients: 0,
          totalMedicineCost: 0,
          districts: new Set(),
          wards: new Set(),
          lastVisit: null,
          trips: [],
        };
      }

      const entry = map[province];
      entry.tripCount += 1;
      entry.totalPatients += trip.actualPatients || 0;

      const tripCost = trip.transactions.reduce((sum, t) => {
        return sum + (t.quantity * Number(t.batch?.unitCost || 0));
      }, 0);
      entry.totalMedicineCost += tripCost;

      if (trip.location?.district) entry.districts.add(trip.location.district);
      if (trip.location?.ward) entry.wards.add(trip.location.ward);

      const tripDate = trip.startDate ? new Date(trip.startDate).toISOString() : null;
      if (!entry.lastVisit || (tripDate && tripDate > entry.lastVisit)) {
        entry.lastVisit = tripDate;
      }

      entry.trips.push({
        tripCode: trip.tripCode,
        date: trip.startDate ? new Date(trip.startDate).toLocaleDateString("vi-VN") : "—",
        district: trip.location?.district || "",
        ward: trip.location?.ward || "",
        patients: trip.actualPatients || 0,
        cost: tripCost,
      });
    }

    const result = Object.values(map)
      .map((e) => ({
        province: e.province,
        tripCount: e.tripCount,
        totalPatients: e.totalPatients,
        totalMedicineCost: e.totalMedicineCost,
        districts: Array.from(e.districts),
        wards: Array.from(e.wards),
        lastVisit: e.lastVisit,
        trips: e.trips.sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => b.tripCount - a.tripCount);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
