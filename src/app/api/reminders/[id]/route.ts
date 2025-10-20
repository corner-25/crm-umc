import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const data: any = { ...body };

    if (body.dueDate) {
      data.dueDate = new Date(body.dueDate);
    }

    // If marking as completed, set completedAt
    if (body.isCompleted === true && !body.completedAt) {
      data.completedAt = new Date();
    }

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data,
      include: {
        donor: true,
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
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

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
