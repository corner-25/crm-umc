import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "crm_umc_webhook";

// GET — Facebook dùng để verify webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Nhận tin nhắn từ Facebook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "ok" });
    }

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        // Chỉ xử lý tin nhắn từ người dùng (không phải echo)
        if (!event.message || event.message.is_echo) continue;

        const senderId = event.sender.id;
        const text = event.message.text || "[Đính kèm không có văn bản]";
        const externalMsgId = event.message.mid;

        // Tìm hoặc tạo conversation
        let conversation = await prisma.conversation.findUnique({
          where: {
            channel_externalId: {
              channel: "FACEBOOK",
              externalId: senderId,
            },
          },
        });

        if (!conversation) {
          // Lấy tên người dùng từ Facebook Graph API
          let displayName = "Facebook User";
          try {
            const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
            if (pageToken) {
              const profileRes = await fetch(
                `https://graph.facebook.com/${senderId}?fields=name,profile_pic&access_token=${pageToken}`
              );
              if (profileRes.ok) {
                const profile = await profileRes.json();
                displayName = profile.name || displayName;
              }
            }
          } catch {}

          conversation = await prisma.conversation.create({
            data: {
              channel: "FACEBOOK",
              externalId: senderId,
              externalUserId: senderId,
              displayName,
              status: "OPEN",
              isRead: false,
            },
          });
        }

        // Kiểm tra tin nhắn đã lưu chưa (tránh duplicate)
        const existing = await prisma.message.findFirst({
          where: { externalMsgId },
        });
        if (existing) continue;

        // Lưu tin nhắn
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: "IN",
            content: text,
            externalMsgId,
            sentAt: new Date(event.timestamp),
          },
        });

        // Cập nhật conversation
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date(), isRead: false },
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Facebook webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
