import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConversations } from "@/lib/facebook";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const data = await getConversations(limit);
    const conversations = (data.data || []).map((conv: any) => ({
      id: conv.id,
      snippet: conv.snippet,
      updatedTime: conv.updated_time,
      messageCount: conv.message_count,
      unreadCount: conv.unread_count,
      participants: conv.participants?.data || [],
      // Lấy thông tin người dùng (không phải page)
      user: conv.participants?.data?.find((p: any) => p.id !== process.env.FACEBOOK_PAGE_ID) || null,
    }));

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Facebook conversations error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
