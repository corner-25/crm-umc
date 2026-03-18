import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { province: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
      ];
    }

    const locations = await prisma.charityLocation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { trips: true } } },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { province, district, ward, epidemiology, notes } = body;

    if (!province) {
      return NextResponse.json({ error: "Thiếu tỉnh/thành phố" }, { status: 400 });
    }

    const location = await prisma.charityLocation.create({
      data: { province, district: district || null, ward: ward || null, epidemiology: epidemiology || null, notes: notes || null },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
