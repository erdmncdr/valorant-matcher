-- Make user admin
-- Replace 'YOUR_EMAIL_HERE' with your actual email

UPDATE "player_profiles"
SET "isAdmin" = true
WHERE "userId" IN (
  SELECT id FROM users WHERE email = 'YOUR_EMAIL_HERE'
);

-- To verify:
-- SELECT u.email, pp."isAdmin"
-- FROM users u
-- JOIN player_profiles pp ON pp."userId" = u.id
-- WHERE u.email = 'YOUR_EMAIL_HERE';
