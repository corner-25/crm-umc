-- CreateEnum
CREATE TYPE "PatientSubStatus" AS ENUM ('CHANGED_MEDICATION', 'CONCURRENT_TREATMENT', 'TRANSFERRED_IN', 'REJOINED');

-- AlterEnum
BEGIN;
CREATE TYPE "PatientStatus_new" AS ENUM ('ACTIVE', 'DECEASED', 'LOST_CONTACT', 'TRANSFERRED_OUT', 'DISCONTINUED');
ALTER TABLE "cancer_patients" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cancer_patients" ALTER COLUMN "status" TYPE "PatientStatus_new" USING ("status"::text::"PatientStatus_new");
ALTER TYPE "PatientStatus" RENAME TO "PatientStatus_old";
ALTER TYPE "PatientStatus_new" RENAME TO "PatientStatus";
DROP TYPE "PatientStatus_old";
ALTER TABLE "cancer_patients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "cancer_patients" ADD COLUMN "subStatus" "PatientSubStatus";

-- CreateIndex
CREATE INDEX "cancer_patients_subStatus_idx" ON "cancer_patients"("subStatus");
