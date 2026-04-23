import { Prisma } from "@prisma/client";

type TxLike = Prisma.TransactionClient;

export interface FundingInput {
  source: "EXISTING" | "NEW";
  donationCashId?: string;   // Với EXISTING: khoản có sẵn
  donorId?: string;          // Với NEW: NTT tài trợ riêng cho chuyến
  amount: number;
  notes?: string;
}

export function buildTripName(location: {
  province: string;
  district?: string | null;
  ward?: string | null;
}): string {
  const parts = [location.province];
  if (location.ward) parts.push(location.ward);
  else if (location.district) parts.push(location.district);
  return `Từ thiện ${parts.join(" - ")}`;
}

// ==================================================================
// Áp dụng fundings cho 1 chuyến đi:
//   - EXISTING: push thêm 1 dòng vào usageItems của DonationCash, cộng usedAmount
//   - NEW: tạo DonationCash mới với purpose = tripName, usedAmount = amount (dùng hết)
// ==================================================================
export async function applyTripFundings(
  tx: TxLike,
  opts: {
    tripId: string;
    tripName: string;
    tripStartDate: Date;
    fundings: FundingInput[];
  }
) {
  const { tripId, tripName, tripStartDate, fundings } = opts;

  for (const f of fundings) {
    if (!f.amount || f.amount <= 0) continue;

    if (f.source === "EXISTING") {
      if (!f.donationCashId) {
        throw new Error("Kịch bản 'trích từ khoản có sẵn' thiếu donationCashId");
      }

      const donation = await tx.donationCash.findUnique({
        where: { id: f.donationCashId },
      });
      if (!donation) throw new Error("Khoản tài trợ không tồn tại");

      const remaining = Number(donation.amount) - Number(donation.usedAmount);
      if (f.amount > remaining) {
        throw new Error(
          `Khoản "${donation.purpose}" chỉ còn ${remaining.toLocaleString("vi-VN")} VND, không đủ ${f.amount.toLocaleString("vi-VN")} VND`
        );
      }

      // Thêm dòng vào usageItems
      const existingItems = Array.isArray(donation.usageItems) ? donation.usageItems : [];
      const newItem = {
        description: tripName,
        amount: f.amount,
        tripId,
        addedAt: new Date().toISOString(),
        ...(f.notes ? { notes: f.notes } : {}),
      };

      await tx.donationCash.update({
        where: { id: donation.id },
        data: {
          usageItems: [...(existingItems as any[]), newItem] as any,
          usedAmount: { increment: f.amount },
          status: donation.status === "COMMITTED" ? "IN_USE" : donation.status,
        },
      });

      await tx.charityTripFunding.create({
        data: {
          tripId,
          source: "EXISTING",
          donationCashId: donation.id,
          amount: f.amount,
          notes: f.notes || null,
        },
      });
    } else {
      // NEW: tạo DonationCash mới
      if (!f.donorId) {
        throw new Error("Kịch bản 'tài trợ riêng' thiếu donorId");
      }

      const newDonation = await tx.donationCash.create({
        data: {
          donorId: f.donorId,
          amount: f.amount,
          paymentMethod: "BANK_TRANSFER",
          receivedDate: tripStartDate,
          purpose: tripName,
          status: "IN_USE",
          custodian: "Uỷ quyền cho phòng CTXH",
          usedAmount: f.amount,
          usageItems: [
            {
              description: tripName,
              amount: f.amount,
              tripId,
              addedAt: new Date().toISOString(),
            },
          ] as any,
        },
      });

      await tx.charityTripFunding.create({
        data: {
          tripId,
          source: "NEW",
          donationCashId: newDonation.id,
          amount: f.amount,
          notes: f.notes || null,
        },
      });
    }
  }
}

// ==================================================================
// Rollback fundings của 1 chuyến đi (khi xoá chuyến):
//   - EXISTING: trừ usedAmount, gỡ dòng usageItems có tripId tương ứng
//   - NEW: soft-delete DonationCash đã sinh (giữ history)
// ==================================================================
export async function rollbackTripFundings(tx: TxLike, tripId: string) {
  const fundings = await tx.charityTripFunding.findMany({
    where: { tripId },
  });

  for (const f of fundings) {
    if (f.source === "EXISTING") {
      const donation = await tx.donationCash.findUnique({
        where: { id: f.donationCashId },
      });
      if (!donation) continue;

      const items = Array.isArray(donation.usageItems) ? (donation.usageItems as any[]) : [];
      const filtered = items.filter((it) => it.tripId !== tripId);

      await tx.donationCash.update({
        where: { id: donation.id },
        data: {
          usageItems: filtered as any,
          usedAmount: { decrement: Number(f.amount) },
        },
      });
    } else {
      // NEW: soft-delete
      await tx.donationCash.update({
        where: { id: f.donationCashId },
        data: { deletedAt: new Date() },
      });
    }
  }

  await tx.charityTripFunding.deleteMany({ where: { tripId } });
}
