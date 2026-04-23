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
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = { deletedAt: null };
    if (!includeInactive) where.isActive = true;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { staffCode: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    const staffs = await prisma.staff.findMany({
      where,
      orderBy: { fullName: "asc" },
      include: {
        _count: { select: { trips: true } },
      },
    });

    return NextResponse.json({ staffs });
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
    const { staffCode, fullName, department, role, phone, email, notes } = body;

    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Thiếu họ tên" }, { status: 400 });
    }

    if (staffCode) {
      const existing = await prisma.staff.findFirst({
        where: { staffCode, deletedAt: null },
      });
      if (existing) {
        return NextResponse.json({ error: "Mã nhân viên đã tồn tại" }, { status: 400 });
      }
    }

    const staff = await prisma.staff.create({
      data: {
        staffCode: staffCode?.trim() || null,
        fullName: fullName.trim(),
        department: department?.trim() || null,
        role: role?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
