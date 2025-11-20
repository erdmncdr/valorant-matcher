-- Add new fields to Purchase table and update enum

-- 1. Add PROCESSING status to enum
ALTER TYPE "PurchaseStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

-- 2. Add vpCode field (nullable)
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "vpCode" TEXT;

-- 3. Add adminNote field (nullable)
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

-- 4. Verify the changes
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'purchases';
