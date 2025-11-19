import { ValorantRank, PlayerRole, Seriousness, GameMode } from "./types"

// Helper function to get translated rank labels
export function getValorantRanks(t: any) {
  return [
    { value: ValorantRank.IRON, label: t.profileEdit.ranks.iron },
    { value: ValorantRank.BRONZE, label: t.profileEdit.ranks.bronze },
    { value: ValorantRank.SILVER, label: t.profileEdit.ranks.silver },
    { value: ValorantRank.GOLD, label: t.profileEdit.ranks.gold },
    { value: ValorantRank.PLATINUM, label: t.profileEdit.ranks.platinum },
    { value: ValorantRank.DIAMOND, label: t.profileEdit.ranks.diamond },
    { value: ValorantRank.ASCENDANT, label: t.profileEdit.ranks.ascendant },
    { value: ValorantRank.IMMORTAL, label: t.profileEdit.ranks.immortal },
    { value: ValorantRank.RADIANT, label: t.profileEdit.ranks.radiant },
  ]
}

// Helper function to get translated role labels
export function getPlayerRoles(t: any) {
  return [
    { value: PlayerRole.DUELIST, label: t.profileEdit.roles.duelist },
    { value: PlayerRole.CONTROLLER, label: t.profileEdit.roles.controller },
    { value: PlayerRole.SENTINEL, label: t.profileEdit.roles.sentinel },
    { value: PlayerRole.INITIATOR, label: t.profileEdit.roles.initiator },
    { value: PlayerRole.FLEX, label: t.profileEdit.roles.flex },
  ]
}

// Static exports for backwards compatibility (English labels)
export const VALORANT_RANKS = [
  { value: ValorantRank.IRON, label: "Iron" },
  { value: ValorantRank.BRONZE, label: "Bronze" },
  { value: ValorantRank.SILVER, label: "Silver" },
  { value: ValorantRank.GOLD, label: "Gold" },
  { value: ValorantRank.PLATINUM, label: "Platinum" },
  { value: ValorantRank.DIAMOND, label: "Diamond" },
  { value: ValorantRank.ASCENDANT, label: "Ascendant" },
  { value: ValorantRank.IMMORTAL, label: "Immortal" },
  { value: ValorantRank.RADIANT, label: "Radiant" },
]

export const PLAYER_ROLES = [
  { value: PlayerRole.DUELIST, label: "Duelist" },
  { value: PlayerRole.CONTROLLER, label: "Controller" },
  { value: PlayerRole.SENTINEL, label: "Sentinel" },
  { value: PlayerRole.INITIATOR, label: "Initiator" },
  { value: PlayerRole.FLEX, label: "Flex" },
]

export const SERIOUSNESS_LEVELS = [
  { value: Seriousness.CASUAL, label: "Casual" },
  { value: Seriousness.NORMAL, label: "Normal" },
  { value: Seriousness.TRYHARD, label: "Tryhard" },
]

export const GAME_MODES = [
  { value: GameMode.RANKED, label: "Ranked" },
  { value: GameMode.PREMIER, label: "Premier" },
  { value: GameMode.UNRATED, label: "Unrated" },
  { value: GameMode.CUSTOM, label: "Custom" },
]

export const REGIONS = [
  { value: "TR", label: "Turkey" },
  { value: "EU", label: "Europe" },
  { value: "EUW", label: "EU West" },
  { value: "EUNE", label: "EU Nordic & East" },
  { value: "NA", label: "North America" },
  { value: "BR", label: "Brazil" },
  { value: "LATAM", label: "LATAM" },
  { value: "KR", label: "Korea" },
  { value: "JP", label: "Japan" },
  { value: "OCE", label: "Oceania" },
  { value: "SEA", label: "Southeast Asia" },
]

export const LANGUAGES = [
  { value: "TR", label: "Turkish" },
  { value: "EN", label: "English" },
  { value: "DE", label: "German" },
  { value: "FR", label: "French" },
  { value: "ES", label: "Spanish" },
  { value: "IT", label: "Italian" },
  { value: "PT", label: "Portuguese" },
  { value: "RU", label: "Russian" },
  { value: "PL", label: "Polish" },
  { value: "AR", label: "Arabic" },
  { value: "KR", label: "Korean" },
  { value: "JP", label: "Japanese" },
]

export const VALORANT_AGENTS = [
  "Jett", "Phoenix", "Sage", "Sova", "Viper", "Cypher", "Reyna", "Killjoy",
  "Breach", "Omen", "Brimstone", "Raze", "Skye", "Yoru", "Astra", "KAY/O",
  "Chamber", "Neon", "Fade", "Harbor", "Gekko", "Deadlock", "Iso", "Clove", "Vyse"
]

export const EXPIRY_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
]

export function getRankBadgeClass(rank: ValorantRank): string {
  const rankMap: Record<ValorantRank, string> = {
    [ValorantRank.IRON]: "rank-iron",
    [ValorantRank.BRONZE]: "rank-bronze",
    [ValorantRank.SILVER]: "rank-silver",
    [ValorantRank.GOLD]: "rank-gold",
    [ValorantRank.PLATINUM]: "rank-platinum",
    [ValorantRank.DIAMOND]: "rank-diamond",
    [ValorantRank.ASCENDANT]: "rank-ascendant",
    [ValorantRank.IMMORTAL]: "rank-immortal",
    [ValorantRank.RADIANT]: "rank-radiant",
  }
  return rankMap[rank] || "rank-iron"
}

export function getRoleColor(role: PlayerRole): string {
  const roleMap: Record<PlayerRole, string> = {
    [PlayerRole.DUELIST]: "text-valorant-red",
    [PlayerRole.CONTROLLER]: "text-purple-400",
    [PlayerRole.SENTINEL]: "text-green-400",
    [PlayerRole.INITIATOR]: "text-valorant-cyan",
    [PlayerRole.FLEX]: "text-yellow-400",
  }
  return roleMap[role] || "text-gray-400"
}
