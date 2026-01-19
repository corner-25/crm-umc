import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Lấy danh sách thông báo nhà tài trợ không hoạt động
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get("includeResolved") === "true";

    const notifications = await prisma.inactiveSponsorNotification.findMany({
      where: includeResolved ? {} : { isResolved: false },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            tier: true,
          },
        },
        contactHistory: {
          orderBy: { contactNumber: "asc" },
        },
      },
      orderBy: { notifiedAt: "desc" },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching inactive sponsor notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Kiểm tra và tạo thông báo mới cho nhà tài trợ không hoạt động (3 tháng)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Tìm tất cả nhà tài trợ đã có ít nhất 1 khoản tài trợ
    // nhưng không có khoản nào trong 3 tháng gần đây
    const inactiveDonors = await prisma.$queryRaw<
      Array<{
        id: string;
        fullName: string;
        phone: string | null;
        email: string | null;
        lastDonationDate: Date | null;
      }>
    >`
      WITH donor_last_donations AS (
        SELECT
          d.id,
          d."fullName",
          d.phone,
          d.email,
          GREATEST(
            COALESCE(MAX(dc."receivedDate"), '1900-01-01'::timestamp),
            COALESCE(MAX(dik."createdAt"), '1900-01-01'::timestamp),
            COALESCE(MAX(dv."startDate"), '1900-01-01'::timestamp)
          ) as "lastDonationDate"
        FROM donors d
        LEFT JOIN donation_cash dc ON d.id = dc."donorId" AND dc."deletedAt" IS NULL
        LEFT JOIN donation_in_kind dik ON d.id = dik."donorId" AND dik."deletedAt" IS NULL
        LEFT JOIN donation_volunteer dv ON d.id = dv."donorId" AND dv."deletedAt" IS NULL
        WHERE d."deletedAt" IS NULL
        GROUP BY d.id, d."fullName", d.phone, d.email
        HAVING (
          COUNT(dc.id) > 0 OR COUNT(dik.id) > 0 OR COUNT(dv.id) > 0
        )
      )
      SELECT
        dld.id,
        dld."fullName",
        dld.phone,
        dld.email,
        dld."lastDonationDate"
      FROM donor_last_donations dld
      LEFT JOIN inactive_sponsor_notifications isn
        ON dld.id = isn."donorId" AND isn."isResolved" = false
      WHERE dld."lastDonationDate" < ${threeMonthsAgo}
        AND dld."lastDonationDate" > '1900-01-01'::timestamp
        AND isn.id IS NULL
    `;

    // Tạo thông báo mới cho các nhà tài trợ không hoạt động
    const newNotifications = [];
    for (const donor of inactiveDonors) {
      const notification = await prisma.inactiveSponsorNotification.create({
        data: {
          donorId: donor.id,
          lastDonationDate: donor.lastDonationDate,
        },
        include: {
          donor: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              tier: true,
            },
          },
        },
      });
      newNotifications.push(notification);
    }

    return NextResponse.json({
      message: `Đã tạo ${newNotifications.length} thông báo mới`,
      newNotifications,
    });
  } catch (error) {
    console.error("Error creating inactive sponsor notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
