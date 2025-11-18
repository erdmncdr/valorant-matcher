import { ValorantRank, PlayerRole, Seriousness, GameMode } from "@prisma/client"

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

// Preset Avatar URLs - Valorant themed
export const PRESET_AVATARS = [
  { id: 1, url: "https://api.dicebear.com/7.x/bottts/svg?seed=valorant1&backgroundColor=ff4655" },
  { id: 2, url: "https://api.dicebear.com/7.x/bottts/svg?seed=valorant2&backgroundColor=53212b" },
  { id: 3, url: "https://api.dicebear.com/7.x/bottts/svg?seed=valorant3&backgroundColor=0f1923" },
  { id: 4, url: "https://api.dicebear.com/7.x/bottts/svg?seed=jett&backgroundColor=429cc4" },
  { id: 5, url: "https://api.dicebear.com/7.x/bottts/svg?seed=phoenix&backgroundColor=ff4655" },
  { id: 6, url: "https://api.dicebear.com/7.x/bottts/svg?seed=sage&backgroundColor=5dc9a8" },
  { id: 7, url: "https://api.dicebear.com/7.x/bottts/svg?seed=sova&backgroundColor=4a8bc2" },
  { id: 8, url: "https://api.dicebear.com/7.x/bottts/svg?seed=viper&backgroundColor=4d9b6b" },
  { id: 9, url: "https://api.dicebear.com/7.x/bottts/svg?seed=cypher&backgroundColor=bd9a68" },
  { id: 10, url: "https://api.dicebear.com/7.x/bottts/svg?seed=reyna&backgroundColor=9d4dbb" },
  { id: 11, url: "https://api.dicebear.com/7.x/bottts/svg?seed=killjoy&backgroundColor=ffd23f" },
  { id: 12, url: "https://api.dicebear.com/7.x/bottts/svg?seed=breach&backgroundColor=ff6a39" },
  { id: 13, url: "https://api.dicebear.com/7.x/bottts/svg?seed=omen&backgroundColor=4650db" },
  { id: 14, url: "https://api.dicebear.com/7.x/bottts/svg?seed=raze&backgroundColor=ff6347" },
  { id: 15, url: "https://api.dicebear.com/7.x/bottts/svg?seed=skye&backgroundColor=87ceeb" },
  { id: 16, url: "https://api.dicebear.com/7.x/bottts/svg?seed=yoru&backgroundColor=4169e1" },
  { id: 17, url: "https://api.dicebear.com/7.x/bottts/svg?seed=astra&backgroundColor=9370db" },
  { id: 18, url: "https://api.dicebear.com/7.x/bottts/svg?seed=chamber&backgroundColor=daa520" },
  { id: 19, url: "https://api.dicebear.com/7.x/bottts/svg?seed=neon&backgroundColor=00bfff" },
  { id: 20, url: "https://api.dicebear.com/7.x/bottts/svg?seed=fade&backgroundColor=483d8b" },
]
