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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [medications, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        skip,
        take: limit,
        include: {
          sponsors: {
            include: {
              sponsor: {
                select: {
                  id: true,
                  fullName: true,
                  company: true,
                  type: true,
                },
              },
            },
            where: {
              isActive: true,
            },
          },
          _count: {
            select: {
              treatments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.medication.count({ where }),
    ]);

    return NextResponse.json({
      medications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching medications:", error);
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
    const { sponsorIds, ...medicationData } = body;

    const medication = await prisma.medication.create({
      data: {
        ...medicationData,
        sponsors: {
          create: sponsorIds?.map((sponsorId: string) => ({
            sponsorId,
            isActive: true,
          })) || [],
        },
      },
      include: {
        sponsors: {
          include: {
            sponsor: {
              select: {
                id: true,
                fullName: true,
                company: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("Error creating medication:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
