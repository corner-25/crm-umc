import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const posts = await prisma.fanpagePost.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Fanpage posts GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const post = await prisma.fanpagePost.create({
      data: {
        title: body.title,
        scheduledAt: new Date(body.scheduledAt),
        content: body.content || null,
        imageUrl: body.imageUrl || null,
        status: body.status || "SCHEDULED",
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Fanpage posts POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
