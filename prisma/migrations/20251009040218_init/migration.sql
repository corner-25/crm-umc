-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "DonorType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'ORGANIZATION', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "DonorTier" AS ENUM ('VIP', 'REGULAR', 'NEW', 'POTENTIAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('VND', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'E_WALLET');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('COMMITTED', 'RECEIVED', 'IN_USE', 'REPORTED');

-- CreateEnum
CREATE TYPE "InKindCategory" AS ENUM ('MEDICAL_EQUIPMENT', 'MEDICINE', 'SUPPLIES', 'FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'RECEIVED', 'DISTRIBUTED');

-- CreateEnum
CREATE TYPE "VolunteerWorkType" AS ENUM ('MEDICAL', 'ADMINISTRATIVE', 'TRANSPORTATION', 'CARE', 'OTHER');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'EVENT');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('THANK_YOU', 'BIRTHDAY', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('BIRTHDAY', 'DONATION_ANNIVERSARY', 'SEND_REPORT', 'FOLLOW_UP', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "donors" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "type" "DonorType" NOT NULL,
    "tier" "DonorTier" NOT NULL DEFAULT 'NEW',
    "occupation" TEXT,
    "company" TEXT,
    "position" TEXT,
    "birthday" TIMESTAMP(3),
    "firstDonationDate" TIMESTAMP(3),
    "personalInterests" TEXT,
    "areasOfInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_cash" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'VND',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'COMMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donation_cash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_in_kind" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" "InKindCategory" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "condition" "ItemCondition" NOT NULL DEFAULT 'NEW',
    "expiryDate" TIMESTAMP(3),
    "estimatedValue" DECIMAL(15,2) NOT NULL,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receivingLocation" TEXT NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donation_in_kind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_volunteer" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "workType" "VolunteerWorkType" NOT NULL,
    "skills" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL,
    "rating" INTEGER,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donation_volunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "donors_email_idx" ON "donors"("email");

-- CreateIndex
CREATE INDEX "donors_phone_idx" ON "donors"("phone");

-- CreateIndex
CREATE INDEX "donors_fullName_idx" ON "donors"("fullName");

-- CreateIndex
CREATE INDEX "donors_type_idx" ON "donors"("type");

-- CreateIndex
CREATE INDEX "donors_tier_idx" ON "donors"("tier");

-- CreateIndex
CREATE INDEX "donors_managerId_idx" ON "donors"("managerId");

-- CreateIndex
CREATE INDEX "donation_cash_donorId_idx" ON "donation_cash"("donorId");

-- CreateIndex
CREATE INDEX "donation_cash_receivedDate_idx" ON "donation_cash"("receivedDate");

-- CreateIndex
CREATE INDEX "donation_cash_status_idx" ON "donation_cash"("status");

-- CreateIndex
CREATE INDEX "donation_in_kind_donorId_idx" ON "donation_in_kind"("donorId");

-- CreateIndex
CREATE INDEX "donation_in_kind_category_idx" ON "donation_in_kind"("category");

-- CreateIndex
CREATE INDEX "donation_in_kind_distributionStatus_idx" ON "donation_in_kind"("distributionStatus");

-- CreateIndex
CREATE INDEX "donation_volunteer_donorId_idx" ON "donation_volunteer"("donorId");

-- CreateIndex
CREATE INDEX "donation_volunteer_workType_idx" ON "donation_volunteer"("workType");

-- CreateIndex
CREATE INDEX "donation_volunteer_startDate_idx" ON "donation_volunteer"("startDate");

-- CreateIndex
CREATE INDEX "interactions_donorId_idx" ON "interactions"("donorId");

-- CreateIndex
CREATE INDEX "interactions_date_idx" ON "interactions"("date");

-- CreateIndex
CREATE INDEX "interactions_type_idx" ON "interactions"("type");

-- CreateIndex
CREATE INDEX "email_logs_donorId_idx" ON "email_logs"("donorId");

-- CreateIndex
CREATE INDEX "email_logs_templateId_idx" ON "email_logs"("templateId");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "reminders_donorId_idx" ON "reminders"("donorId");

-- CreateIndex
CREATE INDEX "reminders_dueDate_idx" ON "reminders"("dueDate");

-- CreateIndex
CREATE INDEX "reminders_isCompleted_idx" ON "reminders"("isCompleted");

-- CreateIndex
CREATE INDEX "reminders_type_idx" ON "reminders"("type");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_cash" ADD CONSTRAINT "donation_cash_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_in_kind" ADD CONSTRAINT "donation_in_kind_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_volunteer" ADD CONSTRAINT "donation_volunteer_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
