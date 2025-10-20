import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const donorId = searchParams.get("donorId");

    const where: any = {
      deletedAt: null,
    };

    if (donorId) {
      where.donorId = donorId;
    }

    const interactions = await prisma.interaction.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error("Fetch interactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch interactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { donorId, type, date, subject, notes } = body;

    // Validate required fields
    if (!donorId || !type || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const interaction = await prisma.interaction.create({
      data: {
        donorId,
        type,
        date: new Date(date),
        subject,
        notes,
      },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error("Create interaction error:", error);
    return NextResponse.json(
      { error: "Failed to create interaction" },
      { status: 500 }
    );
  }
}
