"use client"

import { useState, useEffect } from "react"
import { AchievementCard } from "./achievement-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { Progress } from "@/components/ui/progress"

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
  isHidden: boolean
  progress: number
  isUnlocked: boolean
  unlockedAt: string | null
}

interface AchievementStats {
  total: number
  unlocked: number
  percentage: number
  byCategory: Record<string, number>
}

interface AchievementGridProps {
  userId?: string
}

export function AchievementGrid({ userId }: AchievementGridProps) {
  const { language } = useLanguage()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAchievements()
  }, [userId, filter])

  const fetchAchievements = async () => {
    try {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (filter !== 'all') {
        if (filter === 'unlocked') {
          params.append('unlockedOnly', 'true')
        } else {
          params.append('category', filter)
        }
      }

      const response = await fetch(`/api/achievements?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const categories = ['all', 'unlocked', 'GENERAL', 'MATCHMAKING', 'SOCIAL', 'SKILL', 'REPUTATION']
  const categoryLabels: Record<string, { en: string; tr: string }> = {
    all: { en: 'All', tr: 'Tümü' },
    unlocked: { en: 'Unlocked', tr: 'Açılanlar' },
    GENERAL: { en: 'General', tr: 'Genel' },
    MATCHMAKING: { en: 'Matchmaking', tr: 'Eşleşme' },
    SOCIAL: { en: 'Social', tr: 'Sosyal' },
    SKILL: { en: 'Skill', tr: 'Yetenek' },
    REPUTATION: { en: 'Reputation', tr: 'İtibar' },
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>
                  {language === 'tr' ? 'Başarı İstatistikleri' : 'Achievement Statistics'}
                </CardTitle>
              </div>
              <Badge variant="default" className="text-lg px-3 py-1">
                {stats.unlocked} / {stats.total}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'tr' ? 'Tamamlanma' : 'Completion'}
                </span>
                <span className="font-medium">{stats.percentage}%</span>
              </div>
              <Progress value={stats.percentage} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {categoryLabels[cat][language]}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      {achievements.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {language === 'tr' ? 'Başarı bulunamadı' : 'No achievements found'}
            </p>
            <p className="text-sm text-muted-foreground">
              {filter === 'unlocked'
                ? language === 'tr'
                  ? 'Henüz hiç başarı kilidi açmadınız'
                  : 'You haven\'t unlocked any achievements yet'
                : language === 'tr'
                ? 'Bu kategoride başarı bulunmuyor'
                : 'No achievements in this category'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  )
}
