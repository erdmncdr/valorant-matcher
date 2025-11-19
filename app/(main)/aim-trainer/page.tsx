"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { Loader2, Target, Trophy, Zap, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePresence } from "@/hooks/use-presence"

interface Target {
  id: number
  x: number
  y: number
  size: number
  timeoutId: NodeJS.Timeout
}

export default function AimTrainerPage() {
  usePresence()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
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
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const targetIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const spawnTarget = () => {
    if (!gameAreaRef.current) return

    const area = gameAreaRef.current.getBoundingClientRect()
    const size = 60 + Math.random() * 40 // 60-100px

    const targetId = Date.now() + Math.random()

    // Remove target after 1.5 seconds if not clicked
    const timeoutId = setTimeout(() => {
      setTargets(prev => {
        const stillExists = prev.find(t => t.id === targetId)
        if (stillExists) {
          setTargetsMissed(prev => prev + 1)
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

    setGameState("finished")

    // Save score after state updates
    setTimeout(() => {
      saveScore()
    }, 100)
  }

  const hitTarget = (targetId: number) => {
    setTargets(prev => {
      const target = prev.find(t => t.id === targetId)
      if (target) {
        // Cancel the timeout so target is not counted as missed
        clearTimeout(target.timeoutId)
        setTargetsHit(prevHits => prevHits + 1)
        setScore(prevScore => prevScore + 10)
      }
      return prev.filter(t => t.id !== targetId)
    })
  }

  const saveScore = async () => {
    setIsSaving(true)
    try {
      const total = targetsHit + targetsMissed
      const accuracy = total > 0 ? (targetsHit / total) * 100 : 0
      
      const response = await fetch("/api/aim-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          accuracy,
          timeElapsed: 30,
          targetsHit,
          targetsMissed,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.rewardClaimed && data.reputationAdded > 0) {
          toast({
            title: "Tebrikler! 🎉",
            description: `${score} puan kazandın! +${data.reputationAdded} itibar puanı eklendi!`,
          })
        } else if (score >= 100 && !data.rewardClaimed) {
          toast({
            title: "Harika Skor!",
            description: "Bugünlük ödülünü aldın. Yarın tekrar dene!",
          })
        }
        
        fetchStats()
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Skor kaydedilemedi",
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
            <h1 className="text-4xl font-bold text-foreground">Aim Trainer</h1>
            <p className="text-muted-foreground">Aim'ini geliştir, ödül kazan!</p>
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
                      <h3 className="text-3xl font-bold text-foreground mb-2">Hazır mısın?</h3>
                      <p className="text-muted-foreground mb-6">
                        30 saniyede mümkün olduğunca çok hedef vur!
                      </p>
                      <div className="space-y-2 mb-6">
                        <p className="text-sm text-muted-foreground">• Her hedef: +10 puan</p>
                        <p className="text-sm text-muted-foreground">• 100+ puan: +1 itibar (günlük)</p>
                        {!canClaimReward && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                            Bugünlük ödülünü aldın
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button onClick={startGame} size="lg" variant="valorant" className="text-xl px-8 py-6">
                      <Target className="mr-2 h-6 w-6" />
                      Oyuna Başla
                    </Button>
                  </div>
                )}

                {gameState === "playing" && (
                  <div
                    ref={gameAreaRef}
                    className="h-[500px] bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg relative cursor-crosshair overflow-hidden border-2 border-primary/20"
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
                )}

                {gameState === "finished" && (
                  <div className="h-[500px] flex flex-col items-center justify-center gap-6">
                    <Award className="h-24 w-24 text-primary animate-bounce" />
                    <div className="text-center">
                      <h3 className="text-4xl font-bold text-foreground mb-4">Oyun Bitti!</h3>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Skor</p>
                          <p className="text-3xl font-bold text-primary">{score}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">İsabet</p>
                          <p className="text-3xl font-bold text-accent">{accuracy}%</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Vuruş</p>
                          <p className="text-2xl font-bold text-green-500">{targetsHit}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Kaçan</p>
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
                          Kaydediliyor...
                        </>
                      ) : (
                        "Tekrar Oyna"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Best */}
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  En İyi Skorun
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBest ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Skor</p>
                      <p className="text-3xl font-bold text-primary">{userBest.score}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">İsabet</p>
                        <p className="text-lg font-bold text-accent">{userBest.accuracy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vuruş</p>
                        <p className="text-lg font-bold text-green-500">{userBest.targetsHit}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Henüz skor yok</p>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-secondary" />
                  Günlük Liderler
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
                            {entry.accuracy.toFixed(1)}% isabet
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{entry.score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Henüz skor yok</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
