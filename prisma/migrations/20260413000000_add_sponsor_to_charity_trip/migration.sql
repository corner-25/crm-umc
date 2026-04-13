-- AlterTable
ALTER TABLE "charity_trips" ADD COLUMN "sponsorId" TEXT;
ALTER TABLE "charity_trips" ADD COLUMN "sponsorNote" TEXT;
ALTER TABLE "charity_trips" ADD COLUMN "staffCount" INTEGER;
ALTER TABLE "charity_trips" ADD COLUMN "distance" DOUBLE PRECISION;
ALTER TABLE "charity_trips" ADD COLUMN "transport" TEXT;

-- CreateIndex
CREATE INDEX "charity_trips_sponsorId_idx" ON "charity_trips"("sponsorId");

-- AddForeignKey
ALTER TABLE "charity_trips" ADD CONSTRAINT "charity_trips_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
