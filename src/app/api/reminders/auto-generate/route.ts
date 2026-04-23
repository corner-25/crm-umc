import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const created: string[] = [];

    // 1. Cảnh báo hàng sắp hết hạn — theo expiryAlertMonths của mỗi lô nhập
    const importBatches = await prisma.warehouseTransaction.findMany({
      where: { type: "IMPORT", expiryDate: { not: null } },
      include: { item: { select: { id: true, code: true, name: true, unit: true, currentQuantity: true, deletedAt: true } } },
    });

    for (const batch of importBatches) {
      if (!batch.expiryDate || batch.item.deletedAt) continue;
      const alertMonths = batch.expiryAlertMonths || 1;
      const alertDate = new Date(batch.expiryDate);
      alertDate.setMonth(alertDate.getMonth() - alertMonths);

      // Chỉ tạo nếu đã đến ngày cảnh báo
      if (now < alertDate) continue;

      // Kiểm tra đã có nhắc nhở chưa (tránh trùng)
      const title = `Hàng sắp hết hạn: [${batch.item.code}] ${batch.item.name} — Lô: ${batch.batchCode || "N/A"}`;
      const existing = await prisma.reminder.findFirst({
        where: {
          title,
          deletedAt: null,
          isCompleted: false,
        },
      });
      if (existing) continue;

      // Tìm 1 donor bất kỳ để link (optional, dùng donor đầu tiên trong hệ thống)
      await prisma.reminder.create({
        data: {
          donorId: (await prisma.donor.findFirst({ where: { deletedAt: null } }))?.id || "",
          type: "OTHER",
          title,
          description: `Mã lô: ${batch.batchCode || "N/A"} — HSD: ${batch.expiryDate.toLocaleDateString("vi-VN")} — Tồn kho: ${batch.item.currentQuantity} ${batch.item.unit}`,
          dueDate: alertDate > now ? alertDate : now,
        },
      });
      created.push(title);
    }

    // 2. Sinh nhật nhà tài trợ (thông báo trước 1 tuần)
    const donors = await prisma.donor.findMany({
      where: { deletedAt: null, birthday: { not: null } },
      select: { id: true, fullName: true, birthday: true },
    });

    for (const donor of donors) {
      if (!donor.birthday) continue;
      const dob = new Date(donor.birthday);
      const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (birthdayThisYear < now) {
        birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
      }

      const oneWeekBefore = new Date(birthdayThisYear);
      oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
      if (now < oneWeekBefore) continue;

      const title = `Sinh nhật NTT: ${donor.fullName}`;
      const existing = await prisma.reminder.findFirst({
        where: {
          donorId: donor.id,
          title,
          deletedAt: null,
          isCompleted: false,
        },
      });
      if (existing) continue;

      await prisma.reminder.create({
        data: {
          donorId: donor.id,
          type: "BIRTHDAY",
          title,
          description: `Ngày sinh: ${dob.toLocaleDateString("vi-VN")}`,
          dueDate: birthdayThisYear,
        },
      });
      created.push(title);
    }

    // 2b. Ngày thành lập của tổ chức/doanh nghiệp (thông báo trước 1 tuần)
    const orgs = await prisma.donor.findMany({
      where: {
        deletedAt: null,
        foundingDate: { not: null },
        type: { in: ["COMPANY", "ORGANIZATION"] },
      },
      select: { id: true, fullName: true, foundingDate: true },
    });

    for (const org of orgs) {
      if (!org.foundingDate) continue;
      const founded = new Date(org.foundingDate);
      const anniversaryThisYear = new Date(now.getFullYear(), founded.getMonth(), founded.getDate());
      if (anniversaryThisYear < now) {
        anniversaryThisYear.setFullYear(anniversaryThisYear.getFullYear() + 1);
      }

      // Tính ngày bắt đầu nhắc = lùi 5 ngày làm việc (bỏ Chủ Nhật) từ ngày kỷ niệm.
      const notifyStart = new Date(anniversaryThisYear);
      let businessDaysLeft = 5;
      while (businessDaysLeft > 0) {
        notifyStart.setDate(notifyStart.getDate() - 1);
        if (notifyStart.getDay() !== 0) businessDaysLeft--;
      }
      if (now < notifyStart) continue;

      const years = anniversaryThisYear.getFullYear() - founded.getFullYear();
      const title = `Ngày thành lập: ${org.fullName}`;
      const existing = await prisma.reminder.findFirst({
        where: {
          donorId: org.id,
          title,
          deletedAt: null,
          isCompleted: false,
        },
      });
      if (existing) continue;

      await prisma.reminder.create({
        data: {
          donorId: org.id,
          type: "FOUNDING_ANNIVERSARY",
          title,
          description: `Ngày thành lập: ${founded.toLocaleDateString("vi-VN")}${years > 0 ? ` — Kỷ niệm ${years} năm` : ""}`,
          dueDate: anniversaryThisYear,
        },
      });
      created.push(title);
    }

    // 3. Kỷ niệm tài trợ lần đầu (thông báo trước 1 tháng)
    const donorsWithDonations = await prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        cashDonations: {
          where: { deletedAt: null },
          select: { receivedDate: true },
          orderBy: { receivedDate: "asc" },
          take: 1,
        },
        inKindDonations: {
          where: { deletedAt: null },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    for (const donor of donorsWithDonations) {
      const dates: Date[] = [
        ...(donor.cashDonations[0] ? [new Date(donor.cashDonations[0].receivedDate)] : []),
        ...(donor.inKindDonations[0] ? [new Date(donor.inKindDonations[0].createdAt)] : []),
      ];
      if (dates.length === 0) continue;
      const firstDonation = new Date(Math.min(...dates.map((d) => d.getTime())));

      // Kỷ niệm năm nay
      const anniversary = new Date(now.getFullYear(), firstDonation.getMonth(), firstDonation.getDate());
      if (anniversary < now) {
        anniversary.setFullYear(anniversary.getFullYear() + 1);
      }

      const oneMonthBefore = new Date(anniversary);
      oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
      if (now < oneMonthBefore) continue;

      const title = `Kỷ niệm tài trợ lần đầu: ${donor.fullName}`;
      const existing = await prisma.reminder.findFirst({
        where: {
          donorId: donor.id,
          title,
          deletedAt: null,
          isCompleted: false,
        },
      });
      if (existing) continue;

      await prisma.reminder.create({
        data: {
          donorId: donor.id,
          type: "DONATION_ANNIVERSARY",
          title,
          description: `Ngày tài trợ lần đầu: ${firstDonation.toLocaleDateString("vi-VN")}`,
          dueDate: anniversary,
        },
      });
      created.push(title);
    }

    return NextResponse.json({ created, count: created.length });
  } catch (error) {
    console.error("Error auto-generating reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
