import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay, subMonths } from "date-fns";

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

    // 1. Sinh nhật trong 7 ngày tới
    const donorsWithBirthday = await prisma.donor.findMany({
      where: { deletedAt: null, birthday: { not: null } },
      select: { id: true, fullName: true, birthday: true, phone: true, email: true },
    });

    const birthdayAlerts = donorsWithBirthday.filter((donor) => {
      if (!donor.birthday) return false;
      const bDay = new Date(donor.birthday);
      const bMonth = bDay.getMonth() + 1;
      const bDayOfMonth = bDay.getDate();

      // Check ngày sinh nhật trong 7 ngày tới (kể cả wrap tháng)
      const birthdayThisYear = new Date(today.getFullYear(), bMonth - 1, bDayOfMonth);
      if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
      }
      return birthdayThisYear <= in7Days;
    }).map((donor) => {
      const bDay = new Date(donor.birthday!);
      const birthdayThisYear = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
      if (birthdayThisYear < today) birthdayThisYear.setFullYear(today.getFullYear() + 1);
      return {
        type: "BIRTHDAY" as const,
        donorId: donor.id,
        donorName: donor.fullName,
        date: birthdayThisYear.toISOString(),
        message: `Sinh nhật ${donor.fullName}`,
        isToday: birthdayThisYear.toDateString() === today.toDateString(),
      };
    });

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

    // 6. Nhà tài trợ 6 tháng không phát sinh tài trợ mới
    const sixMonthsAgo = subMonths(today, 6);
    const allActiveDonors = await prisma.donor.findMany({
      where: { deletedAt: null, isAnonymous: false },
      select: {
        id: true,
        fullName: true,
        cashDonations: {
          where: { deletedAt: null },
          select: { receivedDate: true },
          orderBy: { receivedDate: "desc" },
          take: 1,
        },
        inKindDonations: {
          where: { deletedAt: null },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const inactiveDonorAlerts = allActiveDonors
      .filter((donor) => {
        const lastCash = donor.cashDonations[0]?.receivedDate;
        const lastInKind = donor.inKindDonations[0]?.createdAt;
        const lastDonation = [lastCash, lastInKind]
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

        // Nếu chưa từng tài trợ hoặc tài trợ cuối cách đây > 6 tháng
        if (!lastDonation) return donor.cashDonations.length === 0 && donor.inKindDonations.length === 0;
        return new Date(lastDonation) < sixMonthsAgo;
      })
      .slice(0, 15)
      .map((donor) => {
        const lastCash = donor.cashDonations[0]?.receivedDate;
        const lastInKind = donor.inKindDonations[0]?.createdAt;
        const lastDonation = [lastCash, lastInKind]
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];
        return {
          type: "INACTIVE_DONOR" as const,
          donorId: donor.id,
          donorName: donor.fullName,
          lastDonationDate: lastDonation?.toISOString() ?? null,
          message: `${donor.fullName} chưa phát sinh tài trợ trong 6 tháng`,
        };
      });

    const totalAlerts =
      birthdayAlerts.length +
      contractAlerts.length +
      treatmentAlerts.length +
      reminderAlerts.length +
      fanpageAlerts.length +
      inactiveDonorAlerts.length;

    return NextResponse.json({
      totalAlerts,
      birthdays: birthdayAlerts,
      expiringContracts: contractAlerts,
      upcomingTreatments: treatmentAlerts,
      overdueReminders: reminderAlerts,
      upcomingFanpostPosts: fanpageAlerts,
      inactiveDonors: inactiveDonorAlerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
