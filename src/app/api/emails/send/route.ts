import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, donorIds, customSubject, customBody } = body;

    // Validate input
    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return NextResponse.json(
        { error: "At least one donor must be selected" },
        { status: 400 }
      );
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
    }

    // Get donors
    const donors = await prisma.donor.findMany({
      where: {
        id: { in: donorIds },
        deletedAt: null,
      },
      include: {
        donationsCash: {
          where: { deletedAt: null },
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    if (donors.length === 0) {
      return NextResponse.json(
        { error: "No valid donors found" },
        { status: 404 }
      );
    }

    // Create email logs for each donor
    const emailLogs = [];
    for (const donor of donors) {
      // Replace variables in subject and body
      const subject = (customSubject || template?.subject || "").replace(
        /\{tên\}/g,
        donor.fullName
      );

      let body = customBody || template?.body || "";
      body = body
        .replace(/\{tên\}/g, donor.fullName)
        .replace(/\{hạng\}/g, donor.tier || "")
        .replace(/\{email\}/g, donor.email || "")
        .replace(/\{phone\}/g, donor.phone || "");

      // Add last donation info if available
      if (donor.donationsCash.length > 0) {
        const lastDonation = donor.donationsCash[0];
        body = body
          .replace(
            /\{số_tiền\}/g,
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(lastDonation.amount)
          )
          .replace(
            /\{ngày\}/g,
            new Date(lastDonation.date).toLocaleDateString("vi-VN")
          );
      }

      // Create email log
      const emailLog = await prisma.emailLog.create({
        data: {
          donorId: donor.id,
          templateId: templateId || null,
          subject,
          body,
          status: "SENT", // In production, this would be "PENDING" until actually sent
          sentAt: new Date(),
        },
      });

      emailLogs.push(emailLog);
    }

    // In production, you would integrate with an email service (SendGrid, AWS SES, etc.)
    // For now, we just create the logs

    return NextResponse.json({
      success: true,
      count: emailLogs.length,
      emails: emailLogs,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
