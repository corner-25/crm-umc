import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/leads — danh sách leads theo pipeline stage
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";

    const where: any = {
      deletedAt: null,
      leadStatus: { not: null }, // chỉ lấy leads, không lấy donors thực
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (source) where.leadSource = source;

    const leads = await prisma.donor.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        type: true,
        leadStatus: true,
        leadSource: true,
        leadNote: true,
        convertedAt: true,
        createdAt: true,
        manager: { select: { id: true, name: true } },
        _count: {
          select: { interactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group theo pipeline stage
    const pipeline = {
      NEW: leads.filter((l) => l.leadStatus === "NEW"),
      CONTACTED: leads.filter((l) => l.leadStatus === "CONTACTED"),
      INTERESTED: leads.filter((l) => l.leadStatus === "INTERESTED"),
      NEGOTIATING: leads.filter((l) => l.leadStatus === "NEGOTIATING"),
      CONVERTED: leads.filter((l) => l.leadStatus === "CONVERTED"),
      LOST: leads.filter((l) => l.leadStatus === "LOST"),
    };

    return NextResponse.json({ leads, pipeline, total: leads.length });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
