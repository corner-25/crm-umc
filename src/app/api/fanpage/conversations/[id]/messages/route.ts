import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMessages, sendMessage } from "@/lib/facebook";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await getMessages(params.id);
    const messages = (data.data || []).map((msg: any) => ({
      id: msg.id,
      message: msg.message,
      from: msg.from,
      createdTime: msg.created_time,
      attachments: msg.attachments?.data || [],
      isFromPage: msg.from?.id === process.env.FACEBOOK_PAGE_ID,
    })).reverse(); // Mới nhất ở dưới

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Facebook messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { recipientId, text } = await request.json();
    if (!recipientId || !text?.trim()) {
      return NextResponse.json({ error: "recipientId và text là bắt buộc" }, { status: 400 });
    }

    const result = await sendMessage(recipientId, text);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Facebook send message error:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
