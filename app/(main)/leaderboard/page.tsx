"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Star, Medal, Crown, Coins } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"
import { ValorantRank } from "@/lib/types"
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
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="leaderboard" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h1 className="text-4xl font-bold text-foreground">
                  {t.leaderboard?.title || "Sıralama"}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {t.leaderboard?.subtitle || "En yüksek itibar puanlı oyuncular"}
              </p>
            </div>

            {/* Daily Rewards Info */}
            <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <h3 className="font-bold text-lg text-foreground">
                        {t.language === 'tr' ? 'Günlük Ödüller!' : 'Daily Rewards!'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t.language === 'tr'
                          ? 'İlk 3 sırada bitir ve N-Points kazan!'
                          : 'Finish in top 3 and earn N-Points!'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <Coins className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-500">1,000</p>
                      <p className="text-xs text-muted-foreground">1st</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Medal className="h-4 w-4 text-gray-400" />
                        <Coins className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xl font-bold text-gray-400">500</p>
                      <p className="text-xs text-muted-foreground">2nd</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Medal className="h-4 w-4 text-amber-600" />
                        <Coins className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-xl font-bold text-amber-600">250</p>
                      <p className="text-xs text-muted-foreground">3rd</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  {t.leaderboard?.topPlayers || "En İyi Oyuncular"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPlayers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
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
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-border group-hover:border-yellow-500/50 transition-all">
                              {getRankIcon(index) || (
                                <span className="text-xl font-bold text-foreground">
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            {/* Avatar */}
                            <div className="relative">
                              <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-yellow-500/50 transition-all">
                                <AvatarFallback
                                  className={
                                    player.user.isAdmin
                                      ? "bg-gradient-to-br from-primary to-accent text-white font-bold text-lg"
                                      : "bg-accent text-accent-foreground font-bold text-lg"
                                  }
                                >
                                  {player.nickname.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {isOnline(player.user.lastSeenAt) && (
                                <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-card" />
                              )}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-bold text-foreground group-hover:text-yellow-500 transition-colors">
                                  {player.nickname}
                                </p>
                                <p className="text-muted-foreground text-sm">{player.tagline}</p>
                                {player.user.isAdmin && (
                                  <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs border-0">
                                    ⚡ ADMIN
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className={`${getRankBadgeClass(
                                    player.rankCurrent as ValorantRank
                                  )} rank-badge text-xs`}
                                >
                                  {player.rankCurrent}
                                </Badge>
                                <Badge variant="role" className="text-xs">
                                  {player.mainRole}
                                </Badge>
                                {isOnline(player.user.lastSeenAt) && (
                                  <Badge className="bg-green-500/20 text-green-500 text-xs border-green-500/30">
                                    {t.common.online || "Online"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Reputation Score & Reward */}
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-2xl font-bold text-yellow-500">
                                  {player.reputationScore}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {t.leaderboard?.reputation || "İtibar"}
                              </span>
                              {/* Daily Reward Badge */}
                              {index < 3 && (
                                <Badge className="mt-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-500 text-xs">
                                  <Coins className="h-3 w-3 mr-1" />
                                  {index === 0 ? '+1,000' : index === 1 ? '+500' : '+250'}
                                </Badge>
                              )}
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
