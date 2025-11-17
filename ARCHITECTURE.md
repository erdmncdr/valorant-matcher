# NeedOne - Valorant Matchmaking App Architecture

## Overview
NeedOne is a full-stack web application for Valorant players to find compatible 5th teammates through a structured listing system with reputation tracking and moderation.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context + Server Components
- **Real-time**: WebSocket client

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js (email/password + Discord OAuth)
- **Real-time**: WebSocket server (ws library)

### Infrastructure
- **Deployment**: Production-ready Next.js deployment
- **Database Hosting**: PostgreSQL instance
- **Environment**: Environment variables for secrets

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Pages    │  │ Components │  │  WebSocket Client    │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                           │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  API Routes    │  │  Auth Layer  │  │ WebSocket API  │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
│  ┌────────────────┐  ┌──────────────┐                      │
│  │ Server Actions │  │ Middleware   │                      │
│  └────────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Prisma)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Entities

#### User & Authentication
- **User**: Core user account (id, email, password_hash, is_banned, banned_until, ban_reason, is_admin)
- **SocialAccount**: OAuth provider accounts (Discord)
- **Session**: Auth sessions

#### Player Data
- **PlayerProfile**: Valorant-specific player info (rank, role, agents, languages, playtime)
- **PlayerAgent**: Many-to-many relationship for agents and roles

#### Listings
- **Listing**: Team or solo listings (type, status, expiry, constraints)
- **ListingApplication**: Applications/interest from users

#### Communication
- **ListingMessage**: Chat messages within listing context

#### Reputation & Safety
- **PlayerRating**: User ratings with tags
- **Report**: User reports with moderation status
- **Block**: User blocking relationships

## Page Map

### Public Pages
- `/` - Landing page with CTA
- `/login` - Email/password + Discord OAuth login
- `/register` - Email/password registration

### Authenticated Pages
- `/dashboard` - Main dashboard after login
- `/profile/complete` - First-time profile setup
- `/profile/edit` - Edit player profile
- `/profile/[userId]` - View user profile
- `/listings` - Browse team/solo listings with filters
- `/listings/create` - Create new listing
- `/listings/[id]` - Listing detail with chat and applications
- `/my-listings` - User's own listings and applications

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/reports` - Manage reports
- `/admin/users` - User management and bans

## API Routes

### Authentication
- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Profile
- `GET /api/profile` - Get current user's profile
- `POST /api/profile` - Create/update profile
- `GET /api/profile/[userId]` - Get user profile

### Listings
- `GET /api/listings` - List listings with filters
- `POST /api/listings` - Create listing
- `GET /api/listings/[id]` - Get listing details
- `POST /api/listings/[id]/close` - Close listing
- `POST /api/listings/[id]/apply` - Apply to listing
- `POST /api/listings/[id]/applications/[appId]/accept` - Accept application
- `POST /api/listings/[id]/applications/[appId]/decline` - Decline application

### Chat
- `GET /api/listings/[id]/messages` - Get chat messages
- `POST /api/listings/[id]/messages` - Send message (also via WebSocket)

### Reputation
- `POST /api/ratings` - Submit rating
- `GET /api/users/[userId]/ratings` - Get user ratings

### Safety
- `POST /api/reports` - Submit report
- `POST /api/blocks` - Block user
- `GET /api/blocks` - Get blocked users

### Admin
- `GET /api/admin/reports` - List reports
- `PATCH /api/admin/reports/[id]` - Update report status
- `PATCH /api/admin/users/[id]/ban` - Ban/unban user

## Real-Time Features

### WebSocket Events
- `listing:created` - New listing created
- `listing:updated` - Listing updated (status, etc.)
- `listing:expired` - Listing expired
- `message:new` - New chat message
- `application:new` - New application to listing
- `application:updated` - Application status changed
- `user:online` - User online status update

## Component Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── dashboard/
│   │   ├── listings/
│   │   ├── profile/
│   │   └── my-listings/
│   ├── admin/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── listings/
│   ├── profile/
│   ├── chat/
│   └── moderation/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── websocket.ts
│   └── utils.ts
├── hooks/
│   ├── useWebSocket.ts
│   ├── useListings.ts
│   └── useChat.ts
└── types/
    └── index.ts
```

## Security Considerations

1. **Authentication**: Secure session management with NextAuth.js
2. **Authorization**: Route protection via middleware
3. **Input Validation**: Zod schemas for all API inputs
4. **SQL Injection**: Prisma parameterized queries
5. **XSS Prevention**: React's built-in escaping + CSP headers
6. **Rate Limiting**: API rate limits for sensitive operations
7. **Ban Enforcement**: Check ban status on all authenticated operations

## Key Features Implementation

### Listing Expiry
- Background job checks expired listings every minute
- Auto-update status to "expired"
- Filter expired listings from all queries
- Optional cleanup job to delete old expired listings

### Real-Time Updates
- WebSocket connection established on authenticated pages
- Subscribe to listing/chat channels
- Optimistic UI updates with server confirmation
- Reconnection logic for dropped connections

### Reputation System
- One rating per user per listing
- Aggregate positive/negative counts
- Tag frequency analysis for top 3 positive tags
- Display on profile cards and detail pages

### Moderation Workflow
1. User reports violation
2. Report appears in admin panel
3. Admin reviews and investigates
4. Admin sets ban (temporary or permanent)
5. Banned user cannot create listings or send messages
6. All user's listings auto-closed on ban

## Development Phases

### Phase 1: Core Features
1. ✅ Project setup and architecture
2. Database schema and Prisma setup
3. Authentication (email + Discord OAuth)
4. Player profiles
5. Listing system with expiry
6. Real-time updates
7. Chat system
8. Reputation v1

### Phase 2: Safety & Moderation
1. Reporting system
2. Blocking functionality
3. Admin panel
4. Ban management

### Phase 3: Polish & Deploy
1. UI/UX refinements
2. Testing
3. Seed data
4. Production deployment

## Environment Variables

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

## Testing Strategy

1. **Unit Tests**: Critical business logic functions
2. **Integration Tests**: API routes with test database
3. **E2E Tests**: Key user flows (auth, create listing, chat)
4. **Manual Testing**: UI/UX, real-time features, moderation

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build successful
- [ ] SSL certificate configured
- [ ] WebSocket server running
- [ ] Admin user seeded
- [ ] Error monitoring setup
- [ ] Backup strategy in place
