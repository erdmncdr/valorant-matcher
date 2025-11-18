-- Add reputationScore column to player_profiles table
-- This migration adds the reputationScore field and calculates initial scores from existing ratings

-- Step 1: Add the column with default value 0
ALTER TABLE player_profiles
ADD COLUMN IF NOT EXISTS "reputationScore" INTEGER NOT NULL DEFAULT 0;

-- Step 2: Update existing reputation scores based on current ratings
UPDATE player_profiles
SET "reputationScore" = (
  SELECT COALESCE(SUM(score), 0)
  FROM player_ratings
  WHERE player_ratings."targetUserId" = player_profiles."userId"
);

-- Verify the changes
SELECT
  pp.nickname,
  pp.tagline,
  pp."reputationScore",
  COUNT(pr.id) as total_ratings,
  SUM(CASE WHEN pr.score = 1 THEN 1 ELSE 0 END) as positive_ratings,
  SUM(CASE WHEN pr.score = -1 THEN 1 ELSE 0 END) as negative_ratings
FROM player_profiles pp
LEFT JOIN player_ratings pr ON pr."targetUserId" = pp."userId"
GROUP BY pp.id, pp.nickname, pp.tagline, pp."reputationScore"
ORDER BY pp."reputationScore" DESC
LIMIT 20;
