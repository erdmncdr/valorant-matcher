"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { Loader2, Target, Trophy, Zap, Award, Clock, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePresence } from "@/hooks/use-presence"
import { useLanguage } from "@/lib/i18n/language-context"
import { useBalance } from "@/lib/balance-context"
import confetti from "canvas-confetti"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Target {
  id: number
  x: number
  y: number
  size: number
  points: number
  timeoutId: NodeJS.Timeout
}

export default function AimTrainerPage() {
  usePresence()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const { refreshBalance } = useBalance()

  const [profile, setProfile] = useState<any>(null)
  const [gameState, setGameState] = useState<"menu" | "playing" | "finished">("menu")
  const [score, setScore] = useState(0)
  const [targetsHit, setTargetsHit] = useState(0)
  const [targetsMissed, setTargetsMissed] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [targets, setTargets] = useState<Target[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [userBest, setUserBest] = useState<any>(null)
  const [canClaimReward, setCanClaimReward] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [spawnInterval, setSpawnInterval] = useState(800)
  const [lastRewardTime, setLastRewardTime] = useState<Date | null>(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardAmount, setRewardAmount] = useState(0)
  const [countdown, setCountdown] = useState<string>("")

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const targetIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasSavedRef = useRef(false)
  const finalScoreRef = useRef({ score: 0, hit: 0, missed: 0 })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchStats()
    }
  }, [status, router])

  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
      if (targetIntervalRef.current) clearInterval(targetIntervalRef.current)
    }
  }, [])

  // Update spawn interval during gameplay
  useEffect(() => {
    if (gameState === "playing") {
      if (targetIntervalRef.current) clearInterval(targetIntervalRef.current)
      targetIntervalRef.current = setInterval(() => {
        spawnTarget()
      }, spawnInterval)
    }
  }, [spawnInterval, gameState])

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

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/aim-trainer")
      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
        setUserBest(data.userBest)
        setCanClaimReward(data.canClaimReward)
        if (data.lastRewardTime) {
          setLastRewardTime(new Date(data.lastRewardTime))
        }
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  // Countdown timer for next reward
  useEffect(() => {
    if (!lastRewardTime) {
      setCountdown("")
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const nextReward = new Date(lastRewardTime)
      nextReward.setHours(nextReward.getHours() + 24)

      const diff = nextReward.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown(t.aimTrainer.available)
        setCanClaimReward(true)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown(`${hours}s ${minutes}d ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [lastRewardTime])

  // Auto-save score when game ends
  useEffect(() => {
    if (gameState === "finished" && !hasSavedRef.current) {
      hasSavedRef.current = true
      saveScore()
    }
  }, [gameState])

  const spawnTarget = () => {
    if (!gameAreaRef.current) return

    const area = gameAreaRef.current.getBoundingClientRect()

    // Weighted random target sizes
    const rand = Math.random()
    let size: number
    let points: number

    if (rand < 0.6) {
      // 60% chance - Small targets (35-45px) - Fast disappearing, worth more points
      size = 35 + Math.random() * 10
      points = 8
    } else if (rand < 0.9) {
      // 30% chance - Medium targets (50-65px)
      size = 50 + Math.random() * 15
      points = 4
    } else {
      // 10% chance - Large targets (70-85px)
      size = 70 + Math.random() * 15
      points = 4
    }

    const targetId = Date.now() + Math.random()

    // Remove target after 1.5 seconds if not clicked
    const timeoutId = setTimeout(() => {
      setTargets(prev => {
        const stillExists = prev.find(t => t.id === targetId)
        if (stillExists) {
          setTargetsMissed(prevMissed => {
            const newMissed = prevMissed + 1
            finalScoreRef.current.missed = newMissed
            return newMissed
          })
          return prev.filter(t => t.id !== targetId)
        }
        return prev
      })
    }, 1500)

    const target: Target = {
      id: targetId,
      x: Math.random() * (area.width - size),
      y: Math.random() * (area.height - size),
      size,
      points,
      timeoutId,
    }

    setTargets(prev => [...prev, target])
  }

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setTargetsHit(0)
    setTargetsMissed(0)
    setTimeLeft(30)
    setTargets([])
    setSpawnInterval(800)
    hasSavedRef.current = false
    finalScoreRef.current = { score: 0, hit: 0, missed: 0 }

    // Countdown timer
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }

        // Increase difficulty every 5 seconds
        const newTime = prev - 1
        if (newTime % 5 === 0 && newTime > 0) {
          setSpawnInterval(current => Math.max(400, current - 80)) // Minimum 400ms
        }

        return newTime
      })
    }, 1000)

    // Spawn targets - will be re-created when interval changes
    targetIntervalRef.current = setInterval(() => {
      spawnTarget()
    }, 800)
  }

  const endGame = () => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
    if (targetIntervalRef.current) clearInterval(targetIntervalRef.current)

    // Clear all remaining targets and their timeouts
    setTargets(prev => {
      prev.forEach(target => clearTimeout(target.timeoutId))
      return []
    })

    // Ref is already updated in real-time from hitTarget and missed timeouts
    console.log('End game - final scores in ref:', finalScoreRef.current)

    hasSavedRef.current = false
    setGameState("finished")
  }

  const hitTarget = (targetId: number) => {
    setTargets(prev => {
      const target = prev.find(t => t.id === targetId)
      if (target) {
        // Cancel the timeout so target is not counted as missed
        clearTimeout(target.timeoutId)
        setTargetsHit(prevHits => {
          const newHit = prevHits + 1
          finalScoreRef.current.hit = newHit
          return newHit
        })
        setScore(prevScore => {
          const newScore = prevScore + target.points
          finalScoreRef.current.score = newScore
          return newScore
        })
      }
      return prev.filter(t => t.id !== targetId)
    })
  }

  const saveScore = async () => {
    setIsSaving(true)
    try {
      // Use ref values that were updated in real-time during gameplay
      const currentScore = finalScoreRef.current.score
      const currentHit = finalScoreRef.current.hit
      const currentMissed = finalScoreRef.current.missed
      const total = currentHit + currentMissed
      const accuracy = total > 0 ? (currentHit / total) * 100 : 0

      console.log('Saving score from ref:', { currentScore, accuracy, currentHit, currentMissed, total })
      console.log('State values (might be stale):', { score, targetsHit, targetsMissed })

      const response = await fetch("/api/aim-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: currentScore,
          accuracy,
          timeElapsed: 30,
          targetsHit: currentHit,
          targetsMissed: currentMissed,
        }),
      })

      const data = await response.json()
      console.log('Save response:', data)

      if (!response.ok) {
        console.error('Save failed:', response.status, data)
        toast({
          title: "Hata",
          description: data.error || "Skor kaydedilemedi. Veritabanı tablosu oluşturuldu mu?",
          variant: "destructive",
        })
        return
      }

      // Successful save
      if (data.rewardClaimed && data.reputationAdded > 0) {
        // Trigger confetti celebration!
        const duration = 3000
        const end = Date.now() + duration

        const colors = ['#ff0844', '#ffea00', '#00d9ff', '#7c3aed']

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          })
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          })

          if (Date.now() < end) {
            requestAnimationFrame(frame)
          }
        }
        frame()

        // Show reward modal
        setRewardAmount(data.reputationAdded)
        setShowRewardModal(true)
      } else if (currentScore >= 100 && !data.rewardClaimed) {
        toast({
          title: "Harika Skor!",
          description: "Bugünlük ödülünü aldın. Yarın tekrar dene!",
        })
      } else {
        toast({
          title: "Skor Kaydedildi",
          description: `${currentScore} puan - ${accuracy.toFixed(1)}% isabet`,
        })
      }

      // Refresh balance to reflect earned N-Points
      if (data.nPointsAdded > 0) {
        await refreshBalance()
      }

      fetchStats()
    } catch (error: any) {
      console.error('Save error:', error)
      toast({
        title: "Hata",
        description: error.message || "Skor kaydedilemedi. Lütfen migration'ı çalıştırın.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalShots = targetsHit + targetsMissed
  const accuracy = totalShots > 0 ? ((targetsHit / totalShots) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="aim-trainer" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">{t.aimTrainer.title}</h1>
            <p className="text-muted-foreground">{t.aimTrainer.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Oyun Alanı</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-foreground">{score}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">{timeLeft}s</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {gameState === "menu" && (
                  <div className="h-[500px] flex flex-col items-center justify-center gap-6">
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-foreground mb-2">{t.aimTrainer.getReady}</h3>
                      <p className="text-muted-foreground mb-6">
                        {t.aimTrainer.howToPlayDesc}
                      </p>
                      <div className="space-y-2 mb-6">
                        <p className="text-sm text-muted-foreground">• {t.aimTrainer.dailyRewardDesc}</p>
                        {!canClaimReward && countdown && (
                          <div className="flex flex-col items-center gap-2 mt-4">
                            <Badge variant="outline" className="text-red-500 border-red-500">
                              {t.aimTrainer.rewardAlreadyClaimed} 🎉
                            </Badge>
                            <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                              <Clock className="h-4 w-4 text-red-500 animate-pulse" />
                              <span className="text-sm font-semibold text-foreground">
                                {countdown}
                              </span>
                            </div>
                          </div>
                        )}
                        {canClaimReward && (
                          <Badge variant="outline" className="text-green-500 border-green-500 animate-pulse">
                            {t.aimTrainer.canClaimReward}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button onClick={startGame} size="lg" variant="valorant" className="text-xl px-8 py-6">
                      <Target className="mr-2 h-6 w-6" />
                      {t.aimTrainer.clickToStart}
                    </Button>
                  </div>
                )}

                {gameState === "playing" && (
                  <div className="relative h-[500px]">
                    {/* Game area with white breathing border */}
                    <div
                      ref={gameAreaRef}
                      className="h-full rounded-lg relative cursor-crosshair overflow-hidden aim-trainer-bg border-2 border-white/30"
                      style={{
                        animation: 'border-breathing 2.5s ease-in-out infinite',
                      }}
                    >
                      {targets.map(target => (
                        <div
                          key={target.id}
                          onClick={() => hitTarget(target.id)}
                          className="absolute bg-primary rounded-full cursor-pointer hover:scale-110 transition-transform animate-pulse"
                          style={{
                            left: target.x,
                            top: target.y,
                            width: target.size,
                            height: target.size,
                            boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {gameState === "finished" && (
                  <div className="h-[500px] flex flex-col items-center justify-center gap-6">
                    <Award className="h-24 w-24 text-primary animate-bounce" />
                    <div className="text-center">
                      <h3 className="text-4xl font-bold text-foreground mb-4">{t.aimTrainer.gameOver}</h3>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">{t.aimTrainer.score}</p>
                          <p className="text-3xl font-bold text-primary">{score}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">{t.aimTrainer.accuracy}</p>
                          <p className="text-3xl font-bold text-accent">{accuracy}%</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">{t.aimTrainer.targetsHit}</p>
                          <p className="text-2xl font-bold text-green-500">{targetsHit}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">{t.aimTrainer.targetsMissed}</p>
                          <p className="text-2xl font-bold text-red-500">{targetsMissed}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setGameState("menu")}
                      size="lg"
                      variant="valorant"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        t.aimTrainer.playAgain
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Daily Reward Timer */}
            {!canClaimReward && countdown && (
              <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <Clock className="h-5 w-5" />
                    {t.aimTrainer.nextReward}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{t.aimTrainer.rewardAlreadyClaimed} 🎉</p>
                    <div className="flex items-center justify-center gap-2 bg-background/50 px-4 py-3 rounded-lg border border-red-500/20">
                      <Clock className="h-5 w-5 text-red-500 animate-pulse" />
                      <span className="text-xl font-bold text-foreground">{countdown}</span>
                    </div>
                    <p className="text-xs text-muted-foreground"></p>
                  </div>
                </CardContent>
              </Card>
            )}

            {canClaimReward && (
              <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent animate-pulse">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-500">
                    <Gift className="h-5 w-5" />
                    {t.aimTrainer.dailyReward}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-sm text-muted-foreground">
                    {t.aimTrainer.dailyRewardDesc} 🎯
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Personal Best */}
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {t.aimTrainer.personalBest}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBest ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.aimTrainer.score}</p>
                      <p className="text-3xl font-bold text-primary">{userBest.score}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{t.aimTrainer.accuracy}</p>
                        <p className="text-lg font-bold text-accent">{(userBest.accuracy || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.aimTrainer.targetsHit}</p>
                        <p className="text-lg font-bold text-green-500">{userBest.targetsHit}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">{t.aimTrainer.noScoresYet}</p>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-secondary" />
                  {t.aimTrainer.todaysLeaderboard}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {entry.user.playerProfile?.nickname || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(entry.accuracy || 0).toFixed(1)}% {t.aimTrainer.accuracy.toLowerCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{entry.score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">{t.aimTrainer.noScoresYet}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reward Celebration Modal */}
      <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
        <DialogContent className="sm:max-w-md border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-primary">
              🎉 KAZANDIN! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="text-center pt-4 space-y-4">
            <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Günlük Ödül</p>
              <div className="flex items-center justify-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <span className="text-5xl font-bold text-primary">+{rewardAmount}</span>
                <Gift className="h-8 w-8 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">İtibar Puanı!</p>
            </div>
            <p className="text-muted-foreground">
              Harika performans! Günlük ödülünü kazandın.
            </p>
            <p className="text-sm text-muted-foreground">
              Bir sonraki ödül için 24 saat bekle!
            </p>
          </div>
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setShowRewardModal(false)}
              variant="valorant"
              size="lg"
              className="w-full"
            >
              Harika! 🎯
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
