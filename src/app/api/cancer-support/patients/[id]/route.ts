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

    const patient = await prisma.cancerPatient.findUnique({
      where: { id: params.id },
      include: {
        treatments: {
          include: {
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
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Bệnh nhân không tồn tại" },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
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

    const patient = await prisma.cancerPatient.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
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
    const patient = await prisma.cancerPatient.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
