"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Gift, Sparkles, Clock, Trophy, Coins } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"
import { useToast } from "@/hooks/use-toast"

interface Reward {
  nPoints: number
  probability: number
  color: string
}

interface LootboxHistory {
  id: string
  nPointsWon: number
  createdAt: Date
}

export default function LootboxPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpening, setIsOpening] = useState(false)
  const [canOpen, setCanOpen] = useState(false)
  const [nPointsBalance, setNPointsBalance] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [lootboxHistory, setLootboxHistory] = useState<LootboxHistory[]>([])
  const [wonReward, setWonReward] = useState<number | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [profileRes, lootboxRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/lootbox")
      ])

      const profileData = await profileRes.json()
      const lootboxData = await lootboxRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      if (lootboxData) {
        setNPointsBalance(lootboxData.nPointsBalance)
        setCanOpen(lootboxData.canOpen)
        setRewards(lootboxData.rewards || [])
        setLootboxHistory(lootboxData.lootboxHistory || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = async () => {
    if (!canOpen || isOpening) return

    setIsOpening(true)
    setWonReward(null)
    setShowAnimation(true)

    try {
      const response = await fetch("/api/lootbox", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to open lootbox")
      }

      // Wait for animation
      setTimeout(() => {
        setWonReward(data.reward.nPoints)
        setNPointsBalance(data.newBalance)
        setIsOpening(false)
        setCanOpen(false)
        setShowAnimation(false)

        toast({
          title: "🎁 Congratulations!",
          description: `You won ${data.reward.nPoints} N-Points!`,
        })

        // Refresh data
        fetchData()
      }, 3000) // 3 second animation
    } catch (error: any) {
      toast({
        title: "Open Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
      setIsOpening(false)
      setShowAnimation(false)
    }
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
      <Navbar profile={profile} currentPage="lootbox" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <Gift className="h-10 w-10 text-purple-500 animate-pulse" />
                    {language === 'tr' ? 'Günlük Kutu' : 'Daily Lootbox'}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === 'tr'
                      ? 'Her gün bir kutu aç ve N-Points kazan!'
                      : 'Open one lootbox every day and win N-Points!'}
                  </p>
                </div>
                <Card className="border-primary/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                  <CardContent className="pt-6 px-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'tr' ? 'Bakiyeniz' : 'Balance'}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="h-6 w-6 text-yellow-500" />
                        <p className="text-3xl font-bold text-primary">{nPointsBalance.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Lootbox Section */}
            <Card className="border-primary/20 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-8">
                  {/* Lootbox Visual */}
                  <div className="relative">
                    <div className={`transition-all duration-1000 ${
                      showAnimation ? 'animate-bounce scale-110' : 'scale-100'
                    }`}>
                      <div className={`relative w-64 h-64 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1 ${
                        canOpen ? 'shadow-2xl shadow-purple-500/50 animate-pulse' : 'opacity-50'
                      }`}>
                        <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                          <Gift className={`h-32 w-32 ${
                            canOpen ? 'text-purple-500' : 'text-muted-foreground'
                          }`} />
                        </div>
                      </div>
                    </div>

                    {/* Sparkles around box */}
                    {canOpen && (
                      <>
                        <Sparkles className="absolute -top-4 -left-4 h-8 w-8 text-yellow-500 animate-pulse" />
                        <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-purple-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <Sparkles className="absolute -bottom-4 -left-4 h-8 w-8 text-pink-500 animate-pulse" style={{ animationDelay: '1s' }} />
                        <Sparkles className="absolute -bottom-4 -right-4 h-8 w-8 text-orange-500 animate-pulse" style={{ animationDelay: '1.5s' }} />
                      </>
                    )}
                  </div>

                  {/* Result Display */}
                  {wonReward && (
                    <div className="text-center animate-bounce">
                      <p className="text-3xl font-bold text-yellow-500 mb-2">
                        🎉 {wonReward} N-Points! 🎉
                      </p>
                      <p className="text-lg text-muted-foreground">
                        {language === 'tr' ? 'Yarın tekrar gel!' : 'Come back tomorrow!'}
                      </p>
                    </div>
                  )}

                  {/* Open Button */}
                  <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    <Button
                      variant="valorant"
                      size="lg"
                      className="w-full text-xl py-6"
                      onClick={handleOpen}
                      disabled={!canOpen || isOpening}
                    >
                      {isOpening ? (
                        <>
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          {language === 'tr' ? 'Açılıyor...' : 'Opening...'}
                        </>
                      ) : canOpen ? (
                        <>
                          <Gift className="mr-2 h-6 w-6" />
                          {language === 'tr' ? 'Kutuyu Aç!' : 'Open Lootbox!'}
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-6 w-6" />
                          {language === 'tr' ? 'Bugün Açıldı' : 'Opened Today'}
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      {language === 'tr'
                        ? '🎁 Ücretsiz! Her 24 saatte bir açabilirsiniz'
                        : '🎁 Free! Open once every 24 hours'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Possible Rewards */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {language === 'tr' ? 'Olası Ödüller' : 'Possible Rewards'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {rewards.map((reward, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg text-center border-2 transition-all hover:scale-105"
                      style={{
                        borderColor: reward.color,
                        backgroundColor: `${reward.color}20`,
                      }}
                    >
                      <p className="text-2xl font-bold" style={{ color: reward.color }}>
                        {reward.nPoints}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reward.probability}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lootbox History */}
            {lootboxHistory.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === 'tr' ? 'Son Açılanlar' : 'Recent Openings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lootboxHistory.map((lootbox) => (
                      <div
                        key={lootbox.id}
                        className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Gift className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-semibold text-yellow-500">
                              +{lootbox.nPointsWon} N-Points
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(lootbox.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Online Users Sidebar */}
          <div className="lg:col-span-1">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
