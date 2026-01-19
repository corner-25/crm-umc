import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Lấy chi tiết một thông báo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.inactiveSponsorNotification.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            tier: true,
          },
        },
        contactHistory: {
          orderBy: { contactNumber: "asc" },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật thông báo (đánh dấu đã xử lý, thêm lịch sử liên hệ)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Nếu đánh dấu đã xử lý
    if (body.isResolved !== undefined) {
      const notification = await prisma.inactiveSponsorNotification.update({
        where: { id },
        data: {
          isResolved: body.isResolved,
          resolvedAt: body.isResolved ? new Date() : null,
        },
        include: {
          donor: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              tier: true,
            },
          },
          contactHistory: {
            orderBy: { contactNumber: "asc" },
          },
        },
      });

      return NextResponse.json(notification);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
