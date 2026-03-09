import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, content } = await request.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Lưu tin nhắn vào DB
    const message = await prisma.message.create({
      data: {
        conversationId,
        direction: "OUT",
        content,
        sentById: (session.user as any).id,
      },
      include: {
        sentBy: { select: { id: true, name: true } },
      },
    });

    // Cập nhật lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Gửi ra kênh bên ngoài
    let sendSuccess = false;
    let sendError = "";

    if (conversation.channel === "FACEBOOK") {
      sendSuccess = await sendFacebookMessage(conversation.externalUserId, content);
      if (!sendSuccess) sendError = "Không thể gửi qua Facebook — kiểm tra token";
    } else if (conversation.channel === "ZALO") {
      sendSuccess = await sendZaloMessage(conversation.externalUserId, content);
      if (!sendSuccess) sendError = "Không thể gửi qua Zalo — kiểm tra token";
    } else {
      // EMAIL hoặc manual — không cần gửi API
      sendSuccess = true;
    }

    return NextResponse.json({ message, sendSuccess, sendError });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendFacebookMessage(recipientId: string, text: string): Promise<boolean> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendZaloMessage(userId: string, text: string): Promise<boolean> {
  const token = process.env.ZALO_OA_ACCESS_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch("https://openapi.zalo.me/v2.0/oa/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": token,
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: { text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
