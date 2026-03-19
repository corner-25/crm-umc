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

    const treatment = await prisma.patientTreatment.findUnique({
      where: { id: params.id },
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

    if (!treatment) {
      return NextResponse.json(
        { error: "Chu kỳ điều trị không tồn tại" },
        { status: 404 }
      );
    }

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error fetching treatment:", error);
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

    const treatment = await prisma.patientTreatment.update({
      where: { id: params.id },
      data: body,
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

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error updating treatment:", error);
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
    const treatment = await prisma.patientTreatment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("Error deleting treatment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
