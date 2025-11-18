"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Star,
  MapPin,
  Languages,
  Shield,
  Mic,
  Calendar,
  ArrowLeft
} from "lucide-react"
import { getRankBadgeClass, getRoleColor } from "@/lib/constants"
import { useLanguage } from "@/lib/i18n/language-context"
import { useToast } from "@/hooks/use-toast"

export default function UserProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchUserProfile()
    }
  }, [status, router])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile")
      }

      setUser(data.user)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error.message,
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">{t.common.userNotFound || "User not found"}</p>
          <Link href="/dashboard">
            <Button variant="valorant">{t.nav.dashboard || "Dashboard"}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = session?.user?.id === user.id
  const profile = user.playerProfile

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-valorant-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                <span className="text-white font-bold text-xl">N1</span>
              </div>
              <span className="text-white font-bold text-xl">{t.nav.logo}</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/listings">
                <Button variant="ghost" className="text-white">{t.nav.findPlayers || "Find Players"}</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white">{t.nav.dashboard || "Dashboard"}</Button>
              </Link>
              {isOwnProfile && (
                <Link href="/profile/edit">
                  <Button variant="valorant">{t.nav.editProfile || "Edit Profile"}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.nav.dashboard || "Back to Dashboard"}
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-valorant-purple/20 bg-card/50 backdrop-blur sticky top-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarFallback className="bg-valorant-red text-white text-4xl">
                      {profile?.nickname?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">
                      {profile?.nickname}
                    </h1>
                    <p className="text-gray-400 text-lg">{profile?.tagline}</p>

                    {user.isAdmin && (
                      <Badge className="bg-gradient-to-r from-valorant-red to-valorant-purple text-white border-0 shadow-lg">
                        <Shield className="h-3 w-3 mr-1" />
                        ADMIN
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-center gap-3 mt-4">
                    <div>
                      <Badge className={`${getRankBadgeClass(profile?.rankCurrent)} rank-badge`}>
                        {profile?.rankCurrent}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{t.dashboard.currentRank}</p>
                    </div>
                    <div>
                      <Badge className={`${getRankBadgeClass(profile?.rankPeak)} rank-badge`}>
                        {profile?.rankPeak}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{t.dashboard.peakRank}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`h-8 w-8 rounded-lg ${getRoleColor(profile?.mainRole || "FLEX")} flex items-center justify-center`}>
                        <Star className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">{t.dashboard.mainRole}</p>
                        <p className="text-white font-medium">{profile?.mainRole}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-valorant-cyan/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-valorant-cyan" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">{t.dashboard.region}</p>
                        <p className="text-white font-medium">{profile?.region}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Languages className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">{t.dashboard.languages}</p>
                        <p className="text-white font-medium">{profile?.languages?.join(", ")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Mic className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Microphone</p>
                        <p className="text-white font-medium">{profile?.mic ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {profile?.typicalPlaytime && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Typical Playtime</p>
                          <p className="text-white font-medium text-xs">{profile?.typicalPlaytime}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reputation Card */}
            <Card className="border-valorant-cyan/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {t.common.reputation || "Reputation"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ThumbsUp className="h-6 w-6 text-green-500" />
                      <span className="text-3xl font-bold text-green-500">
                        {user.reputation?.positive || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{t.common.positive || "Positive"}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ThumbsDown className="h-6 w-6 text-red-500" />
                      <span className="text-3xl font-bold text-red-500">
                        {user.reputation?.negative || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{t.common.negative || "Negative"}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <span className="text-3xl font-bold text-white">
                        {user.reputation?.total || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{t.common.total || "Total"}</p>
                  </div>
                </div>

                {user.reputation?.topTags && user.reputation.topTags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">{t.common.topTags || "Top Tags"}</p>
                    <div className="flex flex-wrap gap-2">
                      {user.reputation.topTags.map((tagData: any) => (
                        <Badge key={tagData.tag} variant="secondary" className="text-sm">
                          {tagData.tag} <span className="ml-1 text-gray-400">({tagData.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agents Card */}
            {profile?.playerAgents && profile.playerAgents.length > 0 && (
              <Card className="border-valorant-purple/20">
                <CardHeader>
                  <CardTitle className="text-white">{t.dashboard.agents || "Agents"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {profile.playerAgents.map((agent: any) => (
                      <div
                        key={agent.id}
                        className="p-3 rounded-lg bg-valorant-dark/50 border border-white/10 hover:border-valorant-purple/50 transition-colors"
                      >
                        <p className="text-white font-medium">{agent.agentName}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {agent.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio Card */}
            {profile?.bio && (
              <Card className="border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">{t.dashboard.bio || "Bio"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Recent Ratings */}
            {user.recentRatings && user.recentRatings.length > 0 && (
              <Card className="border-valorant-red/20">
                <CardHeader>
                  <CardTitle className="text-white">{t.common.recentRatings || "Recent Ratings"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.recentRatings.map((rating: any) => (
                      <div
                        key={rating.id}
                        className="p-4 rounded-lg bg-valorant-dark/30 border border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          {rating.score === 1 ? (
                            <ThumbsUp className="h-5 w-5 text-green-500 mt-1" />
                          ) : (
                            <ThumbsDown className="h-5 w-5 text-red-500 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-2">
                              {rating.rater ? `${rating.rater.nickname}${rating.rater.tagline}` : (t.common.userNotFound || "Unknown User")}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {rating.tags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {rating.comment && (
                              <p className="text-sm text-white mt-2 p-3 bg-black/20 rounded">{rating.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
