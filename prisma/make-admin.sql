-- Make admin@needone.gg user an admin
UPDATE "users"
SET "isAdmin" = true
WHERE email = 'admin@needone.gg';

-- Verify the change
SELECT u.email, u."isAdmin", pp.nickname
FROM users u
LEFT JOIN player_profiles pp ON pp."userId" = u.id
WHERE u.email = 'admin@needone.gg';
