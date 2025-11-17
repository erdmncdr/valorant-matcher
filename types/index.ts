import {
  User,
  PlayerProfile,
  Listing,
  ListingApplication,
  ListingMessage,
  PlayerRating,
  Report,
  Block,
  ValorantRank,
  PlayerRole,
  Seriousness,
  ListingType,
  ListingStatus,
  GameMode,
  ReportReason,
  ReportStatus
} from '@prisma/client'

// Re-export Prisma types
export type {
  User,
  PlayerProfile,
  Listing,
  ListingApplication,
  ListingMessage,
  PlayerRating,
  Report,
  Block,
}

// Re-export enums
export {
  ValorantRank,
  PlayerRole,
  Seriousness,
  ListingType,
  ListingStatus,
  GameMode,
  ReportReason,
  ReportStatus,
}

// Extended types with relations
export type UserWithProfile = User & {
  playerProfile: PlayerProfile | null
}

export type ListingWithOwner = Listing & {
  owner: User & {
    playerProfile: PlayerProfile | null
  }
  applications?: ListingApplication[]
  _count?: {
    applications: number
  }
}

export type ListingApplicationWithUser = ListingApplication & {
  applicant: User & {
    playerProfile: PlayerProfile | null
  }
}

export type MessageWithSender = ListingMessage & {
  sender: User & {
    playerProfile: PlayerProfile | null
  }
}

export type RatingWithUsers = PlayerRating & {
  rater: UserWithProfile
  target: UserWithProfile
}

export type ReportWithUsers = Report & {
  reporter: UserWithProfile
  target: UserWithProfile
}

// WebSocket event types
export type WebSocketEvent =
  | { type: 'listing:created'; data: ListingWithOwner }
  | { type: 'listing:updated'; data: { id: string; status: ListingStatus } }
  | { type: 'listing:expired'; data: { id: string } }
  | { type: 'message:new'; data: MessageWithSender }
  | { type: 'application:new'; data: ListingApplicationWithUser }
  | { type: 'application:updated'; data: { id: string; status: string } }
  | { type: 'user:online'; data: { userId: string; online: boolean } }

// Form types
export interface CreateListingInput {
  listingType: ListingType
  title: string
  mode: GameMode
  region: string
  languages: string[]
  seriousness: Seriousness
  voiceRequired: boolean
  minRank: ValorantRank
  maxRank: ValorantRank
  stackSize?: number
  desiredRole?: PlayerRole
  description?: string
  expiryMinutes: number
}

export interface CreateProfileInput {
  nickname: string
  tagline: string
  region: string
  rankCurrent: ValorantRank
  rankPeak: ValorantRank
  mainRole: PlayerRole
  languages: string[]
  mic: boolean
  seriousness: Seriousness
  typicalPlaytime?: string
  bio?: string
  agents: { agentName: string; priority: string }[]
}

export interface CreateRatingInput {
  targetUserId: string
  listingId: string
  score: number
  tags: string[]
  comment?: string
}

export interface CreateReportInput {
  targetUserId: string
  listingId?: string
  reason: ReportReason
  description: string
}

// Listing filters
export interface ListingFilters {
  listingType?: ListingType
  minRank?: ValorantRank
  maxRank?: ValorantRank
  region?: string
  languages?: string[]
  mode?: GameMode
  seriousness?: Seriousness
  desiredRole?: PlayerRole
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
