import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    const type = searchParams.get("type") || "";
    const tier = searchParams.get("tier") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (tier) {
      where.tier = tier;
    }

    // Custom ordering: VIP first, then REGULAR, NEW, POTENTIAL
    // Then by total donation count (descending)
    const [donors, total] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          d.*,
          json_build_object('id', u.id, 'name', u.name, 'email', u.email) as manager,
          json_build_object(
            'cashDonations', COALESCE(cash_count.count, 0),
            'inKindDonations', COALESCE(inkind_count.count, 0),
            'volunteerDonations', COALESCE(volunteer_count.count, 0)
          ) as "_count",
          (COALESCE(cash_count.count, 0) + COALESCE(inkind_count.count, 0) + COALESCE(volunteer_count.count, 0)) as total_donations
        FROM donors d
        LEFT JOIN users u ON d."managerId" = u.id
        LEFT JOIN (
          SELECT "donorId", COUNT(*)::int as count FROM donation_cash WHERE "deletedAt" IS NULL GROUP BY "donorId"
        ) cash_count ON d.id = cash_count."donorId"
        LEFT JOIN (
          SELECT "donorId", COUNT(*)::int as count FROM donation_in_kind WHERE "deletedAt" IS NULL GROUP BY "donorId"
        ) inkind_count ON d.id = inkind_count."donorId"
        LEFT JOIN (
          SELECT "donorId", COUNT(*)::int as count FROM donation_volunteer WHERE "deletedAt" IS NULL GROUP BY "donorId"
        ) volunteer_count ON d.id = volunteer_count."donorId"
        WHERE d."deletedAt" IS NULL
        ${search ? Prisma.sql`AND (
          d."fullName" ILIKE ${`%${search}%`} OR
          d.email ILIKE ${`%${search}%`} OR
          d.phone ILIKE ${`%${search}%`}
        )` : Prisma.empty}
        ${type ? Prisma.sql`AND d.type = ${type}::"DonorType"` : Prisma.empty}
        ${tier ? Prisma.sql`AND d.tier = ${tier}::"DonorTier"` : Prisma.empty}
        ORDER BY
          CASE d.tier
            WHEN 'VIP' THEN 1
            WHEN 'REGULAR' THEN 2
            WHEN 'NEW' THEN 3
            WHEN 'POTENTIAL' THEN 4
          END,
          total_donations DESC,
          d."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.donor.count({ where }),
    ]);

    return NextResponse.json({
      donors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching donors:", error);
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

    // Kiểm tra trùng lắp tên hoặc SĐT
    if (!body.isAnonymous) {
      const duplicateWhere: any[] = [];
      if (body.fullName) duplicateWhere.push({ fullName: { equals: body.fullName, mode: "insensitive" } });
      if (body.phone) duplicateWhere.push({ phone: body.phone });

      if (duplicateWhere.length > 0) {
        const existing = await prisma.donor.findFirst({
          where: { deletedAt: null, OR: duplicateWhere },
          select: { id: true, fullName: true, phone: true },
        });
        if (existing) {
          return NextResponse.json(
            { error: "DUPLICATE", duplicate: existing },
            { status: 409 }
          );
        }
      }
    }

    // Tự động sinh anonymousCode nếu là giấu tên
    let anonymousCode: string | undefined;
    let fullName: string | undefined;
    if (body.isAnonymous) {
      const count = await prisma.donor.count({ where: { isAnonymous: true, deletedAt: null } });
      anonymousCode = `Mạnh thường quân ẩn danh ${String(count + 1).padStart(4, "0")}`;
      fullName = anonymousCode;
    }

    const donor = await prisma.donor.create({
      data: {
        fullName: fullName ?? body.fullName ?? "",
        isAnonymous: body.isAnonymous ?? false,
        anonymousCode: anonymousCode ?? null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        type: body.type,
        tier: body.tier,
        occupation: body.occupation || null,
        company: body.company || null,
        position: body.position || null,
        birthday: body.birthday ? new Date(body.birthday) : null,
        firstDonationDate: body.firstDonationDate ? new Date(body.firstDonationDate) : null,
        personalInterests: body.personalInterests || null,
        areasOfInterest: body.areasOfInterest ?? [],
        notes: body.notes || null,
        isPatient: body.isPatient ?? false,
        isPatientFamily: body.isPatientFamily ?? false,
        leadStatus: body.leadStatus ?? null,
        leadSource: body.leadSource ?? null,
        leadNote: body.leadNote || null,
        managerId: session.user.id,
      },
    });

    return NextResponse.json(donor, { status: 201 });
  } catch (error) {
    console.error("Error creating donor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
