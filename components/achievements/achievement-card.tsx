"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatDistanceToNow } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import { useLanguage } from "@/lib/i18n/language-context"
import { Lock } from "lucide-react"

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

interface AchievementCardProps {
  achievement: Achievement
}

const categoryColors = {
  GENERAL: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
  MATCHMAKING: 'bg-green-500/20 text-green-500 border-green-500/50',
  SOCIAL: 'bg-purple-500/20 text-purple-500 border-purple-500/50',
  SKILL: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
  REPUTATION: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
}

const categoryLabels = {
  GENERAL: { en: 'General', tr: 'Genel' },
  MATCHMAKING: { en: 'Matchmaking', tr: 'Eşleşme' },
  SOCIAL: { en: 'Social', tr: 'Sosyal' },
  SKILL: { en: 'Skill', tr: 'Yetenek' },
  REPUTATION: { en: 'Reputation', tr: 'İtibar' },
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { language } = useLanguage()
  const locale = language === 'tr' ? tr : enUS

  const name = language === 'tr' ? achievement.nameTr : achievement.nameEn
  const description = language === 'tr' ? achievement.descriptionTr : achievement.descriptionEn
  const progressPercentage = Math.min(
    Math.round((achievement.progress / achievement.requiredCount) * 100),
    100
  )
  const categoryColor = categoryColors[achievement.category as keyof typeof categoryColors] || 'bg-gray-500/20 text-gray-500'
  const categoryLabel = categoryLabels[achievement.category as keyof typeof categoryLabels]?.[language] || achievement.category

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-lg ${
        achievement.isUnlocked
          ? 'border-2 border-primary'
          : achievement.isHidden
          ? 'opacity-50'
          : 'opacity-75'
      }`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`text-3xl ${achievement.isHidden && !achievement.isUnlocked ? 'filter blur-sm' : ''}`}>
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-semibold text-base ${achievement.isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {name}
              </h3>
              {achievement.isUnlocked && (
                <Badge variant="default" className="flex-shrink-0">
                  ✓
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs ${categoryColor}`}
              >
                {categoryLabel}
              </Badge>
              {achievement.reputationBonus > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{achievement.reputationBonus} 💎
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        {!achievement.isUnlocked && !achievement.isHidden && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {language === 'tr' ? 'İlerleme' : 'Progress'}
              </span>
              <span className="font-medium">
                {achievement.progress} / {achievement.requiredCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Unlocked Date */}
        {achievement.isUnlocked && achievement.unlockedAt && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {language === 'tr' ? 'Kilidi açıldı: ' : 'Unlocked '}
              {formatDistanceToNow(new Date(achievement.unlockedAt), {
                addSuffix: true,
                locale,
              })}
            </p>
          </div>
        )}

        {/* Locked Overlay */}
        {achievement.isHidden && !achievement.isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
