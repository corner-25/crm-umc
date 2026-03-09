import { z } from "zod";

export const donorSchema = z.object({
  fullName: z.string().optional().or(z.literal("")),
  isAnonymous: z.boolean().optional().default(false),
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
  isPatient: z.boolean().optional().default(false),
  isPatientFamily: z.boolean().optional().default(false),
  // Lead tracking
  leadStatus: z.enum(["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "CONVERTED", "LOST"]).optional().nullable(),
  leadSource: z.enum(["FACEBOOK", "ZALO", "REFERRAL", "EVENT", "WEBSITE", "COLD_CALL", "OTHER"]).optional().nullable(),
  leadNote: z.string().optional(),
});

export type DonorFormValues = z.infer<typeof donorSchema>;
