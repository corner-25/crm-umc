import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staff = await prisma.staff.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        trips: {
          include: {
            trip: {
              include: {
                location: { select: { province: true, district: true, ward: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!staff) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ staff });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { staffCode, fullName, department, role, phone, email, isActive, notes } = body;

    if (staffCode !== undefined && staffCode) {
      const existing = await prisma.staff.findFirst({
        where: { staffCode, deletedAt: null, NOT: { id: params.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Mã nhân viên đã tồn tại" }, { status: 400 });
      }
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: {
        ...(staffCode !== undefined && { staffCode: staffCode?.trim() || null }),
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(department !== undefined && { department: department?.trim() || null }),
        ...(role !== undefined && { role: role?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.staff.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
