-- Make admin@needone.gg user an admin
UPDATE "player_profiles"
SET "isAdmin" = true
WHERE "userId" IN (
  SELECT id FROM users WHERE email = 'admin@needone.gg'
);

-- Verify the change
SELECT u.email, pp."isAdmin", pp.nickname
FROM users u
JOIN player_profiles pp ON pp."userId" = u.id
WHERE u.email = 'admin@needone.gg';
