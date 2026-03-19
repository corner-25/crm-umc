import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const type = request.nextUrl.searchParams.get("type");
    const options = await prisma.customOption.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, label } = await request.json();
    if (!type || !label?.trim()) {
      return NextResponse.json({ error: "type and label required" }, { status: 400 });
    }
    const option = await prisma.customOption.create({ data: { type, label: label.trim() } });
    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
