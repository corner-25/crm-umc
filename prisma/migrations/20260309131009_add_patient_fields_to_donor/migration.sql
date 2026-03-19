-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('FACEBOOK', 'ZALO', 'REFERRAL', 'EVENT', 'WEBSITE', 'COLD_CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED', 'DRAFT');

-- CreateEnum
CREATE TYPE "InboxChannel" AS ENUM ('FACEBOOK', 'ZALO', 'EMAIL');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'RESOLVED', 'SPAM');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'STICKER');

-- AlterTable
ALTER TABLE "donation_cash" ADD COLUMN     "usageNote" TEXT,
ADD COLUMN     "usedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "isPatient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPatientFamily" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leadNote" TEXT,
ADD COLUMN     "leadSource" "LeadSource",
ADD COLUMN     "leadStatus" "LeadStatus";

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "signedDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "committedAmount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "purpose" TEXT NOT NULL,
    "terms" TEXT,
    "fileUrl" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inactive_sponsor_notifications" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "lastDonationDate" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inactive_sponsor_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_contact_history" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "contactNumber" INTEGER NOT NULL,
    "contactDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsor_contact_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "channel" "InboxChannel" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "donorId" TEXT,
    "assignedToId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT',
    "attachmentUrl" TEXT,
    "sentById" TEXT,
    "externalMsgId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_donorId_idx" ON "contracts"("donorId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE INDEX "inactive_sponsor_notifications_donorId_idx" ON "inactive_sponsor_notifications"("donorId");

-- CreateIndex
CREATE INDEX "inactive_sponsor_notifications_isResolved_idx" ON "inactive_sponsor_notifications"("isResolved");

-- CreateIndex
CREATE INDEX "inactive_sponsor_notifications_notifiedAt_idx" ON "inactive_sponsor_notifications"("notifiedAt");

-- CreateIndex
CREATE INDEX "sponsor_contact_history_notificationId_idx" ON "sponsor_contact_history"("notificationId");

-- CreateIndex
CREATE INDEX "conversations_donorId_idx" ON "conversations"("donorId");

-- CreateIndex
CREATE INDEX "conversations_assignedToId_idx" ON "conversations"("assignedToId");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_channel_externalId_key" ON "conversations"("channel", "externalId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_sentAt_idx" ON "messages"("sentAt");

-- CreateIndex
CREATE INDEX "donors_leadStatus_idx" ON "donors"("leadStatus");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inactive_sponsor_notifications" ADD CONSTRAINT "inactive_sponsor_notifications_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_contact_history" ADD CONSTRAINT "sponsor_contact_history_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "inactive_sponsor_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
