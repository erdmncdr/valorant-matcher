"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Gift, Sparkles, Trophy, Coins, TrendingUp, TrendingDown } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"
import { useToast } from "@/hooks/use-toast"
import { useBalance } from "@/lib/balance-context"
import confetti from "canvas-confetti"

interface Reward {
  nPoints: number
  probability: number
  color: string
  rarity?: string
}

interface LootboxHistory {
  id: string
  costPaid: number
  nPointsWon: number
  createdAt: Date
}

interface PremiumLootboxData {
  cost: number
  rewards: Reward[]
  nPointsBalance: number
  canOpen: boolean
  lootboxHistory: LootboxHistory[]
  stats: {
    totalOpened: number
    totalSpent: number
    totalWon: number
    netProfit: number
  }
}

export default function PremiumLootboxPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const { toast } = useToast()
  const { setBalance } = useBalance()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpening, setIsOpening] = useState(false)
  const [data, setData] = useState<PremiumLootboxData | null>(null)
  const [wonReward, setWonReward] = useState<number | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationItems, setAnimationItems] = useState<Reward[]>([])
  const stripRef = useRef<HTMLDivElement>(null)

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
        fetch("/api/premium-lootbox")
      ])

      const profileData = await profileRes.json()
      const lootboxData = await lootboxRes.json()

      console.log("Premium Lootbox Data:", lootboxData)

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      if (lootboxData) {
        console.log("Setting lootbox data:", {
          cost: lootboxData.cost,
          canOpen: lootboxData.canOpen,
          balance: lootboxData.nPointsBalance,
          rewardsCount: lootboxData.rewards?.length
        })
        setData(lootboxData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = async () => {
    if (!data?.canOpen || isOpening) return

    setIsOpening(true)
    setWonReward(null)
    setShowAnimation(true)

    try {
      const response = await fetch("/api/premium-lootbox", {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to open lootbox")
      }

      // Generate strip of items for animation
      const winningIndex = 25 // Center position in strip
      const totalItems = 50
      const items: Reward[] = []

      // Fill strip with random items, with winning item at center
      for (let i = 0; i < totalItems; i++) {
        if (i === winningIndex) {
          // Place winning item at center
          items.push({
            nPoints: result.reward.nPoints,
            color: result.reward.color,
            probability: 0,
          })
        } else {
          // Random items for the rest
          const randomReward = data?.rewards?.[Math.floor(Math.random() * (data?.rewards?.length || 1))] || { nPoints: 50, color: '#94a3b8', probability: 0 }
          items.push(randomReward)
        }
      }

      // Save items to state so they can be rendered
      setAnimationItems(items)

      // Calculate scroll distance to center the winning item
      const actualItemWidth = 110 // CSS w-[110px]
      const gapWidth = 8 // CSS gap-2 = 0.5rem = 8px
      const itemSpacing = actualItemWidth + gapWidth // Total space per item = 118px
      const stripPadding = 16 // CSS px-4 = 1rem = 16px
      const containerWidth = 600 // max-w-[600px]
      const containerCenter = containerWidth / 2 // Center at 300px

      // Calculate position of winning item's center in the strip
      const winningItemLeftEdge = stripPadding + (winningIndex * itemSpacing)
      const winningItemCenter = winningItemLeftEdge + (actualItemWidth / 2)

      // How much to shift the strip to center the winning item
      const shiftAmount = winningItemCenter - containerCenter

      // Animate to winning item
      setTimeout(() => {
        if (stripRef.current) {
          stripRef.current.style.transition = 'none'
          stripRef.current.style.transform = 'translateX(0px)'

          // Force reflow
          void stripRef.current.offsetHeight

          // Start animation after a brief delay
          setTimeout(() => {
            if (stripRef.current) {
              stripRef.current.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              stripRef.current.style.transform = `translateX(-${shiftAmount}px)`
            }
          }, 100)
        }
      }, 100)

      // Wait for animation to complete
      setTimeout(() => {
        setWonReward(result.reward.nPoints)
        setBalance(result.newBalance)
        setIsOpening(false)
        setShowAnimation(false)
        setAnimationItems([]) // Clear animation items

        // Check if Mythic (10000 N-Points) was won - special celebration!
        const isMythic = result.reward.nPoints >= 10000

        if (isMythic) {
          // LEGENDARY MYTHIC WIN - Epic confetti celebration!
          const duration = 5000
          const animationEnd = Date.now() + duration
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

          function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min
          }

          const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
              return clearInterval(interval)
            }

            const particleCount = 100 * (timeLeft / duration)

            // Fire confetti from multiple angles with gold colors
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
              colors: ['#fbbf24', '#f59e0b', '#eab308', '#FFD700', '#FFA500'],
            })
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
              colors: ['#fbbf24', '#f59e0b', '#eab308', '#FFD700', '#FFA500'],
            })
          }, 250)

          toast({
            title: "🌟 EFSANEVI ÖDÜL! 🌟",
            description: `MUHTEŞEM! ${result.reward.nPoints.toLocaleString()} N-Points kazandınız! (Net: ${result.netGain > 0 ? '+' : ''}${result.netGain.toLocaleString()})`,
          })
        } else {
          toast({
            title: "🎁 Congratulations!",
            description: `You won ${result.reward.nPoints.toLocaleString()} N-Points! (Net: ${result.netGain > 0 ? '+' : ''}${result.netGain})`,
          })
        }

        // Refresh data
        fetchData()
      }, 4500) // 4.5 second animation + delay
    } catch (error: any) {
      toast({
        title: "Failed to Open",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
      setIsOpening(false)
      setShowAnimation(false)
      setAnimationItems([]) // Clear animation items on error
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="premium-lootbox" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <Gift className="h-10 w-10 text-yellow-500 animate-pulse" />
                    {language === 'tr' ? 'Premium Kutu' : 'Premium Lootbox'}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === 'tr'
                      ? `${data?.cost || 100} N-Points harcayarak premium kutu aç ve büyük ödüller kazan!`
                      : `Spend ${data?.cost || 100} N-Points to open premium lootbox and win big rewards!`}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-yellow-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    {language === 'tr' ? 'Bakiye' : 'Balance'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-500">
                    {(data?.nPointsBalance || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-blue-500" />
                    {language === 'tr' ? 'Açılan' : 'Opened'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-500">
                    {data?.stats?.totalOpened || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    {language === 'tr' ? 'Harcanan' : 'Spent'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {(data?.stats?.totalSpent || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className={(data?.stats?.netProfit || 0) >= 0 ? "border-green-500/30" : "border-red-500/30"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${(data?.stats?.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    {language === 'tr' ? 'Net Kar' : 'Net Profit'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${(data?.stats?.netProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(data?.stats?.netProfit || 0) > 0 ? '+' : ''}{(data?.stats?.netProfit || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CS:GO Style Animation Container */}
            <Card className="border-primary/20 overflow-hidden mb-6">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-6">
                  {/* Lootbox Strip Container */}
                  <div className="relative w-full max-w-[600px] h-[140px] bg-background/50 rounded-lg overflow-hidden border-2 border-primary/30">
                    {/* Arrow Indicator */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                      <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-yellow-500 drop-shadow-lg" />
                    </div>

                    {/* Center Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-[2px] h-full w-1 bg-yellow-500/50 z-10" />

                    {/* Scrolling Strip */}
                    {showAnimation && animationItems.length > 0 && (
                      <div
                        ref={stripRef}
                        className="absolute top-0 left-0 h-full flex items-center gap-2 px-4"
                        style={{ willChange: 'transform' }}
                      >
                        {animationItems.map((reward, index) => {
                          const isMythic = reward.nPoints >= 10000
                          return (
                            <div
                              key={index}
                              className={`flex-shrink-0 w-[110px] h-[110px] rounded-lg border-2 flex flex-col items-center justify-center ${
                                isMythic ? 'animate-pulse shadow-lg shadow-yellow-500/50' : ''
                              }`}
                              style={{
                                borderColor: reward.color,
                                backgroundColor: `${reward.color}20`,
                                ...(isMythic && {
                                  boxShadow: `0 0 20px ${reward.color}, 0 0 40px ${reward.color}`,
                                  borderWidth: '3px',
                                }),
                              }}
                            >
                              <Coins className={`h-8 w-8 mb-2 ${isMythic ? 'animate-bounce' : ''}`} style={{ color: reward.color }} />
                              <p className={`text-xl font-bold ${isMythic ? 'text-2xl' : ''}`} style={{ color: reward.color }}>
                                {reward.nPoints >= 1000 ? `${(reward.nPoints / 1000).toFixed(0)}K` : reward.nPoints}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Static View */}
                    {!showAnimation && (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          {wonReward ? (
                            <div className="animate-bounce">
                              <p className="text-3xl font-bold text-yellow-500 mb-2">
                                🎉 {wonReward} N-Points! 🎉
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">
                                {language === 'tr' ? 'Kutuyu açmak için butona tıkla' : 'Click button to open lootbox'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Open Button */}
                  <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    <Button
                      variant="valorant"
                      size="lg"
                      className="w-full text-xl py-6"
                      onClick={handleOpen}
                      disabled={!data?.canOpen || isOpening}
                    >
                      {isOpening ? (
                        <>
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          {language === 'tr' ? 'Açılıyor...' : 'Opening...'}
                        </>
                      ) : data?.canOpen ? (
                        <>
                          <Gift className="mr-2 h-6 w-6" />
                          {language === 'tr' ? `Kutu Aç (${data?.cost || 0} N-Points)` : `Open Lootbox (${data?.cost || 0} N-Points)`}
                        </>
                      ) : (
                        <>
                          <Coins className="mr-2 h-6 w-6" />
                          {language === 'tr' ? 'Yetersiz N-Points' : 'Insufficient N-Points'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reward Probabilities */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  {language === 'tr' ? 'Ödül Şansları' : 'Reward Probabilities'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data?.rewards?.map((reward, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg text-center border-2"
                      style={{
                        borderColor: reward.color,
                        backgroundColor: `${reward.color}20`,
                      }}
                    >
                      <p className="text-2xl font-bold mb-1" style={{ color: reward.color }}>
                        {reward.nPoints}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reward.probability}% {language === 'tr' ? 'Şans' : 'Chance'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opening History */}
            {(data?.lootboxHistory?.length || 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {language === 'tr' ? 'Son Açılışlar' : 'Recent Openings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data?.lootboxHistory?.map((item) => {
                      const netGain = item.nPointsWon - item.costPaid
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <Gift className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="font-semibold text-yellow-500">
                                {item.nPointsWon} N-Points
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${netGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {netGain > 0 ? '+' : ''}{netGain}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              -{item.costPaid}
                            </p>
                          </div>
                        </div>
                      )
                    })}
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
