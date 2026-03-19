import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Thêm lịch sử liên hệ mới
export async function POST(
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

    // Kiểm tra notification tồn tại
    const notification = await prisma.inactiveSponsorNotification.findUnique({
      where: { id },
      include: {
        contactHistory: {
          orderBy: { contactNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Tính số lần liên hệ tiếp theo
    const nextContactNumber =
      (notification.contactHistory[0]?.contactNumber || 0) + 1;

    // Tạo lịch sử liên hệ mới
    const contactHistory = await prisma.sponsorContactHistory.create({
      data: {
        notificationId: id,
        contactNumber: nextContactNumber,
        contactDate: body.contactDate ? new Date(body.contactDate) : new Date(),
        notes: body.notes || null,
      },
    });

    // Trả về notification đã cập nhật
    const updatedNotification =
      await prisma.inactiveSponsorNotification.findUnique({
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

    return NextResponse.json({
      contactHistory,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error adding contact history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
