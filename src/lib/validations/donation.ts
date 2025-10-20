import { z } from "zod";

// Cash Donation Schema
export const cashDonationSchema = z.object({
  donorId: z.string().min(1, "Vui lòng chọn nhà tài trợ"),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  currency: z.enum(["VND", "USD", "EUR"]),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "E_WALLET"]),
  receivedDate: z.date({ required_error: "Vui lòng chọn ngày nhận" }),
  purpose: z.string().min(1, "Vui lòng nhập mục đích tài trợ"),
  receiptUrl: z.string().optional(),
  status: z.enum(["COMMITTED", "RECEIVED", "IN_USE", "REPORTED"]),
});

export type CashDonationFormValues = z.infer<typeof cashDonationSchema>;

// In-Kind Donation Schema
export const inKindDonationSchema = z.object({
  donorId: z.string().min(1, "Vui lòng chọn nhà tài trợ"),
  itemName: z.string().min(1, "Vui lòng nhập tên vật phẩm"),
  category: z.enum(["MEDICAL_EQUIPMENT", "MEDICINE", "SUPPLIES", "FOOD", "OTHER"]),
  quantity: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
  unit: z.string().min(1, "Vui lòng nhập đơn vị tính"),
  condition: z.enum(["NEW", "USED"]),
  expiryDate: z.date().optional().nullable(),
  estimatedValue: z.coerce.number().positive("Giá trị ước tính phải lớn hơn 0"),
  imageUrls: z.array(z.string()).default([]),
  receivingLocation: z.string().min(1, "Vui lòng nhập địa điểm nhận"),
  storageLocation: z.string().min(1, "Vui lòng nhập kho lưu trữ"),
  distributionStatus: z.enum(["PENDING", "RECEIVED", "DISTRIBUTED"]),
});

export type InKindDonationFormValues = z.infer<typeof inKindDonationSchema>;

// Volunteer Donation Schema
export const volunteerDonationSchema = z.object({
  donorId: z.string().min(1, "Vui lòng chọn tình nguyện viên"),
  workType: z.enum(["MEDICAL", "ADMINISTRATIVE", "TRANSPORTATION", "CARE", "OTHER"]),
  skills: z.string().min(1, "Vui lòng mô tả kỹ năng/chuyên môn"),
  startDate: z.date({ required_error: "Vui lòng chọn ngày bắt đầu" }),
  endDate: z.date({ required_error: "Vui lòng chọn ngày kết thúc" }),
  hours: z.coerce.number().positive("Số giờ phải lớn hơn 0"),
  hourlyRate: z.coerce.number().positive("Giá trị/giờ phải lớn hơn 0"),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  reviewNotes: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"],
});

export type VolunteerDonationFormValues = z.infer<typeof volunteerDonationSchema>;

// Labels
export const paymentMethodLabels = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  E_WALLET: "Ví điện tử",
};

export const donationStatusLabels = {
  COMMITTED: "Cam kết",
  RECEIVED: "Đã nhận",
  IN_USE: "Đang sử dụng",
  REPORTED: "Đã báo cáo",
};

export const inKindCategoryLabels = {
  MEDICAL_EQUIPMENT: "Thiết bị y tế",
  MEDICINE: "Thuốc",
  SUPPLIES: "Đồ dùng",
  FOOD: "Thực phẩm",
  OTHER: "Khác",
};

export const itemConditionLabels = {
  NEW: "Mới",
  USED: "Đã qua sử dụng",
};

export const distributionStatusLabels = {
  PENDING: "Chờ nhận",
  RECEIVED: "Đã nhận",
  DISTRIBUTED: "Đã phân phối",
};

export const volunteerWorkTypeLabels = {
  MEDICAL: "Y tế",
  ADMINISTRATIVE: "Hành chính",
  TRANSPORTATION: "Vận chuyển",
  CARE: "Chăm sóc",
  OTHER: "Khác",
};
