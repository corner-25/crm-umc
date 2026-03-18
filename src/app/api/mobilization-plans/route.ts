import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// GET: Danh sách kế hoạch huy động
export async function GET() {
  try {
    const plans = await prisma.mobilizationPlan.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

// POST: Lưu kế hoạch mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, targetAmount, accumulatedAmount, filterPurpose, filterCustodian, filterYear, priorityMode, items } = body;

    // Sinh mã kế hoạch: HD-YYYYMMDD-xxx
    const today = format(new Date(), "yyyyMMdd");
    const count = await prisma.mobilizationPlan.count({
      where: { planCode: { startsWith: `HD-${today}` } },
    });
    const planCode = `HD-${today}-${String(count + 1).padStart(3, "0")}`;

    const plan = await prisma.mobilizationPlan.create({
      data: {
        planCode,
        title: title || `Kế hoạch huy động ${format(new Date(), "dd/MM/yyyy")}`,
        targetAmount,
        accumulatedAmount,
        filterPurpose: filterPurpose || null,
        filterCustodian: filterCustodian || null,
        filterYear: filterYear || null,
        priorityMode: priorityMode || null,
        status: "DRAFT",
        items: {
          create: items.map((item: { donationCashId: string; takeAmount: number; source: string }) => ({
            donationCashId: item.donationCashId,
            takeAmount: item.takeAmount,
            source: item.source || "auto",
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Create mobilization plan error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
