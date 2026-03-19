-- CreateEnum
CREATE TYPE "CashCustodian" AS ENUM ('CTXH', 'ACCOUNTING', 'STAFF');

-- CreateEnum
CREATE TYPE "FanpagePostStatus" AS ENUM ('SCHEDULED', 'PUBLISHED', 'CANCELLED');

-- AlterTable: donors
ALTER TABLE "donors" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donors" ADD COLUMN "anonymousCode" TEXT;

-- AlterTable: donation_cash
ALTER TABLE "donation_cash" ADD COLUMN "purposeOther" TEXT;
ALTER TABLE "donation_cash" ADD COLUMN "custodian" "CashCustodian" NOT NULL DEFAULT 'CTXH';
ALTER TABLE "donation_cash" ADD COLUMN "voucherCode" TEXT;
ALTER TABLE "donation_cash" ADD COLUMN "usageItems" JSONB NOT NULL DEFAULT '[]';

-- CreateTable: fanpage_posts
CREATE TABLE "fanpage_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "status" "FanpagePostStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notified7Days" BOOLEAN NOT NULL DEFAULT false,
    "notifiedDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fanpage_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fanpage_posts_scheduledAt_idx" ON "fanpage_posts"("scheduledAt");
CREATE INDEX "fanpage_posts_status_idx" ON "fanpage_posts"("status");
CREATE UNIQUE INDEX "donors_anonymousCode_key" ON "donors"("anonymousCode");
