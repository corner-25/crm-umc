import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Trả về các khoản tiền mặt còn số dư (usedAmount < amount), kèm số dư còn lại
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get("donorId");

    const donations = await prisma.donationCash.findMany({
      where: {
        deletedAt: null,
        status: { in: ["RECEIVED", "IN_USE", "COMMITTED"] },
        ...(donorId ? { donorId } : {}),
      },
      include: {
        donor: { select: { id: true, fullName: true, type: true } },
      },
      orderBy: { receivedDate: "desc" },
    });

    const available = donations
      .map((d) => {
        const amount = Number(d.amount);
        const used = Number(d.usedAmount);
        const remaining = amount - used;
        return {
          id: d.id,
          donorId: d.donorId,
          donorName: d.donor.fullName,
          donorType: d.donor.type,
          amount,
          usedAmount: used,
          remaining,
          purpose: d.purpose,
          receivedDate: d.receivedDate,
          custodian: d.custodian,
        };
      })
      .filter((d) => d.remaining > 0);

    return NextResponse.json({ donations: available });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
