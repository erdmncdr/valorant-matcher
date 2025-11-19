// Manually defined enums from Prisma schema
// This file exists because Prisma client generation may fail in restricted environments

export enum ValorantRank {
  IRON = "IRON",
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
  DIAMOND = "DIAMOND",
  ASCENDANT = "ASCENDANT",
  IMMORTAL = "IMMORTAL",
  RADIANT = "RADIANT",
}

export enum PlayerRole {
  DUELIST = "DUELIST",
  CONTROLLER = "CONTROLLER",
  SENTINEL = "SENTINEL",
  INITIATOR = "INITIATOR",
  FLEX = "FLEX",
}

export enum Seriousness {
  CASUAL = "CASUAL",
  NORMAL = "NORMAL",
  TRYHARD = "TRYHARD",
}

export enum GameMode {
  RANKED = "RANKED",
  PREMIER = "PREMIER",
  UNRATED = "UNRATED",
  CUSTOM = "CUSTOM",
}

export enum ListingType {
  TEAM = "TEAM",
  SOLO = "SOLO",
}

export enum Region {
  TR = "TR",
  EU = "EU",
  EUW = "EUW",
  EUNE = "EUNE",
  NA = "NA",
  BR = "BR",
  LATAM = "LATAM",
  KR = "KR",
  JP = "JP",
  OCE = "OCE",
  SEA = "SEA",
}

export enum ListingStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  EXPIRED = "EXPIRED",
}

export enum ReportCategory {
  IN_GAME = "IN_GAME",
  ON_PLATFORM = "ON_PLATFORM",
}

export enum ReportReason {
  TOXIC_VOICE = "TOXIC_VOICE",
  VERBAL_ABUSE = "VERBAL_ABUSE",
  INSULTS = "INSULTS",
  RACISM = "RACISM",
  SEXISM = "SEXISM",
  HARASSMENT = "HARASSMENT",
  GRIEFING = "GRIEFING",
  CHEATING_SUSPICION = "CHEATING_SUSPICION",
  SPAM = "SPAM",
  INAPPROPRIATE_CONTENT = "INAPPROPRIATE_CONTENT",
  OTHER = "OTHER",
}

export enum ReportStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export enum AchievementCategory {
  GENERAL = "GENERAL",
  MATCHMAKING = "MATCHMAKING",
  SOCIAL = "SOCIAL",
  SKILL = "SKILL",
  REPUTATION = "REPUTATION",
}
