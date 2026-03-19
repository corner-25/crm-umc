import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // upcoming, today, overdue
    const isCompleted = searchParams.get("completed");

    const where: any = {
      deletedAt: null,
    };

    if (isCompleted !== null) {
      where.isCompleted = isCompleted === "true";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (filter === "today") {
      where.dueDate = {
        gte: today,
        lt: tomorrow,
      };
    } else if (filter === "upcoming") {
      where.dueDate = {
        gte: tomorrow,
      };
    } else if (filter === "overdue") {
      where.dueDate = {
        lt: today,
      };
      where.isCompleted = false;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const reminder = await prisma.reminder.create({
      data: {
        ...body,
        dueDate: new Date(body.dueDate),
      },
      include: {
        donor: true,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
