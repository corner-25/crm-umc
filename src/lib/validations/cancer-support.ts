import { z } from "zod";

// Patient validation
export const patientSchema = z.object({
  patientCode: z.string().min(1, "Mã bệnh nhân là bắt buộc"),
  name: z.string().min(1, "Tên bệnh nhân là bắt buộc"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  yearOfBirth: z.number().min(1900).max(new Date().getFullYear()),
  phone: z.string().optional(),
  cccd: z.string().optional(),
  status: z.enum(["ACTIVE", "DECEASED", "LOST_CONTACT", "TRANSFERRED_OUT", "DISCONTINUED"]),
  subStatus: z.enum(["CHANGED_MEDICATION", "CONCURRENT_TREATMENT", "TRANSFERRED_IN", "REJOINED"]).optional().nullable(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

// Medication validation
export const medicationSchema = z.object({
  name: z.string().min(1, "Tên thuốc là bắt buộc"),
  description: z.string().optional(),
  unitPrice: z.number().min(0, "Đơn giá phải lớn hơn 0"),
  cycleDays: z.number().min(1, "Chu kỳ phải lớn hơn 0"),
  sponsorPolicy: z.enum(["BUY_1_GET_1", "BUY_2_GET_1", "BUY_3_GET_1", "FULL_SPONSOR"]),
  sponsorIds: z.array(z.string()).optional(),
});

export type MedicationFormValues = z.infer<typeof medicationSchema>;

// Treatment validation
export const treatmentSchema = z.object({
  patientId: z.string().min(1, "Vui lòng chọn bệnh nhân"),
  medicationId: z.string().min(1, "Vui lòng chọn thuốc"),
  treatmentDate: z.date(),
  sponsorId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["UPCOMING", "COMPLETED", "CANCELLED"]).optional(),
});

export type TreatmentFormValues = z.infer<typeof treatmentSchema>;
