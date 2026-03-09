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

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        donor: { select: { id: true, fullName: true, phone: true, email: true, tier: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: {
          orderBy: { sentAt: "asc" },
          include: {
            sentBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Mark as read
    await prisma.conversation.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: body,
      include: {
        donor: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
