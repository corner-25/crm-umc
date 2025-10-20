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

    const donor = await prisma.donor.findUnique({
      where: { id: params.id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cashDonations: {
          orderBy: { receivedDate: "desc" },
        },
        inKindDonations: {
          orderBy: { createdAt: "desc" },
        },
        volunteerDonations: {
          orderBy: { startDate: "desc" },
        },
        interactions: {
          orderBy: { date: "desc" },
        },
        emailLogs: {
          orderBy: { sentAt: "desc" },
        },
        reminders: {
          where: { isCompleted: false },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    return NextResponse.json(donor);
  } catch (error) {
    console.error("Error fetching donor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const donor = await prisma.donor.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(donor);
  } catch (error) {
    console.error("Error updating donor:", error);
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
    const donor = await prisma.donor.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(donor);
  } catch (error) {
    console.error("Error deleting donor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
