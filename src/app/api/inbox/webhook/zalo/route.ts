import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — Nhận sự kiện từ Zalo OA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zalo gửi event khi user nhắn tin vào OA
    if (body.event_name !== "user_send_text" && body.event_name !== "user_send_image") {
      return NextResponse.json({ error: 0, message: "ok" });
    }

    const senderId = body.sender?.id;
    const text = body.message?.text || (body.event_name === "user_send_image" ? "[Hình ảnh]" : "[Tin nhắn]");
    const msgId = body.message?.msg_id;

    if (!senderId) {
      return NextResponse.json({ error: 0, message: "ok" });
    }

    // Tìm hoặc tạo conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        channel_externalId: {
          channel: "ZALO",
          externalId: senderId,
        },
      },
    });

    if (!conversation) {
      // Lấy thông tin user từ Zalo
      let displayName = body.sender?.display_name || "Zalo User";
      let avatarUrl = body.sender?.avatar || undefined;

      conversation = await prisma.conversation.create({
        data: {
          channel: "ZALO",
          externalId: senderId,
          externalUserId: senderId,
          displayName,
          avatarUrl,
          status: "OPEN",
          isRead: false,
        },
      });
    }

    // Kiểm tra duplicate
    if (msgId) {
      const existing = await prisma.message.findFirst({
        where: { externalMsgId: msgId },
      });
      if (existing) {
        return NextResponse.json({ error: 0, message: "ok" });
      }
    }

    // Lưu tin nhắn
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "IN",
        content: text,
        externalMsgId: msgId,
        sentAt: new Date(body.timestamp * 1000),
      },
    });

    // Cập nhật conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), isRead: false },
    });

    return NextResponse.json({ error: 0, message: "ok" });
  } catch (error) {
    console.error("Zalo webhook error:", error);
    return NextResponse.json({ error: 1, message: "Server error" }, { status: 500 });
  }
}
