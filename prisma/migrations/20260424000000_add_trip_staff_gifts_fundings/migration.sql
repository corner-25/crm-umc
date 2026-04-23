-- ============================================================
-- Chuyến đi từ thiện: thêm trường mới + các bảng NVYT, quà, nguồn tài trợ
-- ============================================================

-- 1. Bổ sung cột vào charity_trips
ALTER TABLE "charity_trips" ADD COLUMN "tripName" TEXT;
ALTER TABLE "charity_trips" ADD COLUMN "distanceKm" DOUBLE PRECISION;
ALTER TABLE "charity_trips" ADD COLUMN "targetAudience" TEXT;

-- Migrate dữ liệu cũ: copy distance → distanceKm (nếu có)
UPDATE "charity_trips" SET "distanceKm" = "distance" WHERE "distance" IS NOT NULL;

-- Xoá cột distance cũ
ALTER TABLE "charity_trips" DROP COLUMN "distance";

-- 2. Bảng Staff (NVYT)
CREATE TABLE "staffs" (
    "id" TEXT NOT NULL,
    "staffCode" TEXT,
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staffs_staffCode_key" ON "staffs"("staffCode");
CREATE INDEX "staffs_fullName_idx" ON "staffs"("fullName");
CREATE INDEX "staffs_department_idx" ON "staffs"("department");

-- 3. Bảng trung gian charity_trip_staffs
CREATE TABLE "charity_trip_staffs" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tripRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charity_trip_staffs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "charity_trip_staffs_tripId_staffId_key" ON "charity_trip_staffs"("tripId", "staffId");
CREATE INDEX "charity_trip_staffs_tripId_idx" ON "charity_trip_staffs"("tripId");
CREATE INDEX "charity_trip_staffs_staffId_idx" ON "charity_trip_staffs"("staffId");

ALTER TABLE "charity_trip_staffs" ADD CONSTRAINT "charity_trip_staffs_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "charity_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "charity_trip_staffs" ADD CONSTRAINT "charity_trip_staffs_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Danh mục quà tặng
CREATE TABLE "trip_gift_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trip_gift_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trip_gift_types_name_key" ON "trip_gift_types"("name");

-- Seed 2 loại quà mặc định
INSERT INTO "trip_gift_types" ("id", "name", "unit", "isDefault", "updatedAt") VALUES
    ('seed_gift_wheelchair', 'Xe lăn', 'chiếc', true, CURRENT_TIMESTAMP),
    ('seed_gift_bicycle', 'Xe đạp', 'chiếc', true, CURRENT_TIMESTAMP);

-- 5. Quà của từng chuyến
CREATE TABLE "trip_gifts" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "giftTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_gifts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trip_gifts_tripId_idx" ON "trip_gifts"("tripId");
CREATE INDEX "trip_gifts_giftTypeId_idx" ON "trip_gifts"("giftTypeId");

ALTER TABLE "trip_gifts" ADD CONSTRAINT "trip_gifts_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "charity_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_gifts" ADD CONSTRAINT "trip_gifts_giftTypeId_fkey"
    FOREIGN KEY ("giftTypeId") REFERENCES "trip_gift_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Enum nguồn tài trợ
CREATE TYPE "CharityTripFundingSource" AS ENUM ('EXISTING', 'NEW');

-- 7. Bảng nguồn tài trợ chuyến đi
CREATE TABLE "charity_trip_fundings" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "source" "CharityTripFundingSource" NOT NULL,
    "donationCashId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charity_trip_fundings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "charity_trip_fundings_tripId_idx" ON "charity_trip_fundings"("tripId");
CREATE INDEX "charity_trip_fundings_donationCashId_idx" ON "charity_trip_fundings"("donationCashId");

ALTER TABLE "charity_trip_fundings" ADD CONSTRAINT "charity_trip_fundings_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "charity_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
