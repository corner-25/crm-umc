-- CreateEnum
CREATE TYPE "PatientGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'DECEASED', 'LOST_CONTACT', 'TRANSFERRED', 'CHANGED_MEDICATION');

-- CreateEnum
CREATE TYPE "SponsorPolicy" AS ENUM ('BUY_1_GET_1', 'BUY_2_GET_1', 'FULL_SPONSOR');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "cancer_patients" (
    "id" TEXT NOT NULL,
    "patientCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "PatientGender" NOT NULL,
    "yearOfBirth" INTEGER NOT NULL,
    "phone" TEXT,
    "cccd" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cancer_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "cycleDays" INTEGER NOT NULL,
    "sponsorPolicy" "SponsorPolicy" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_sponsors" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_treatments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "treatmentDate" TIMESTAMP(3) NOT NULL,
    "nextCycleDate" TIMESTAMP(3) NOT NULL,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsorId" TEXT,
    "donationAmount" DECIMAL(15,2),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "patient_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cancer_patients_patientCode_key" ON "cancer_patients"("patientCode");

-- CreateIndex
CREATE INDEX "cancer_patients_patientCode_idx" ON "cancer_patients"("patientCode");

-- CreateIndex
CREATE INDEX "cancer_patients_name_idx" ON "cancer_patients"("name");

-- CreateIndex
CREATE INDEX "cancer_patients_status_idx" ON "cancer_patients"("status");

-- CreateIndex
CREATE INDEX "medications_name_idx" ON "medications"("name");

-- CreateIndex
CREATE INDEX "medication_sponsors_medicationId_idx" ON "medication_sponsors"("medicationId");

-- CreateIndex
CREATE INDEX "medication_sponsors_sponsorId_idx" ON "medication_sponsors"("sponsorId");

-- CreateIndex
CREATE UNIQUE INDEX "medication_sponsors_medicationId_sponsorId_key" ON "medication_sponsors"("medicationId", "sponsorId");

-- CreateIndex
CREATE INDEX "patient_treatments_patientId_idx" ON "patient_treatments"("patientId");

-- CreateIndex
CREATE INDEX "patient_treatments_medicationId_idx" ON "patient_treatments"("medicationId");

-- CreateIndex
CREATE INDEX "patient_treatments_treatmentDate_idx" ON "patient_treatments"("treatmentDate");

-- CreateIndex
CREATE INDEX "patient_treatments_nextCycleDate_idx" ON "patient_treatments"("nextCycleDate");

-- CreateIndex
CREATE INDEX "patient_treatments_status_idx" ON "patient_treatments"("status");

-- AddForeignKey
ALTER TABLE "medication_sponsors" ADD CONSTRAINT "medication_sponsors_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_sponsors" ADD CONSTRAINT "medication_sponsors_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "cancer_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
