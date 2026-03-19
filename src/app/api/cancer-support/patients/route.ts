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
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { patientCode: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { cccd: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [patients, total] = await Promise.all([
      prisma.cancerPatient.findMany({
        where,
        skip,
        take: limit,
        include: {
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
      prisma.cancerPatient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
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

    // Check if patient code already exists
    const existingPatient = await prisma.cancerPatient.findUnique({
      where: { patientCode: body.patientCode },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: "Mã bệnh nhân đã tồn tại" },
        { status: 400 }
      );
    }

    // Clean up subStatus - convert empty string to null
    const data = {
      ...body,
      subStatus: body.subStatus === "" ? null : body.subStatus,
    };

    const patient = await prisma.cancerPatient.create({
      data,
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
