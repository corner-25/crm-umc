import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["REMINDER", "CONTRACT", "TREATMENT", "FANPAGE", "WAREHOUSE"] as const;
type AlertType = (typeof VALID_TYPES)[number];

// POST /api/alerts/dismiss — ẩn 1 thông báo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { alertType, alertKey } = await request.json();
    if (!alertType || !alertKey) {
      return NextResponse.json({ error: "Thiếu alertType/alertKey" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(alertType as AlertType)) {
      return NextResponse.json({ error: "alertType không hợp lệ" }, { status: 400 });
    }

    await prisma.dismissedAlert.upsert({
      where: { alertType_alertKey: { alertType, alertKey } },
      update: { dismissedAt: new Date(), dismissedBy: (session.user as any)?.id || null },
      create: {
        alertType,
        alertKey,
        dismissedBy: (session.user as any)?.id || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/alerts/dismiss?alertType=X&alertKey=Y — bỏ ẩn
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get("alertType");
    const alertKey = searchParams.get("alertKey");
    if (!alertType || !alertKey) {
      return NextResponse.json({ error: "Thiếu tham số" }, { status: 400 });
    }

    await prisma.dismissedAlert.deleteMany({
      where: { alertType, alertKey },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
