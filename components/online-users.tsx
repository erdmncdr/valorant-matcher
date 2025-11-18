"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch(`/api/users/online`)
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
  }, [])

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
        <div className="flex items-center justify-between">
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

            const isOnline = status.color === "bg-green-500"

            return (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className="block"
              >
                <div className={`p-3 rounded-lg transition-all cursor-pointer group ${
                  isOnline
                    ? "bg-green-500/10 border-2 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/15 shadow-lg shadow-green-500/5"
                    : "bg-valorant-dark/30 border border-white/5 hover:border-valorant-purple/30 hover:bg-valorant-dark/50"
                }`}>
                  <div className="flex items-start gap-2">
                    <div className="relative">
                      <Avatar className={`h-9 w-9 transition-all ${
                        isOnline
                          ? "ring-2 ring-green-500/50 group-hover:ring-green-500/70"
                          : "ring-1 ring-white/10 group-hover:ring-valorant-purple/50"
                      }`}>
                        <AvatarFallback
                          className={
                            user.isAdmin
                              ? "bg-gradient-to-br from-valorant-red to-valorant-purple text-white text-xs font-bold"
                              : isOnline
                              ? "bg-green-600 text-white text-xs font-semibold"
                              : "bg-valorant-purple text-white text-xs"
                          }
                        >
                          {profile.nickname.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 ${status.color} rounded-full border-2 border-valorant-dark ${isOnline ? 'animate-pulse' : ''}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className={`text-xs font-medium truncate transition-colors ${
                          isOnline
                            ? "text-white font-semibold group-hover:text-green-400"
                            : "text-white group-hover:text-valorant-purple"
                        }`}>
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
                      </div>

                      <p className={`text-[10px] mt-0.5 ${
                        isOnline ? "text-green-400 font-medium" : "text-gray-500"
                      }`}>
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
