import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseVnDateStart, parseVnDateEnd } from "@/lib/date-filter";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const donorId = searchParams.get("donorId");
    const donorName = searchParams.get("donorName");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const hasRemaining = searchParams.get("hasRemaining"); // "true" = chưa sử dụng hết
    const purpose = searchParams.get("purpose") || ""; // filter theo mục đích
    const status = searchParams.get("status") || ""; // received | partial | used
    const custodian = searchParams.get("custodian") || ""; // filter theo người giữ tiền
    const sortBy = searchParams.get("sortBy") || "";
    const sortDir = (searchParams.get("sortDir") === "asc" ? "asc" : "desc") as "asc" | "desc";

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (donorId) where.donorId = donorId;
    if (donorName) where.donor = { fullName: { contains: donorName, mode: "insensitive" } };

    if (fromDate || toDate) {
      where.receivedDate = {};
      const from = parseVnDateStart(fromDate);
      const to = parseVnDateEnd(toDate);
      if (from) where.receivedDate.gte = from;
      if (to) where.receivedDate.lte = to;
    }

    // Nếu filter hasRemaining, dùng raw query để so sánh 2 cột trực tiếp ở DB level
    if (hasRemaining === "true") {
      const whereConditions: string[] = [`dc."deletedAt" IS NULL`, `dc."usedAmount" < dc.amount`];
      const queryParams: any[] = [];
      let paramIdx = 1;

      if (donorId) {
        whereConditions.push(`dc."donorId" = $${paramIdx++}`);
        queryParams.push(donorId);
      }
      if (donorName) {
        whereConditions.push(`d."fullName" ILIKE $${paramIdx++}`);
        queryParams.push(`%${donorName}%`);
      }
      const fromVn = parseVnDateStart(fromDate);
      if (fromVn) {
        whereConditions.push(`dc."receivedDate" >= $${paramIdx++}`);
        queryParams.push(fromVn);
      }
      const toVn = parseVnDateEnd(toDate);
      if (toVn) {
        whereConditions.push(`dc."receivedDate" <= $${paramIdx++}`);
        queryParams.push(toVn);
      }
      if (purpose) {
        whereConditions.push(`dc.purpose ILIKE $${paramIdx++}`);
        queryParams.push(`%${purpose}%`);
      }
      if (custodian) {
        whereConditions.push(`dc.custodian ILIKE $${paramIdx++}`);
        queryParams.push(`%${custodian}%`);
      }
      if (status === "received") whereConditions.push(`dc."usedAmount" = 0`);
      else if (status === "partial") whereConditions.push(`dc."usedAmount" > 0 AND dc."usedAmount" < dc.amount`);
      else if (status === "used") whereConditions.push(`dc."usedAmount" >= dc.amount`);

      const whereClause = whereConditions.join(" AND ");

      const orderClause =
        sortBy === "amount" ? `dc.amount ${sortDir === "asc" ? "ASC" : "DESC"}` :
        sortBy === "donor" ? `d."fullName" ${sortDir === "asc" ? "ASC" : "DESC"}` :
        sortBy === "remaining" ? `(dc.amount - dc."usedAmount") ${sortDir === "asc" ? "ASC" : "DESC"}` :
        `dc."receivedDate" DESC`;

      const [donations, countResult] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(
          `SELECT dc.*, row_to_json(d) as donor FROM donation_cash dc
           JOIN donors d ON d.id = dc."donorId"
           WHERE ${whereClause}
           ORDER BY ${orderClause}
           LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          ...queryParams, limit, skip
        ),
        prisma.$queryRawUnsafe<[{ count: bigint }]>(
          `SELECT COUNT(*) as count FROM donation_cash dc WHERE ${whereClause}`,
          ...queryParams
        ),
      ]);

      const total = Number(countResult[0].count);
      return NextResponse.json({
        donations,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // Use raw query to support sorting by computed "remaining" column
    const whereConditions: string[] = [`dc."deletedAt" IS NULL`];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (donorId) {
      whereConditions.push(`dc."donorId" = $${paramIdx++}`);
      queryParams.push(donorId);
    }
    if (donorName) {
      whereConditions.push(`d."fullName" ILIKE $${paramIdx++}`);
      queryParams.push(`%${donorName}%`);
    }
    const fromVn2 = parseVnDateStart(fromDate);
    if (fromVn2) {
      whereConditions.push(`dc."receivedDate" >= $${paramIdx++}`);
      queryParams.push(fromVn2);
    }
    const toVn2 = parseVnDateEnd(toDate);
    if (toVn2) {
      whereConditions.push(`dc."receivedDate" <= $${paramIdx++}`);
      queryParams.push(toVn2);
    }
    if (purpose) {
      whereConditions.push(`dc.purpose ILIKE $${paramIdx++}`);
      queryParams.push(`%${purpose}%`);
    }
    if (custodian) {
      whereConditions.push(`dc.custodian ILIKE $${paramIdx++}`);
      queryParams.push(`%${custodian}%`);
    }
    if (status === "received") whereConditions.push(`dc."usedAmount" = 0`);
    else if (status === "partial") whereConditions.push(`dc."usedAmount" > 0 AND dc."usedAmount" < dc.amount`);
    else if (status === "used") whereConditions.push(`dc."usedAmount" >= dc.amount`);

    const whereClause = whereConditions.join(" AND ");

    const orderClause =
      sortBy === "amount" ? `dc.amount ${sortDir === "asc" ? "ASC" : "DESC"}` :
      sortBy === "donor" ? `d."fullName" ${sortDir === "asc" ? "ASC" : "DESC"}` :
      sortBy === "remaining" ? `(dc.amount - dc."usedAmount") ${sortDir === "asc" ? "ASC" : "DESC"}` :
      sortBy === "receivedDate" ? `dc."receivedDate" ${sortDir === "asc" ? "ASC" : "DESC"}` :
      `dc."receivedDate" DESC`;

    const [donations, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT dc.*, row_to_json(d) as donor FROM donation_cash dc
         JOIN donors d ON d.id = dc."donorId"
         WHERE ${whereClause}
         ORDER BY ${orderClause}
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...queryParams, limit, skip
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM donation_cash dc
         JOIN donors d ON d.id = dc."donorId"
         WHERE ${whereClause}`,
        ...queryParams
      ),
    ]);

    const total = Number(countResult[0].count);

    return NextResponse.json({
      donations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Error fetching cash donations:", error);
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

    // Kiểm tra trùng lắp: cùng nhà tài trợ + cùng số tiền (bỏ qua nếu force=true)
    if (!body.force && body.donorId && body.amount) {
      const existing = await prisma.donationCash.findFirst({
        where: {
          deletedAt: null,
          donorId: body.donorId,
          amount: body.amount,
        },
        include: {
          donor: { select: { fullName: true } },
        },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: "DUPLICATE",
            duplicate: {
              id: existing.id,
              donorName: existing.donor.fullName,
              amount: Number(existing.amount),
              currency: existing.currency,
              receivedDate: existing.receivedDate,
            },
          },
          { status: 409 }
        );
      }
    }

    // Tính lại usedAmount từ usageItems
    const { force: _force, ...donationData } = body;
    const usageItems = Array.isArray(donationData.usageItems) ? donationData.usageItems : [];
    const usedAmount = usageItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    // Serialize purpose array to JSON string for DB storage
    const purpose = Array.isArray(donationData.purpose)
      ? JSON.stringify(donationData.purpose)
      : donationData.purpose;

    const donation = await prisma.donationCash.create({
      data: {
        ...donationData,
        purpose,
        receivedDate: new Date(donationData.receivedDate),
        usedAmount,
      },
      include: {
        donor: true,
      },
    });

    return NextResponse.json(donation, { status: 201 });
  } catch (error) {
    console.error("Error creating cash donation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
