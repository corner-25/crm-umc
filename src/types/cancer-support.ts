import { PatientGender, PatientStatus, PatientSubStatus, SponsorPolicy, TreatmentStatus } from "@prisma/client";

export const patientGenderLabels: Record<PatientGender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const patientStatusLabels: Record<PatientStatus, string> = {
  ACTIVE: "Đang điều trị",
  DECEASED: "Tử vong",
  LOST_CONTACT: "Mất liên lạc",
  TRANSFERRED_OUT: "Chuyển đi viện khác",
  DISCONTINUED: "Ngừng tham gia",
};

export const patientSubStatusLabels: Record<PatientSubStatus, string> = {
  CHANGED_MEDICATION: "Đổi thuốc",
  CONCURRENT_TREATMENT: "Điều trị song song",
  TRANSFERRED_IN: "Chuyển từ viện khác tới",
  REJOINED: "Tham gia lại",
};

export const sponsorPolicyLabels: Record<SponsorPolicy, string> = {
  BUY_1_GET_1: "Mua 1 Tặng 1",
  BUY_2_GET_1: "Mua 2 Tặng 1",
  BUY_3_GET_1: "Mua 3 Tặng 1",
  FULL_SPONSOR: "Tài trợ 100%",
};

export const treatmentStatusLabels: Record<TreatmentStatus, string> = {
  UPCOMING: "Sắp đến",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};
