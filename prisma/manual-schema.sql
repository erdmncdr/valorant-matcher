-- Manual schema creation from Prisma schema
-- This is a workaround for environments where Prisma binaries cannot be downloaded

-- Create enums
CREATE TYPE "ValorantRank" AS ENUM ('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT');
CREATE TYPE "PlayerRole" AS ENUM ('DUELIST', 'CONTROLLER', 'SENTINEL', 'INITIATOR', 'FLEX');
CREATE TYPE "Seriousness" AS ENUM ('CASUAL', 'NORMAL', 'TRYHARD');
CREATE TYPE "ListingType" AS ENUM ('TEAM', 'SOLO');
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'CLOSED', 'EXPIRED');
CREATE TYPE "GameMode" AS ENUM ('RANKED', 'PREMIER', 'UNRATED', 'CUSTOM');
CREATE TYPE "ReportReason" AS ENUM ('TOXIC_VOICE', 'VERBAL_ABUSE', 'INSULTS', 'RACISM', 'SEXISM', 'HARASSMENT', 'GRIEFING', 'CHEATING_SUSPICION', 'SPAM', 'OTHER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLOSED');
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_RECEIVED', 'APPLICATION_ACCEPTED', 'APPLICATION_DECLINED', 'PRIVATE_MESSAGE', 'RATING_RECEIVED', 'LISTING_EXPIRING');

-- Create tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT UNIQUE,
    "password_hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedUntil" TIMESTAMP(3),
    "banReason" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("provider", "providerUserId")
);

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("provider", "providerAccountId")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP(3) NOT NULL,
    UNIQUE("identifier", "token")
);

CREATE TABLE "player_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "nickname" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "rankCurrent" "ValorantRank" NOT NULL,
    "rankPeak" "ValorantRank" NOT NULL,
    "mainRole" "PlayerRole" NOT NULL,
    "languages" TEXT[] NOT NULL,
    "mic" BOOLEAN NOT NULL DEFAULT true,
    "seriousness" "Seriousness" NOT NULL DEFAULT 'NORMAL',
    "typicalPlaytime" TEXT,
    "bio" TEXT,
    CONSTRAINT "player_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "player_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    CONSTRAINT "player_agents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "player_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerUserId" TEXT NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    "region" TEXT NOT NULL,
    "languages" TEXT[] NOT NULL,
    "seriousness" "Seriousness" NOT NULL,
    "voiceRequired" BOOLEAN NOT NULL DEFAULT true,
    "minRank" "ValorantRank" NOT NULL,
    "maxRank" "ValorantRank" NOT NULL,
    "stackSize" INTEGER,
    "desiredRole" "PlayerRole",
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "expiryMinutes" INTEGER NOT NULL,
    CONSTRAINT "listings_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "listing_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_applications_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "listing_applications_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("listingId", "applicantUserId")
);

CREATE TABLE "listing_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_messages_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "listing_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "player_ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raterUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "tags" TEXT[] NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_ratings_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_ratings_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_ratings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("raterUserId", "targetUserId", "listingId")
);

CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "listingId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerUserId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocks_blockerUserId_fkey" FOREIGN KEY ("blockerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("blockerUserId", "blockedUserId")
);

CREATE TABLE "private_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderUserId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "private_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "private_messages_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX "listings_status_expiresAt_idx" ON "listings"("status", "expiresAt");
CREATE INDEX "listings_listingType_status_idx" ON "listings"("listingType", "status");
CREATE INDEX "listing_messages_listingId_createdAt_idx" ON "listing_messages"("listingId", "createdAt");
CREATE INDEX "private_messages_senderUserId_receiverUserId_createdAt_idx" ON "private_messages"("senderUserId", "receiverUserId", "createdAt");
CREATE INDEX "private_messages_receiverUserId_isRead_idx" ON "private_messages"("receiverUserId", "isRead");
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");
