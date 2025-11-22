"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RotateCw, Sparkles, Clock, Trophy, Coins } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { useBalance } from "@/lib/balance-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"
import { useToast } from "@/hooks/use-toast"

interface Prize {
  nPoints: number
  probability: number
  color: string
}

interface SpinHistory {
  id: string
  nPointsWon: number
  createdAt: Date
}

export default function WheelPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const { toast } = useToast()
  const { setBalance } = useBalance()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [canSpin, setCanSpin] = useState(false)
  const [nPointsBalance, setNPointsBalance] = useState(0)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [spinHistory, setSpinHistory] = useState<SpinHistory[]>([])
  const [nextSpinAt, setNextSpinAt] = useState<Date | null>(null)
  const [rotation, setRotation] = useState(0)
  const [wonPrize, setWonPrize] = useState<number | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  useEffect(() => {
    // Update countdown every second
    if (nextSpinAt && !canSpin) {
      const interval = setInterval(() => {
        const now = Date.now()
        const next = new Date(nextSpinAt).getTime()

        if (now >= next) {
          setCanSpin(true)
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [nextSpinAt, canSpin])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [profileRes, wheelRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/wheel")
      ])

      const profileData = await profileRes.json()
      const wheelData = await wheelRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      if (wheelData) {
        setNPointsBalance(wheelData.nPointsBalance)
        setCanSpin(wheelData.canSpin)
        setNextSpinAt(wheelData.nextSpinAt ? new Date(wheelData.nextSpinAt) : null)
        setPrizes(wheelData.prizes || [])
        setSpinHistory(wheelData.spinHistory || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpin = async () => {
    if (!canSpin || isSpinning) return

    setIsSpinning(true)
    setWonPrize(null)

    try {
      const response = await fetch("/api/wheel", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to spin")
      }

      // Calculate target rotation based on prize (using same power scaling as rendering)
      const prizeIndex = prizes.findIndex(p => p.nPoints === data.prize.nPoints)

      // Use same scaling as rendering
      const SCALE_POWER = 0.6
      const MIN_VISUAL_SIZE = 8

      const scaledProbs = prizes.map(p => Math.pow(p.probability, SCALE_POWER))
      const totalScaled = scaledProbs.reduce((sum, val) => sum + val, 0)

      // Calculate cumulative angles
      let cumulativeAngle = 0
      for (let i = 0; i < prizeIndex; i++) {
        const prevVisualProb = scaledProbs[i] / totalScaled
        cumulativeAngle += Math.max(MIN_VISUAL_SIZE, prevVisualProb * 360)
      }

      // Calculate this prize's segment angle
      const visualProbability = scaledProbs[prizeIndex] / totalScaled
      const segmentAngle = Math.max(MIN_VISUAL_SIZE, visualProbability * 360)

      const targetAngle = cumulativeAngle + segmentAngle / 2

      // Add multiple full rotations for effect (5-7 spins)
      // Note: Wheel renders with -90 degree offset (starts from top), so add 90 to compensate
      const fullRotations = 5 + Math.random() * 2
      const finalRotation = fullRotations * 360 + (450 - targetAngle)

      // Animate wheel
      setRotation(finalRotation)

      // Wait for animation to complete
      setTimeout(() => {
        setWonPrize(data.prize.nPoints)
        setNPointsBalance(data.newBalance)
        setBalance(data.newBalance) // Update global balance
        setIsSpinning(false)
        setCanSpin(false)

        toast({
          title: "🎉 Congratulations!",
          description: `You won ${data.prize.nPoints} N-Points!`,
        })

        // Refresh data
        fetchData()
      }, 5000) // 5 second spin animation
    } catch (error: any) {
      toast({
        title: "Spin Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
      setIsSpinning(false)
    }
  }

  const getTimeRemaining = () => {
    if (!nextSpinAt) return ""

    const now = Date.now()
    const next = new Date(nextSpinAt).getTime()
    const diff = Math.max(0, next - now)

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
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
      <Navbar profile={profile} currentPage="wheel" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <Sparkles className="h-10 w-10 text-yellow-500 animate-pulse" />
                    {language === 'tr' ? 'Şans Çarkı' : 'Lucky Wheel'}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === 'tr'
                      ? 'Çarkı çevir ve N-Points kazan!'
                      : 'Spin the wheel and win N-Points!'}
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

            {/* Wheel Section */}
            <Card className="border-primary/20 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-8">
                  {/* Wheel */}
                  <div className="relative">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
                      <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg" />
                    </div>

                    {/* Wheel Container */}
                    <div className="relative w-[400px] h-[400px]">
                      <svg
                        ref={wheelRef}
                        width="400"
                        height="400"
                        viewBox="0 0 400 400"
                        className="drop-shadow-2xl"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                        }}
                      >
                        {(() => {
                          // Use power scaling to make small probabilities more visible while keeping differences
                          // Power of 0.6 makes small values bigger but maintains relative differences
                          const SCALE_POWER = 0.6
                          const MIN_VISUAL_SIZE = 8 // Minimum visual size in degrees

                          // Calculate scaled probabilities for visual representation
                          const scaledProbs = prizes.map(p => Math.pow(p.probability, SCALE_POWER))
                          const totalScaled = scaledProbs.reduce((sum, val) => sum + val, 0)

                          return prizes.map((prize, index) => {
                            // Calculate segment angle based on scaled probability
                            const visualProbability = scaledProbs[index] / totalScaled
                            let segmentAngle = Math.max(MIN_VISUAL_SIZE, visualProbability * 360)

                            // Calculate start angle based on previous segments
                            let cumulativeAngle = -90 // Start from top
                            for (let i = 0; i < index; i++) {
                              const prevVisualProb = scaledProbs[i] / totalScaled
                              cumulativeAngle += Math.max(MIN_VISUAL_SIZE, prevVisualProb * 360)
                            }

                            const startAngle = cumulativeAngle
                            const endAngle = startAngle + segmentAngle

                            // Calculate path for pie slice
                            const startRad = (startAngle * Math.PI) / 180
                            const endRad = (endAngle * Math.PI) / 180
                            const radius = 200
                            const cx = 200
                            const cy = 200

                            const x1 = cx + radius * Math.cos(startRad)
                            const y1 = cy + radius * Math.sin(startRad)
                            const x2 = cx + radius * Math.cos(endRad)
                            const y2 = cy + radius * Math.sin(endRad)

                            const largeArcFlag = segmentAngle > 180 ? 1 : 0

                            const pathData = [
                              `M ${cx} ${cy}`,
                              `L ${x1} ${y1}`,
                              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                              'Z'
                            ].join(' ')

                            // Calculate text position (middle of segment)
                            const textAngle = startAngle + segmentAngle / 2
                            const textRad = (textAngle * Math.PI) / 180
                            const textRadius = 130
                            const textX = cx + textRadius * Math.cos(textRad)
                            const textY = cy + textRadius * Math.sin(textRad)

                            // Dynamic font size based on segment size
                            const fontSize = Math.max(14, Math.min(24, segmentAngle / 5))

                            return (
                              <g key={index}>
                                <path
                                  d={pathData}
                                  fill={prize.color}
                                  stroke="white"
                                  strokeWidth="2"
                                />
                                <text
                                  x={textX}
                                  y={textY}
                                  fill="white"
                                  fontSize={fontSize}
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                                  }}
                                >
                                  {prize.nPoints}
                                </text>
                              </g>
                            )
                          })
                        })()}

                        {/* Center Circle */}
                        <circle
                          cx="200"
                          cy="200"
                          r="40"
                          fill="white"
                          stroke="#eab308"
                          strokeWidth="4"
                        />
                      </svg>

                      {/* Center Icon (overlay on top of SVG) */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <Sparkles className="h-10 w-10 text-yellow-500" />
                      </div>
                    </div>
                  </div>

                  {/* Spin Button */}
                  <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    {wonPrize && (
                      <div className="text-center animate-bounce">
                        <p className="text-2xl font-bold text-yellow-500">
                          🎉 You Won {wonPrize} N-Points! 🎉
                        </p>
                      </div>
                    )}

                    <Button
                      variant="valorant"
                      size="lg"
                      className="w-full text-xl py-6"
                      onClick={handleSpin}
                      disabled={!canSpin || isSpinning}
                    >
                      {isSpinning ? (
                        <>
                          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                          {language === 'tr' ? 'Dönüyor...' : 'Spinning...'}
                        </>
                      ) : canSpin ? (
                        <>
                          <RotateCw className="mr-2 h-6 w-6" />
                          {language === 'tr' ? 'Çarkı Çevir!' : 'Spin the Wheel!'}
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-6 w-6" />
                          {language === 'tr' ? `Bekleme Süresi: ${getTimeRemaining()}` : `Cooldown: ${getTimeRemaining()}`}
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      {language === 'tr'
                        ? '🎁 Ücretsiz! Her 8 saatte bir çevirebilirsiniz'
                        : '🎁 Free! Spin every 8 hours'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prize List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {language === 'tr' ? 'Ödüller' : 'Prizes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {prizes.map((prize, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg text-center border-2"
                      style={{
                        borderColor: prize.color,
                        backgroundColor: `${prize.color}20`,
                      }}
                    >
                      <p className="text-2xl font-bold" style={{ color: prize.color }}>
                        {prize.nPoints}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {prize.probability}% {language === 'tr' ? 'Şans' : 'Chance'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Spin History */}
            {spinHistory.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === 'tr' ? 'Son Çevirmeler' : 'Recent Spins'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {spinHistory.map((spin) => (
                      <div
                        key={spin.id}
                        className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="font-semibold text-yellow-500">
                              +{spin.nPointsWon} N-Points
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(spin.createdAt).toLocaleString()}
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
