import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trip = await prisma.charityTrip.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        location: true,
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
    return NextResponse.json({ trip });
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
    const { locationId, startDate, endDate, expectedPatients, actualPatients, demographics, notes } = body;

    const trip = await prisma.charityTrip.update({
      where: { id: params.id },
      data: {
        ...(locationId && { locationId }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(expectedPatients !== undefined && { expectedPatients }),
        ...(actualPatients !== undefined && { actualPatients }),
        ...(demographics !== undefined && { demographics }),
        ...(notes !== undefined && { notes }),
      },
      include: { location: { select: { province: true, district: true } } },
    });

    return NextResponse.json({ trip });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.charityTrip.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
