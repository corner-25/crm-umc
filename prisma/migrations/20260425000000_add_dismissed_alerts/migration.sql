-- Bảng ẩn thông báo chuông
CREATE TABLE "dismissed_alerts" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "alertKey" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedBy" TEXT,

    CONSTRAINT "dismissed_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dismissed_alerts_alertType_alertKey_key" ON "dismissed_alerts"("alertType", "alertKey");
CREATE INDEX "dismissed_alerts_alertType_idx" ON "dismissed_alerts"("alertType");
