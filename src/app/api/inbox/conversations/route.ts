import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "OPEN";
    const channel = searchParams.get("channel");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status !== "all") where.status = status;
    if (channel) where.channel = channel;
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { donor: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          donor: { select: { id: true, fullName: true, phone: true } },
          assignedTo: { select: { id: true, name: true } },
          messages: {
            orderBy: { sentAt: "desc" },
            take: 1,
            select: { content: true, direction: true, sentAt: true },
          },
        },
        orderBy: { lastMessageAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Unread count
    const unreadCount = await prisma.conversation.count({
      where: { status: "OPEN", isRead: false },
    });

    return NextResponse.json({
      conversations,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
