# Setup Instructions

## Database Setup

### 1. Run Migrations
```bash
npx prisma migrate dev
```

### 2. Seed Database (IMPORTANT!)
The store items and achievements need to be seeded into the database:

```bash
npm run db:seed
```

**If you see "tsx: not found" error**, use one of these alternatives:

```bash
# Option 1: Install tsx globally
npm install -g tsx
npm run db:seed

# Option 2: Use ts-node
npx ts-node prisma/seed.ts

# Option 3: Use Prisma's seed command
npx prisma db seed
```

### 3. Verify Store Items
After seeding, the store should show 6 VP bundles:
- 475 VP → 5,000 N-Points
- 1,000 VP → 10,000 N-Points
- 2,050 VP → 20,000 N-Points
- 3,650 VP → 35,000 N-Points
- 5,350 VP → 50,000 N-Points
- 11,000 VP → 100,000 N-Points

## N-Points System Balance

### Earning N-Points

**Aim Trainer (Per Game):**
- 400+ score: 10 points
- 300-399 score: 7 points
- 200-299 score: 5 points
- 100-199 score: 2 points
- 50-99 score: 1 point

**Accuracy Bonus:**
- 95%+ accuracy: +5 points
- 90%+ accuracy: +3 points
- 85%+ accuracy: +2 points
- 80%+ accuracy: +1 point

**Maximum per game: 15 N-Points** (very difficult to achieve!)

**Lucky Wheel (Every 8 hours):**
- 2 N-Points: 35% chance
- 5 N-Points: 30% chance
- 10 N-Points: 20% chance
- 15 N-Points: 10% chance
- 25 N-Points: 4% chance
- 35 N-Points: 0.8% chance
- 50 N-Points: 0.2% chance (very rare!)

**Daily Leaderboard Rewards (Top 3):**
- 1st place: 1,000 N-Points
- 2nd place: 500 N-Points
- 3rd place: 250 N-Points

## Troubleshooting

### Store shows no items
Run the seed command to populate the database with store items.

### Migration errors
Make sure your DATABASE_URL is correct in `.env` file.

### Prisma client errors
Run `npx prisma generate` to regenerate the Prisma client.
