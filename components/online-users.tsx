"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, TrendingUp, Clock, Star } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"
import { formatTimeAgo } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-context"

interface OnlineUser {
  id: string
  isAdmin: boolean
  lastSeenAt: string
  playerProfile: {
    nickname: string
    tagline: string
    rankCurrent: string
    mainRole: string
    reputationScore: number
  } | null
}

export function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [sortBy, setSortBy] = useState<"lastSeen" | "reputation">("lastSeen")
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch(`/api/users/online?sortBy=${sortBy}`)
      const data = await response.json()
      if (response.ok) {
        setOnlineUsers(data.onlineUsers || [])
      }
    } catch (error) {
      console.error("Failed to fetch online users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOnlineUsers()

    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30 * 1000)

    return () => clearInterval(interval)
  }, [sortBy])

  const getOnlineStatus = (lastSeenAt: string) => {
    const lastSeen = new Date(lastSeenAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60

    if (diffMinutes < 1) return { text: "Online", color: "bg-green-500" }
    if (diffMinutes < 5) return { text: formatTimeAgo(lastSeen), color: "bg-green-500" }
    return { text: formatTimeAgo(lastSeen), color: "bg-gray-500" }
  }

  return (
    <Card className="border-valorant-purple/20 sticky top-20 h-fit max-h-[calc(100vh-6rem)] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <div className="relative">
              <Users className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            {t.nav.onlineUsers || "Online"}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {onlineUsers.length}
          </Badge>
        </div>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastSeen">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{t.nav.sortByActivity || "Son Görülme"}</span>
              </div>
            </SelectItem>
            <SelectItem value="reputation">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                <span>{t.nav.sortByReputation || "İtibar Puanı"}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-0">
        {isLoading ? (
          <div className="text-center text-gray-400 text-sm py-4">
            {t.common.loading || "Loading..."}
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            {t.nav.noOnlineUsers || "Şu anda kimse online değil"}
          </div>
        ) : (
          onlineUsers.map((user) => {
            const status = getOnlineStatus(user.lastSeenAt)
            const profile = user.playerProfile

            if (!profile) return null

            return (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className="block"
              >
                <div className="p-2 rounded-lg bg-valorant-dark/30 border border-white/5 hover:border-valorant-purple/30 hover:bg-valorant-dark/50 transition-all cursor-pointer group">
                  <div className="flex items-start gap-2">
                    <div className="relative">
                      <Avatar className="h-8 w-8 ring-1 ring-white/10 group-hover:ring-valorant-purple/50 transition-all">
                        <AvatarFallback
                          className={
                            user.isAdmin
                              ? "bg-gradient-to-br from-valorant-red to-valorant-purple text-white text-xs font-bold"
                              : "bg-valorant-purple text-white text-xs"
                          }
                        >
                          {profile.nickname.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 ${status.color} rounded-full border-2 border-valorant-dark`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium text-white truncate group-hover:text-valorant-purple transition-colors">
                          {profile.nickname}
                        </p>
                        {user.isAdmin && (
                          <Badge className="h-4 px-1 text-[10px] bg-gradient-to-r from-valorant-red to-valorant-purple border-0">
                            ⚡
                          </Badge>
                        )}
                      </div>

                      <p className="text-[10px] text-gray-400 truncate">
                        {profile.tagline}
                      </p>

                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          className={`${getRankBadgeClass(
                            profile.rankCurrent
                          )} rank-badge text-[9px] px-1 py-0 h-4`}
                        >
                          {profile.rankCurrent}
                        </Badge>

                        {sortBy === "reputation" && (
                          <div className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                            <Star className="h-2.5 w-2.5 fill-yellow-500" />
                            <span className="font-semibold">{profile.reputationScore}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {status.text}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
