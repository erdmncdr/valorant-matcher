-- Store Items Seed SQL
-- Run this directly in your database if you can't run the TypeScript seed
-- Or use: psql -d your_database_name -f prisma/seed-store-items.sql

-- Delete existing store items (optional, comment out if you don't want to clear)
-- DELETE FROM "store_items";

-- Insert Store Items with new pricing (10x more expensive)
INSERT INTO "store_items" ("id", "type", "nameEn", "nameTr", "descriptionEn", "descriptionTr", "vpAmount", "nPointsCost", "icon", "isActive", "sortOrder", "createdAt")
VALUES
  (gen_random_uuid(), 'VP_BUNDLE', '475 VP', '475 VP', 'Small Valorant Points bundle', 'Küçük Valorant Points paketi', 475, 5000, '💎', true, 1, NOW()),
  (gen_random_uuid(), 'VP_BUNDLE', '1,000 VP', '1.000 VP', 'Medium Valorant Points bundle', 'Orta Valorant Points paketi', 1000, 10000, '💎', true, 2, NOW()),
  (gen_random_uuid(), 'VP_BUNDLE', '2,050 VP', '2.050 VP', 'Large Valorant Points bundle', 'Büyük Valorant Points paketi', 2050, 20000, '💎', true, 3, NOW()),
  (gen_random_uuid(), 'VP_BUNDLE', '3,650 VP', '3.650 VP', 'Extra Large Valorant Points bundle', 'Ekstra Büyük Valorant Points paketi', 3650, 35000, '💎', true, 4, NOW()),
  (gen_random_uuid(), 'VP_BUNDLE', '5,350 VP', '5.350 VP', 'Mega Valorant Points bundle', 'Mega Valorant Points paketi', 5350, 50000, '💎', true, 5, NOW()),
  (gen_random_uuid(), 'VP_BUNDLE', '11,000 VP', '11.000 VP', 'Ultimate Valorant Points bundle', 'Ultimate Valorant Points paketi', 11000, 100000, '💎', true, 6, NOW())
ON CONFLICT ("nameEn")
DO UPDATE SET
  "nPointsCost" = EXCLUDED."nPointsCost",
  "vpAmount" = EXCLUDED."vpAmount",
  "descriptionEn" = EXCLUDED."descriptionEn",
  "descriptionTr" = EXCLUDED."descriptionTr",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive";

-- Verify the data was inserted
SELECT "nameEn", "vpAmount", "nPointsCost", "isActive" FROM "store_items" ORDER BY "sortOrder";
