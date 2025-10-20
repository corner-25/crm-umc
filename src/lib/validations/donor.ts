import { z } from "zod";

export const donorSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z
    .string()
    .email("Email không hợp lệ")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "COMPANY", "ORGANIZATION", "COMMUNITY"]),
  tier: z.enum(["VIP", "REGULAR", "NEW", "POTENTIAL"]),
  occupation: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  birthday: z.date().optional().nullable(),
  firstDonationDate: z.date().optional().nullable(),
  personalInterests: z.string().optional(),
  areasOfInterest: z.array(z.string()),
  notes: z.string().optional(),
});

export type DonorFormValues = z.infer<typeof donorSchema>;
