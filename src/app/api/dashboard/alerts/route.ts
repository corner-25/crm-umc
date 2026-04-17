import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const in30Days = addDays(today, 30);
    const in7Days = addDays(today, 7);

    // Lấy tháng và ngày hiện tại để so sinh nhật
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const nextWeekMonth = in7Days.getMonth() + 1;
    const nextWeekDay = in7Days.getDate();

    // 1. Sinh nhật trong 7 ngày tới (cá nhân)
    const donorsWithBirthday = await prisma.donor.findMany({
      where: { deletedAt: null, birthday: { not: null } },
      select: { id: true, fullName: true, birthday: true, phone: true, email: true, tier: true },
    });

    const birthdayAlerts = donorsWithBirthday.filter((donor) => {
      if (!donor.birthday) return false;
      const bDay = new Date(donor.birthday);
      const birthdayThisYear = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
      }
      return birthdayThisYear <= in7Days;
    }).map((donor) => {
      const bDay = new Date(donor.birthday!);
      const birthdayThisYear = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
      if (birthdayThisYear < today) birthdayThisYear.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.round((birthdayThisYear.getTime() - startOfDay(today).getTime()) / 86400000);
      return {
        type: "BIRTHDAY" as const,
        donorId: donor.id,
        donorName: donor.fullName,
        tier: donor.tier,
        phone: donor.phone,
        email: donor.email,
        date: birthdayThisYear.toISOString(),
        message: `Sinh nhật ${donor.fullName}`,
        isToday: daysUntil === 0,
        daysUntil,
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    // 1b. Ngày thành lập tổ chức / doanh nghiệp trong 7 ngày tới
    const orgsWithFounding = await prisma.donor.findMany({
      where: {
        deletedAt: null,
        foundingDate: { not: null },
        type: { in: ["COMPANY", "ORGANIZATION"] },
      },
      select: { id: true, fullName: true, foundingDate: true, phone: true, email: true, tier: true, type: true },
    });

    const foundingAlerts = orgsWithFounding.filter((org) => {
      if (!org.foundingDate) return false;
      const f = new Date(org.foundingDate);
      const anniversaryThisYear = new Date(today.getFullYear(), f.getMonth(), f.getDate());
      if (anniversaryThisYear < today) {
        anniversaryThisYear.setFullYear(today.getFullYear() + 1);
      }
      return anniversaryThisYear <= in7Days;
    }).map((org) => {
      const f = new Date(org.foundingDate!);
      const anniversaryThisYear = new Date(today.getFullYear(), f.getMonth(), f.getDate());
      if (anniversaryThisYear < today) anniversaryThisYear.setFullYear(today.getFullYear() + 1);
      const years = anniversaryThisYear.getFullYear() - f.getFullYear();
      const daysUntil = Math.round((anniversaryThisYear.getTime() - startOfDay(today).getTime()) / 86400000);
      return {
        type: "FOUNDING_ANNIVERSARY" as const,
        donorId: org.id,
        donorName: org.fullName,
        donorType: org.type,
        tier: org.tier,
        phone: org.phone,
        email: org.email,
        years,
        date: anniversaryThisYear.toISOString(),
        message: `${org.fullName} — ${years} năm`,
        isToday: daysUntil === 0,
        daysUntil,
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    // 2. Hợp đồng hết hạn trong 30 ngày
    const expiringContracts = await prisma.contract.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        endDate: { gte: today, lte: in30Days },
      },
      include: {
        donor: { select: { id: true, fullName: true } },
      },
      orderBy: { endDate: "asc" },
    });

    const contractAlerts = expiringContracts.map((contract) => ({
      type: "CONTRACT_EXPIRING" as const,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      donorId: contract.donor.id,
      donorName: contract.donor.fullName,
      date: contract.endDate!.toISOString(),
      message: `Hợp đồng ${contract.contractNumber} sắp hết hạn`,
      isUrgent: new Date(contract.endDate!) <= in7Days,
    }));

    // 3. Chu kỳ điều trị sắp đến (7 ngày tới)
    const upcomingTreatments = await prisma.patientTreatment.findMany({
      where: {
        deletedAt: null,
        status: "UPCOMING",
        nextCycleDate: { gte: startOfDay(today), lte: endOfDay(in7Days) },
      },
      include: {
        patient: { select: { id: true, name: true, patientCode: true } },
        medication: { select: { name: true } },
      },
      orderBy: { nextCycleDate: "asc" },
    });

    const treatmentAlerts = upcomingTreatments.map((treatment) => ({
      type: "TREATMENT_UPCOMING" as const,
      treatmentId: treatment.id,
      patientId: treatment.patientId,
      patientName: treatment.patient.name,
      patientCode: treatment.patient.patientCode,
      medicationName: treatment.medication.name,
      date: treatment.nextCycleDate.toISOString(),
      message: `Chu kỳ điều trị ${treatment.medication.name} - ${treatment.patient.name}`,
      isToday: treatment.nextCycleDate.toDateString() === today.toDateString(),
    }));

    // 4. Nhắc nhở đến hạn hôm nay / quá hạn
    const overdueReminders = await prisma.reminder.findMany({
      where: {
        deletedAt: null,
        isCompleted: false,
        dueDate: { lte: endOfDay(today) },
      },
      include: {
        donor: { select: { id: true, fullName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    const reminderAlerts = overdueReminders.map((reminder) => ({
      type: "REMINDER_DUE" as const,
      reminderId: reminder.id,
      donorId: reminder.donorId,
      donorName: reminder.donor.fullName,
      date: reminder.dueDate.toISOString(),
      title: reminder.title,
      message: reminder.title,
      isOverdue: new Date(reminder.dueDate) < startOfDay(today),
    }));

    // 5. Lịch đăng bài Fanpage trong 7 ngày tới
    const upcomingPosts = await prisma.fanpagePost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: startOfDay(today), lte: endOfDay(in7Days) },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    const fanpageAlerts = upcomingPosts.map((post) => ({
      type: "FANPAGE_POST" as const,
      postId: post.id,
      title: post.title,
      date: post.scheduledAt.toISOString(),
      message: `Đăng bài: ${post.title}`,
      isToday: post.scheduledAt.toDateString() === today.toDateString(),
    }));

    // 6. Hàng kho sắp hết hạn (theo expiryAlertMonths của mỗi lô nhập)
    const importBatches = await prisma.warehouseTransaction.findMany({
      where: { type: "IMPORT", expiryDate: { not: null } },
      include: { item: { select: { id: true, code: true, name: true, deletedAt: true } } },
    });

    const warehouseAlerts = importBatches
      .filter((batch) => {
        if (!batch.expiryDate || batch.item.deletedAt) return false;
        const alertMonths = batch.expiryAlertMonths || 1;
        const alertDate = new Date(batch.expiryDate);
        alertDate.setMonth(alertDate.getMonth() - alertMonths);
        return today >= alertDate;
      })
      .map((batch) => ({
        type: "WAREHOUSE_EXPIRY" as const,
        itemId: batch.item.id,
        itemCode: batch.item.code,
        itemName: batch.item.name,
        batchCode: batch.batchCode,
        date: batch.expiryDate!.toISOString(),
        isExpired: new Date(batch.expiryDate!) < today,
        message: `[${batch.item.code}] ${batch.item.name} — Lô: ${batch.batchCode || "N/A"} — HSD: ${batch.expiryDate!.toLocaleDateString("vi-VN")}`,
      }));

    const totalAlerts =
      birthdayAlerts.length +
      foundingAlerts.length +
      contractAlerts.length +
      treatmentAlerts.length +
      reminderAlerts.length +
      fanpageAlerts.length +
      warehouseAlerts.length;

    return NextResponse.json({
      totalAlerts,
      birthdays: birthdayAlerts,
      foundingAnniversaries: foundingAlerts,
      expiringContracts: contractAlerts,
      upcomingTreatments: treatmentAlerts,
      overdueReminders: reminderAlerts,
      upcomingFanpostPosts: fanpageAlerts,
      warehouseExpiry: warehouseAlerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
