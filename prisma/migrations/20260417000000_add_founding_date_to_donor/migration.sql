-- AlterTable
ALTER TABLE "donors" ADD COLUMN "foundingDate" TIMESTAMP(3);
ALTER TABLE "donors" ADD COLUMN "foundingNote" TEXT;

-- AlterEnum
ALTER TYPE "ReminderType" ADD VALUE 'FOUNDING_ANNIVERSARY';
