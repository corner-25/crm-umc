import { z } from "zod";

export const donorSchema = z.object({
  fullName: z.string().optional().nullable(),
  isAnonymous: z.boolean().optional().default(false),
  email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  type: z.enum(["INDIVIDUAL", "COMPANY", "ORGANIZATION", "COMMUNITY"]),
  tier: z.enum(["VIP", "REGULAR", "NEW", "POTENTIAL"]),
  occupation: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  birthday: z.date().optional().nullable(),
  foundingDate: z.date().optional().nullable(),
  foundingNote: z.string().optional().nullable(),
  firstDonationDate: z.date().optional().nullable(),
  personalInterests: z.string().optional().nullable(),
  areasOfInterest: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  isPatient: z.boolean().optional().default(false),
  isPatientFamily: z.boolean().optional().default(false),
  contactMethod: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (!data.isAnonymous && (!data.fullName || !data.fullName.trim())) {
    ctx.addIssue({
      path: ["fullName"],
      code: z.ZodIssueCode.custom,
      message: "Họ tên là bắt buộc",
    });
  }
});

export type DonorFormValues = z.infer<typeof donorSchema>;
