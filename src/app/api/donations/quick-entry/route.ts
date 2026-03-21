import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { donor: donorData, donation: donationData } = body;

    // Tạo donor
    let fullName = donorData.fullName;
    let anonymousCode: string | null = null;

    if (donorData.isAnonymous) {
      const count = await prisma.donor.count({ where: { isAnonymous: true } });
      anonymousCode = `Mạnh thường quân ẩn danh ${String(count + 1).padStart(4, "0")}`;
      // Nếu người dùng có nhập tên thì dùng tên đó, không thì dùng mã tự sinh
      if (!donorData.fullName || !donorData.fullName.trim()) {
        fullName = anonymousCode;
      }
    }

    const donor = await prisma.donor.create({
      data: {
        fullName,
        isAnonymous: donorData.isAnonymous ?? false,
        anonymousCode,
        type: donorData.type || "INDIVIDUAL",
        tier: donorData.tier || "NEW",
        email: donorData.email || null,
        phone: donorData.phone || null,
        address: donorData.address || null,
        areasOfInterest: [],
        managerId: session.user.id,
      },
    });

    // Tính usedAmount từ usageItems
    const usageItems = Array.isArray(donationData.usageItems) ? donationData.usageItems : [];
    const usedAmount = usageItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    // Tạo donation cash
    const donation = await prisma.donationCash.create({
      data: {
        donorId: donor.id,
        amount: donationData.amount,
        currency: donationData.currency || "VND",
        paymentMethod: donationData.paymentMethod || "CASH",
        receivedDate: new Date(donationData.receivedDate),
        purpose: Array.isArray(donationData.purpose) ? JSON.stringify(donationData.purpose) : donationData.purpose,
        purposeOther: donationData.purposeOther || null,
        status: donationData.status || "RECEIVED",
        custodian: donationData.custodian || "Uỷ quyền cho phòng CTXH",
        voucherCode: donationData.voucherCode || null,
        usageItems: usageItems,
        usedAmount,
        usageNote: donationData.usageNote || null,
        receiptUrl: donationData.receiptUrl || null,
      },
    });

    return NextResponse.json({ donor, donation }, { status: 201 });
  } catch (error) {
    console.error("Error quick-entry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
