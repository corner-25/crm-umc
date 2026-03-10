-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "contactMethod" TEXT,
ADD COLUMN     "contactName" TEXT;

-- CreateTable
CREATE TABLE "custom_options" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_options_type_idx" ON "custom_options"("type");
