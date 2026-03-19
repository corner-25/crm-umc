import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const medication = await prisma.medication.findUnique({
      where: { id: params.id },
      include: {
        sponsors: {
          include: {
            sponsor: {
              select: {
                id: true,
                fullName: true,
                company: true,
                type: true,
              },
            },
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

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Error fetching medication:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sponsorIds, ...medicationData } = body;

    // Update medication and sponsors
    const medication = await prisma.medication.update({
      where: { id: params.id },
      data: {
        ...medicationData,
        ...(sponsorIds && {
          sponsors: {
            deleteMany: {},
            create: sponsorIds.map((sponsorId: string) => ({
              sponsorId,
              isActive: true,
            })),
          },
        }),
      },
      include: {
        sponsors: {
          include: {
            sponsor: {
              select: {
                id: true,
                fullName: true,
                company: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Error updating medication:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete
    const medication = await prisma.medication.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Error deleting medication:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
