"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Star, Medal, Crown, Coins, Clock } from "lucide-react"
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
  const [weekEndDate, setWeekEndDate] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

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
        if (data.weekEndDate) {
          setWeekEndDate(new Date(data.weekEndDate))
        }
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Countdown timer effect
  useEffect(() => {
    if (!weekEndDate) return

    const updateCountdown = () => {
      const now = new Date()
      const diff = weekEndDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining(t.language === 'tr' ? 'Süre doldu!' : 'Time expired!')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeRemaining(`${days}g ${hours}s ${minutes}dk`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}s ${minutes}dk ${seconds}sn`)
      } else {
        setTimeRemaining(`${minutes}dk ${seconds}sn`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [weekEndDate, t.language])

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />
    return null
  }

  const getRankColor = (index: number) => {
    if (index === 0) return "from-yellow-500/30 via-orange-500/20 to-yellow-600/30 border-yellow-500/50 shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-500/30"
    if (index === 1) return "from-slate-400/25 via-slate-300/15 to-slate-500/25 border-slate-400/40 shadow-md shadow-slate-400/10"
    if (index === 2) return "from-amber-600/25 via-amber-500/15 to-amber-700/25 border-amber-600/40 shadow-md shadow-amber-600/10"
    if (index < 10) return "from-blue-500/10 to-blue-600/10 border-blue-500/20"
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

            {/* Weekly Rewards Info - Premium Design */}
            <Card className="border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-red-500/10 mb-6 shadow-lg shadow-yellow-500/10 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjUwLDIwNCwwLDAuMSkiLz48L2c+PC9zdmc+')] opacity-50" />
              <CardContent className="pt-6 relative">
                {/* Countdown Timer */}
                {timeRemaining && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full">
                    <Clock className="h-4 w-4 text-red-400 animate-pulse" />
                    <span className="text-sm font-bold text-red-400">{timeRemaining}</span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Trophy className="h-10 w-10 text-yellow-500 animate-pulse" />
                      <div className="absolute -inset-1 bg-yellow-500/20 rounded-full blur-md" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {t.language === 'tr' ? 'Haftalık Ödüller!' : 'Weekly Rewards!'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t.language === 'tr'
                          ? 'İlk 10 sırada bitir ve N-Points kazan!'
                          : 'Finish in top 10 and earn N-Points!'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 md:gap-6">
                    {/* 1st Place - Most Glamorous */}
                    <div className="text-center p-3 rounded-xl bg-gradient-to-b from-yellow-500/30 to-yellow-600/10 border border-yellow-500/50 shadow-lg shadow-yellow-500/20 relative overflow-hidden group hover:scale-105 transition-transform">
                      <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-1 justify-center mb-2">
                          <Crown className="h-7 w-7 text-yellow-400 drop-shadow-lg" />
                        </div>
                        <p className="text-3xl font-black text-yellow-400 drop-shadow-lg">100</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <p className="text-xs font-bold text-yellow-500">N-Points</p>
                        </div>
                        <p className="text-xs text-yellow-300 mt-1 font-semibold">1st</p>
                      </div>
                    </div>
                    {/* 2nd Place */}
                    <div className="text-center p-3 rounded-xl bg-gradient-to-b from-slate-400/30 to-slate-500/10 border border-slate-400/50 shadow-lg shadow-slate-400/10 relative overflow-hidden group hover:scale-105 transition-transform">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-400/10 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-1 justify-center mb-2">
                          <Medal className="h-6 w-6 text-slate-300 drop-shadow-lg" />
                        </div>
                        <p className="text-2xl font-bold text-slate-300">50</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Coins className="h-3 w-3 text-slate-400" />
                          <p className="text-xs text-slate-400">N-Points</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">2nd</p>
                      </div>
                    </div>
                    {/* 3rd Place */}
                    <div className="text-center p-3 rounded-xl bg-gradient-to-b from-amber-600/30 to-amber-700/10 border border-amber-600/50 shadow-lg shadow-amber-600/10 relative overflow-hidden group hover:scale-105 transition-transform">
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-600/10 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-1 justify-center mb-2">
                          <Medal className="h-5 w-5 text-amber-500 drop-shadow-lg" />
                        </div>
                        <p className="text-xl font-bold text-amber-500">25</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Coins className="h-3 w-3 text-amber-600" />
                          <p className="text-xs text-amber-600">N-Points</p>
                        </div>
                        <p className="text-xs text-amber-500 mt-1 font-semibold">3rd</p>
                      </div>
                    </div>
                    {/* Top 10 */}
                    <div className="text-center p-3 rounded-xl bg-gradient-to-b from-blue-500/20 to-blue-600/10 border border-blue-500/30 relative overflow-hidden group hover:scale-105 transition-transform">
                      <div className="relative">
                        <div className="flex items-center gap-1 justify-center mb-2">
                          <Star className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-lg font-bold text-blue-400">10</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Coins className="h-3 w-3 text-blue-500" />
                          <p className="text-xs text-blue-500">N-Points</p>
                        </div>
                        <p className="text-xs text-blue-400 mt-1">4-10th</p>
                      </div>
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
                              {index < 10 && (
                                <Badge className={`mt-2 text-xs ${
                                  index === 0
                                    ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-500/60 text-yellow-400 shadow-lg shadow-yellow-500/20 animate-pulse'
                                    : index === 1
                                    ? 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/50 text-slate-300'
                                    : index === 2
                                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/50 text-amber-500'
                                    : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/50 text-blue-400'
                                }`}>
                                  <Coins className="h-3 w-3 mr-1" />
                                  {index === 0 ? '+100' : index === 1 ? '+50' : index === 2 ? '+25' : '+10'}
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
