"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserCircle, Users, MessageCircle, Star } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

export default function DashboardPage() {
  usePresence() // Maintain online presence
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()

      if (!data.profile) {
        router.push("/profile/complete")
        return
      }

      setProfile(data.profile)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="dashboard" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {t.dashboard.welcome.replace('{nickname}', profile.nickname)}
              </h1>
              <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
            </div>

            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader>
              <CardTitle>{t.dashboard.yourProfile}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dashboard.currentRank}</p>
                    <div className="mt-1">
                      <Badge className={`${getRankBadgeClass(profile.rankCurrent)} rank-badge`}>
                        {profile.rankCurrent}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dashboard.peakRank}</p>
                    <div className="mt-1">
                      <Badge className={`${getRankBadgeClass(profile.rankPeak)} rank-badge`}>
                        {profile.rankPeak}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dashboard.mainRole}</p>
                    <div className="mt-1">
                      <Badge variant="role">
                        {profile.mainRole}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t.dashboard.agents}</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.playerAgents.map((agent: any) => (
                      <Badge key={agent.id} variant="secondary">
                        {agent.agentName}
                        {agent.priority === "main" && " ⭐"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dashboard.region}</p>
                    <p className="text-foreground">{profile.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.dashboard.languages}</p>
                    <p className="text-foreground">{profile.languages.join(", ")}</p>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.dashboard.bio}</p>
                    <p className="text-foreground text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.dashboard.quickActions}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/listings/create?type=team" className="block">
                  <Button variant="outline" className="w-full justify-start border-primary/30 hover:border-primary">
                    <Users className="mr-2 h-4 w-4" />
                    {t.dashboard.createTeamListing}
                  </Button>
                </Link>
                <Link href="/listings/create?type=solo" className="block">
                  <Button variant="outline" className="w-full justify-start border-secondary/30 hover:border-secondary">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {t.dashboard.createSoloListing}
                  </Button>
                </Link>
                <Link href="/listings" className="block">
                  <Button variant="outline" className="w-full justify-start border-accent/30 hover:border-accent">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t.dashboard.browseListing}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Star className="mr-2 h-5 w-5 text-yellow-500" />
                  {t.dashboard.reputation}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.dashboard.reputationDesc}</p>
                <div className="mt-3 flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">0</p>
                    <p className="text-xs text-muted-foreground">{t.dashboard.positive}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">0</p>
                    <p className="text-xs text-muted-foreground">{t.dashboard.negative}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

            {/* Getting Started */}
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle>{t.dashboard.gettingStarted}</CardTitle>
                <CardDescription>{t.dashboard.gettingStartedDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-foreground">
                  <li className="flex items-start">
                    <span className="font-bold text-primary mr-3">1.</span>
                    <span><strong>{t.dashboard.step1}</strong> {t.dashboard.step1Desc}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-secondary mr-3">2.</span>
                    <span><strong>{t.dashboard.step2}</strong> {t.dashboard.step2Desc}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-accent mr-3">3.</span>
                    <span><strong>{t.dashboard.step3}</strong> {t.dashboard.step3Desc}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-yellow-500 mr-3">4.</span>
                    <span><strong>{t.dashboard.step4}</strong> {t.dashboard.step4Desc}</span>
                  </li>
                </ol>
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
