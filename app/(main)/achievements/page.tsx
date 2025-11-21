"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Lock, Trophy, Star, Sparkles, Zap } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

type AchievementRarity = "common" | "rare" | "epic" | "legendary"

interface Achievement {
  id: string
  key: string
  category: string
  nameEn: string
  nameTr: string
  descriptionEn: string
  descriptionTr: string
  icon: string
  reputationBonus: number
  requiredCount: number
  progress?: number
  isUnlocked?: boolean
  unlockedAt?: Date
}

// Determine rarity based on reputation bonus
function getAchievementRarity(reputationBonus: number): AchievementRarity {
  if (reputationBonus >= 20) return "legendary"
  if (reputationBonus >= 10) return "epic"
  if (reputationBonus >= 3) return "rare"
  return "common"
}

// Get rarity styles
function getRarityStyles(rarity: AchievementRarity, isUnlocked: boolean) {
  const baseOpacity = isUnlocked ? "100" : "40"

  const styles = {
    common: {
      badge: `bg-slate-500/${baseOpacity} text-slate-100 border-slate-400`,
      card: "border-slate-400/30 hover:border-slate-400/50",
      gradient: "from-slate-500/20 to-slate-600/20",
      glow: "shadow-slate-500/20",
      icon: <Star className="h-4 w-4" />
    },
    rare: {
      badge: `bg-blue-500/${baseOpacity} text-blue-100 border-blue-400`,
      card: "border-blue-400/30 hover:border-blue-400/50",
      gradient: "from-blue-500/20 to-blue-600/20",
      glow: "shadow-blue-500/30",
      icon: <Sparkles className="h-4 w-4" />
    },
    epic: {
      badge: `bg-purple-500/${baseOpacity} text-purple-100 border-purple-400`,
      card: "border-purple-400/30 hover:border-purple-400/50",
      gradient: "from-purple-500/20 to-purple-600/20",
      glow: "shadow-purple-500/40",
      icon: <Zap className="h-4 w-4" />
    },
    legendary: {
      badge: `bg-gradient-to-r from-yellow-500 to-orange-500 opacity-${baseOpacity} text-white border-yellow-400`,
      card: "border-yellow-400/40 hover:border-yellow-400/60",
      gradient: "from-yellow-500/20 via-orange-500/20 to-red-500/20",
      glow: "shadow-yellow-500/50",
      icon: <Trophy className="h-4 w-4" />
    }
  }

  return styles[rarity]
}

export default function AchievementsPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      const [profileRes, achievementsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/achievements")
      ])

      const profileData = await profileRes.json()
      const achievementsData = await achievementsRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      // API returns achievements with progress already merged
      if (achievementsData.achievements) {
        setAchievements(achievementsData.achievements)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
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

  // Group achievements by category and sort by rarity within each category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    const category = achievement.category.toLowerCase()
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  // Sort achievements within each category by rarity (reputation bonus descending)
  Object.keys(achievementsByCategory).forEach(category => {
    achievementsByCategory[category].sort((a, b) => b.reputationBonus - a.reputationBonus)
  })

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length
  const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const categoryOrder = ['general', 'matchmaking', 'social', 'skill', 'reputation']

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="achievements" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Trophy className="h-10 w-10 text-yellow-500" />
                {t.achievements?.title}
              </h1>
              <p className="text-muted-foreground">{t.achievements?.subtitle}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{unlockedCount}/{totalCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.achievements?.stats.completed}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-secondary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-secondary">{completionRate}%</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.achievements?.stats.completionRate}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-accent/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-accent">
                      {achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.reputationBonus, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{t.achievements?.reputationBonus}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements by Category */}
            <div className="space-y-8">
              {categoryOrder.map(category => {
                const categoryAchievements = achievementsByCategory[category] || []
                if (categoryAchievements.length === 0) return null

                return (
                  <div key={category} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 border-b border-border pb-2">
                      <h2 className="text-2xl font-bold text-foreground">
                        {t.achievements?.categories[category]}
                      </h2>
                      <Badge variant="outline" className="text-xs">
                        {categoryAchievements.filter(a => a.isUnlocked).length}/{categoryAchievements.length}
                      </Badge>
                    </div>

                    {/* Achievements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {categoryAchievements.map((achievement) => {
                        const rarity = getAchievementRarity(achievement.reputationBonus)
                        const styles = getRarityStyles(rarity, achievement.isUnlocked)
                        const name = language === 'tr' ? achievement.nameTr : achievement.nameEn
                        const description = language === 'tr' ? achievement.descriptionTr : achievement.descriptionEn
                        const progressPercent = (achievement.progress / achievement.requiredCount) * 100

                        return (
                          <Card
                            key={achievement.id}
                            className={`relative overflow-hidden transition-all duration-300 ${styles.card} ${
                              achievement.isUnlocked ? `${styles.glow} shadow-lg` : 'opacity-70'
                            }`}
                          >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-30`} />

                            <CardHeader className="relative pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className={`text-4xl relative ${achievement.isUnlocked ? '' : 'grayscale opacity-50'}`}>
                                    {achievement.icon}
                                    {!achievement.isUnlocked && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock className="h-6 w-6 text-foreground drop-shadow-lg" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      {name}
                                      {achievement.isUnlocked && (
                                        <span className="text-green-500">✓</span>
                                      )}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="relative space-y-3">
                              {/* Rarity Badge */}
                              <div className="flex items-center justify-between">
                                <Badge className={`${styles.badge} flex items-center gap-1`}>
                                  {styles.icon}
                                  {t.achievements?.rarity[rarity]}
                                </Badge>
                                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                                  +{achievement.reputationBonus} {t.achievements?.reputationBonus}
                                </Badge>
                              </div>

                              {/* Progress Bar */}
                              {!achievement.isUnlocked && achievement.requiredCount > 1 && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{t.achievements?.progress}</span>
                                    <span>{achievement.progress}/{achievement.requiredCount}</span>
                                  </div>
                                  <Progress value={progressPercent} className="h-2" />
                                </div>
                              )}

                              {/* Unlocked Date */}
                              {achievement.isUnlocked && achievement.unlockedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {t.achievements?.unlockedOn}: {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
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
