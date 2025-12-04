import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Get all sponsored treatments with medication and sponsor info
    const treatments = await prisma.patientTreatment.findMany({
      where: {
        deletedAt: null,
        isSponsored: true,
        sponsorId: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { treatmentDate: dateFilter }),
      },
      include: {
        medication: {
          select: {
            id: true,
            name: true,
            unitPrice: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            fullName: true,
            company: true,
          },
        },
      },
    });

    // Group by sponsor and medication
    interface MedicationStats {
      medicationId: string;
      medicationName: string;
      totalDoses: number;
      totalValue: number;
    }

    interface SponsorStats {
      sponsorId: string;
      sponsorName: string;
      sponsorCompany: string | null;
      medications: Map<string, MedicationStats>;
    }

    const sponsorMap = new Map<string, SponsorStats>();

    treatments.forEach((treatment) => {
      if (!treatment.sponsor) return;

      const sponsorId = treatment.sponsor.id;
      const medicationId = treatment.medication.id;

      // Get or create sponsor entry
      if (!sponsorMap.has(sponsorId)) {
        sponsorMap.set(sponsorId, {
          sponsorId,
          sponsorName: treatment.sponsor.fullName,
          sponsorCompany: treatment.sponsor.company,
          medications: new Map(),
        });
      }

      const sponsor = sponsorMap.get(sponsorId)!;

      // Get or create medication entry for this sponsor
      if (!sponsor.medications.has(medicationId)) {
        sponsor.medications.set(medicationId, {
          medicationId,
          medicationName: treatment.medication.name,
          totalDoses: 0,
          totalValue: 0,
        });
      }

      const medication = sponsor.medications.get(medicationId)!;
      medication.totalDoses += 1;
      const donationValue = treatment.donationAmount ? Number(treatment.donationAmount) : Number(treatment.medication.unitPrice);
      medication.totalValue += donationValue;
    });

    // Convert to array format
    const result = Array.from(sponsorMap.values()).map((sponsor) => {
      const medications = Array.from(sponsor.medications.values());
      const totalDoses = medications.reduce((sum, med) => sum + med.totalDoses, 0);
      const totalValue = medications.reduce((sum, med) => sum + med.totalValue, 0);

      return {
        sponsorId: sponsor.sponsorId,
        sponsorName: sponsor.sponsorName,
        sponsorCompany: sponsor.sponsorCompany,
        medications,
        totalDoses,
        totalValue,
      };
    });

    // Sort by total value descending
    result.sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching sponsor stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
