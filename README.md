# NeedOne - Valorant 5th Player Matchmaking App

A full-stack web application for Valorant players to find compatible 5th teammates through a structured listing system with reputation tracking and moderation.

## 📚 Documentation

- 🚀 **[Hızlı Başlangıç (Quick Start)](./HIZLI-BASLANGIC.md)** - 5 dakikada çalıştır! (Türkçe)
- 📘 **[Detaylı Kurulum Rehberi (Installation Guide)](./KURULUM.md)** - Adım adım kurulum (Türkçe)
- 🏗️ **[Architecture](./ARCHITECTURE.md)** - Technical architecture and design decisions
- 📖 **[README (English)](./README.md)** - This file

**New to the project?** Start with [Quick Start Guide](./HIZLI-BASLANGIC.md)!

---

## Features

### Phase 1 (Implemented)
- ✅ **Authentication System**: Email/password + Discord OAuth
- ✅ **Player Profiles**: Detailed Valorant profiles with rank, role, agents, and preferences
- ✅ **Listing System**: Team and solo listings with automatic expiry
- ✅ **Real-time Updates**: WebSocket-based live updates
- ✅ **Chat System**: Built-in messaging for each listing
- ✅ **Reputation System**: Rate players after playing together
- ✅ **Safety Features**: Report and block toxic players
- ✅ **Admin Panel**: Moderation tools for banning users

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: WebSockets (ws library)
- **UI Components**: shadcn/ui (Radix UI)

## 🚀 Quick Start

Want to get started quickly? See our **[Quick Start Guide](./HIZLI-BASLANGIC.md)** for a 5-minute setup!

### TL;DR

```bash
# 1. Clone and install
git clone <repository-url>
cd valorant-matcher
npm install

# 2. Start PostgreSQL (Docker)
docker run --name needone-postgres \
  -e POSTGRES_PASSWORD=needone2024 \
  -e POSTGRES_DB=needone \
  -p 5432:5432 -d postgres:15

# 3. Setup environment
cp .env.example .env
# Edit .env: Add DATABASE_URL and NEXTAUTH_SECRET

# 4. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Run!
npm run dev
```

Open http://localhost:3000 🎉

**Test Account:** `admin@needone.gg` / `password123`

For detailed instructions, see [Installation Guide](./KURULUM.md).

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Docker)
- Discord OAuth app (optional, for Discord login)

### Installation

For detailed step-by-step instructions in Turkish, see **[KURULUM.md](./KURULUM.md)**.

#### Basic Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd valorant-matcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env   # macOS/Linux
   copy .env.example .env # Windows
   ```

   Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:needone2024@localhost:5432/needone"
   NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
   NEXTAUTH_URL="http://localhost:3000"
   DISCORD_CLIENT_ID=""  # Optional
   DISCORD_CLIENT_SECRET=""  # Optional
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed  # Adds test accounts
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Using Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE needone;
   ```
3. Update `DATABASE_URL` in `.env` with your connection string

### Using Docker (Quick Start)

```bash
docker run --name needone-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=needone \
  -p 5432:5432 \
  -d postgres:15
```

Then use: `DATABASE_URL="postgresql://postgres:password@localhost:5432/needone"`

## Discord OAuth Setup (Optional)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 → Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
4. Copy Client ID and Client Secret to `.env`

## Project Structure

```
valorant-matcher/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (main)/              # Main app pages (dashboard, listings)
│   ├── api/                 # API routes
│   └── profile/             # Profile pages
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── listings/            # Listing-specific components
│   └── profile/             # Profile-specific components
├── lib/                     # Utilities and configuration
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   ├── constants.ts        # App constants
│   └── utils.ts            # Helper functions
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma       # Prisma schema
│   └── seed.ts             # Seed script
├── types/                   # TypeScript types
└── hooks/                   # Custom React hooks
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Features Guide

### Creating a Profile

1. Sign up with email/password or Discord
2. Complete your profile with:
   - In-game name and tagline
   - Current and peak rank
   - Main role and agents
   - Region and languages
   - Communication preferences

### Finding Teammates

**As a 4-Stack (Team):**
1. Create a "Team" listing
2. Specify what role you need
3. Set rank requirements
4. Solo players will apply to join
5. Review applications and chat with candidates

**As a Solo Player:**
1. Create a "Solo" listing
2. Showcase your role and rank
3. Teams will reach out to you
4. Review offers and connect with teams

### Listing Expiry

- All listings have an expiry time (30min - 4 hours)
- Expired listings are automatically hidden
- Close your listing manually when you find a player

### Safety & Moderation

- **Report** toxic behavior from user profiles
- **Block** users to avoid seeing their listings
- Admins can ban users temporarily or permanently
- Banned users cannot create listings or send messages

### Reputation System

- Rate players after playing together
- Give positive/negative ratings with tags
- Build trust through positive feedback
- View reputation on user profiles

## Deployment

### Environment Setup

1. Set up a PostgreSQL database (e.g., Railway, Supabase, Neon)
2. Configure environment variables in your hosting platform
3. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

### Recommended Platforms

- **Vercel** (recommended for Next.js)
- **Railway** (includes PostgreSQL)
- **Render**
- **Fly.io**

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production `DATABASE_URL`
- [ ] Set correct `NEXTAUTH_URL`
- [ ] Enable Discord OAuth in production
- [ ] Run database migrations
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure backup strategy for database
- [ ] Set up SSL/HTTPS
- [ ] Test all critical flows

## Admin Panel

To make a user an admin:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your-email@example.com';
```

Admin features:
- View all reports
- Ban/unban users
- Moderate content
- Access user management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Legal Notice

This application is not affiliated with, endorsed by, or in any way officially connected with Riot Games or Valorant. All product names, logos, and brands are property of their respective owners.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review the architecture doc in `ARCHITECTURE.md`

---

Built with ❤️ for the Valorant community
