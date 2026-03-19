import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Chi tiết 1 kế hoạch
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await prisma.mobilizationPlan.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH: Cập nhật trạng thái (gửi duyệt, duyệt, từ chối)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, approvedBy, note } = body;

    const plan = await prisma.mobilizationPlan.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Gửi duyệt
    if (action === "submit") {
      if (plan.status !== "DRAFT") {
        return NextResponse.json({ error: "Chỉ có thể gửi duyệt kế hoạch ở trạng thái Nháp" }, { status: 400 });
      }
      const updated = await prisma.mobilizationPlan.update({
        where: { id },
        data: { status: "PENDING", note: note || plan.note },
        include: { items: true },
      });
      return NextResponse.json(updated);
    }

    // Duyệt → trừ tiền vào các khoản donation
    if (action === "approve") {
      if (plan.status !== "PENDING") {
        return NextResponse.json({ error: "Chỉ có thể duyệt kế hoạch đang chờ duyệt" }, { status: 400 });
      }

      // Transaction: cập nhật plan + trừ tiền từng khoản
      const result = await prisma.$transaction(async (tx) => {
        // Cập nhật từng khoản DonationCash
        for (const item of plan.items) {
          const donation = await tx.donationCash.findUnique({
            where: { id: item.donationCashId },
          });
          if (!donation) continue;

          const currentUsed = Number(donation.usedAmount);
          const take = Number(item.takeAmount);
          const newUsed = currentUsed + take;

          // Thêm vào usageItems
          const existingItems = Array.isArray(donation.usageItems) ? donation.usageItems : [];
          const newUsageItems = [
            ...existingItems,
            {
              description: `Huy động theo KH ${plan.planCode}`,
              amount: take,
              date: new Date().toISOString(),
              planId: plan.id,
            },
          ];

          await tx.donationCash.update({
            where: { id: item.donationCashId },
            data: {
              usedAmount: newUsed,
              usageItems: newUsageItems as any,
            },
          });
        }

        // Cập nhật trạng thái plan
        return tx.mobilizationPlan.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: approvedBy || "Admin",
            note: note || plan.note,
          },
          include: { items: true },
        });
      });

      return NextResponse.json(result);
    }

    // Từ chối
    if (action === "reject") {
      if (plan.status !== "PENDING") {
        return NextResponse.json({ error: "Chỉ có thể từ chối kế hoạch đang chờ duyệt" }, { status: 400 });
      }
      const updated = await prisma.mobilizationPlan.update({
        where: { id },
        data: { status: "REJECTED", note: note || plan.note },
        include: { items: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update mobilization plan error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

// DELETE: Xoá kế hoạch (chỉ DRAFT/REJECTED)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const plan = await prisma.mobilizationPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (plan.status === "APPROVED" || plan.status === "PENDING") {
      return NextResponse.json({ error: "Không thể xoá kế hoạch đã duyệt hoặc đang chờ duyệt" }, { status: 400 });
    }
    await prisma.mobilizationPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
