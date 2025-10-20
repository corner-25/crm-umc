import { Donor, DonorType, DonorTier } from "@prisma/client";

export type { Donor, DonorType, DonorTier };

export interface DonorFormData {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  type: DonorType;
  tier: DonorTier;
  occupation?: string;
  company?: string;
  position?: string;
  birthday?: Date | null;
  firstDonationDate?: Date | null;
  personalInterests?: string;
  areasOfInterest?: string[];
  notes?: string;
}

export const donorTypeLabels: Record<DonorType, string> = {
  INDIVIDUAL: "Cá nhân",
  COMPANY: "Doanh nghiệp",
  ORGANIZATION: "Tổ chức",
  COMMUNITY: "Nhóm/Cộng đồng",
};

export const donorTierLabels: Record<DonorTier, string> = {
  VIP: "VIP",
  REGULAR: "Thường xuyên",
  NEW: "Mới",
  POTENTIAL: "Tiềm năng",
};

export const donorTierColors: Record<DonorTier, string> = {
  VIP: "bg-purple-100 text-purple-800 border-purple-300",
  REGULAR: "bg-blue-100 text-blue-800 border-blue-300",
  NEW: "bg-green-100 text-green-800 border-green-300",
  POTENTIAL: "bg-yellow-100 text-yellow-800 border-yellow-300",
};
