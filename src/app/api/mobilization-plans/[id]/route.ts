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

    // Duyệt → chỉ đổi trạng thái, không tự trừ tiền
    if (action === "approve") {
      if (plan.status !== "PENDING") {
        return NextResponse.json({ error: "Chỉ có thể duyệt kế hoạch đang chờ duyệt" }, { status: 400 });
      }

      const result = await prisma.mobilizationPlan.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: approvedBy || "Admin",
          note: note || plan.note,
        },
        include: { items: true },
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

    // Huỷ duyệt → chỉ đổi trạng thái về DRAFT
    if (action === "unapprove") {
      if (plan.status !== "APPROVED") {
        return NextResponse.json({ error: "Chỉ có thể huỷ duyệt kế hoạch đã duyệt" }, { status: 400 });
      }

      const result = await prisma.mobilizationPlan.update({
        where: { id },
        data: {
          status: "DRAFT",
          approvedAt: null,
          approvedBy: null,
          note: note ? `[Huỷ duyệt] ${note}` : `[Huỷ duyệt] ${plan.note || ""}`,
        },
        include: { items: true },
      });

      return NextResponse.json(result);
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
