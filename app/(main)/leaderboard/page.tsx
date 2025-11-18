"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Star, Medal, Crown } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"
import { Navbar } from "@/components/layout/navbar"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"
import { useLanguage } from "@/lib/i18n/language-context"
import { formatTimeAgo } from "@/lib/utils"

interface TopPlayer {
  id: string
  nickname: string
  tagline: string
  rankCurrent: string
  rankPeak: string
  mainRole: string
  reputationScore: number
  userId: string
  user: {
    id: string
    isAdmin: boolean
    lastSeenAt: string | null
  }
}

export default function LeaderboardPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchLeaderboard()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard")
      const data = await response.json()
      if (response.ok) {
        setTopPlayers(data.topPlayers || [])
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />
    return null
  }

  const getRankColor = (index: number) => {
    if (index === 0) return "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30"
    if (index === 1) return "from-gray-400/20 to-gray-500/20 border-gray-400/30"
    if (index === 2) return "from-amber-600/20 to-amber-700/20 border-amber-600/30"
    return "from-valorant-dark/30 to-valorant-dark/30 border-white/10"
  }

  const isOnline = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return new Date(lastSeenAt) >= fiveMinutesAgo
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      <Navbar profile={profile} currentPage="leaderboard" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h1 className="text-4xl font-bold text-white">
                  {t.leaderboard?.title || "İtibar Sıralaması"}
                </h1>
              </div>
              <p className="text-gray-400">
                {t.leaderboard?.subtitle || "En yüksek itibar puanlı oyuncular"}
              </p>
            </div>

            <Card className="border-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  {t.leaderboard?.topPlayers || "En İyi Oyuncular"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPlayers.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    {t.leaderboard?.noPlayers || "Henüz sıralamada oyuncu yok"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPlayers.map((player, index) => (
                      <Link key={player.id} href={`/profile/${player.userId}`}>
                        <div
                          className={`p-4 rounded-lg bg-gradient-to-r ${getRankColor(
                            index
                          )} border hover:border-yellow-500/50 transition-all cursor-pointer group`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank Number */}
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-valorant-dark/50 border border-white/10 group-hover:border-yellow-500/50 transition-all">
                              {getRankIcon(index) || (
                                <span className="text-xl font-bold text-white">
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            {/* Avatar */}
                            <div className="relative">
                              <Avatar className="h-14 w-14 ring-2 ring-white/10 group-hover:ring-yellow-500/50 transition-all">
                                <AvatarFallback
                                  className={
                                    player.user.isAdmin
                                      ? "bg-gradient-to-br from-valorant-red to-valorant-purple text-white font-bold text-lg"
                                      : "bg-valorant-purple text-white font-bold text-lg"
                                  }
                                >
                                  {player.nickname.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {isOnline(player.user.lastSeenAt) && (
                                <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-valorant-dark" />
                              )}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors">
                                  {player.nickname}
                                </p>
                                <p className="text-gray-400 text-sm">{player.tagline}</p>
                                {player.user.isAdmin && (
                                  <Badge className="bg-gradient-to-r from-valorant-red to-valorant-purple text-white text-xs border-0">
                                    ⚡ ADMIN
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className={`${getRankBadgeClass(
                                    player.rankCurrent
                                  )} rank-badge text-xs`}
                                >
                                  {player.rankCurrent}
                                </Badge>
                                <Badge variant="role" className="text-xs">
                                  {player.mainRole}
                                </Badge>
                                {isOnline(player.user.lastSeenAt) && (
                                  <Badge className="bg-green-500/20 text-green-500 text-xs border-green-500/30">
                                    Online
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Reputation Score */}
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-2xl font-bold text-yellow-500">
                                  {player.reputationScore}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {t.leaderboard?.reputation || "İtibar"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Online Users Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
