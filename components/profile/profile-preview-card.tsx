"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, ThumbsUp, ThumbsDown, ExternalLink, Shield, Flag } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"
import { useLanguage } from "@/lib/i18n/language-context"
import { ReportForm } from "@/components/reports/report-form"

interface ProfilePreviewCardProps {
  userId: string
  listingId?: string
  onViewProfile?: () => void
}

export function ProfilePreviewCard({ userId, listingId, onViewProfile }: ProfilePreviewCardProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showReportDialog, setShowReportDialog] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserPreview()
    }
  }, [userId])

  const fetchUserPreview = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch user preview:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-valorant-red" />
      </div>
    )
  }

  if (!user || !user.playerProfile) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">{t.common.userNotFound || "User not found"}</p>
      </div>
    )
  }

  const profile = user.playerProfile

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-valorant-purple/50">
          <AvatarFallback className="bg-valorant-red text-white text-lg font-bold">
            {profile.nickname?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold truncate">
              {profile.nickname}
            </h3>
            {user.isAdmin && (
              <Badge className="bg-gradient-to-r from-valorant-red to-valorant-purple text-white text-xs border-0">
                <Shield className="h-3 w-3 mr-1" />
                ADMIN
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-400">#{profile.tagline}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${getRankBadgeClass(profile.rankCurrent)} rank-badge text-xs`}>
              {profile.rankCurrent}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {profile.mainRole}
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Reputation */}
      <div>
        <p className="text-xs text-gray-400 mb-2">{t.common.reputation || "Reputation"}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">
              {user.reputation?.positive || 0}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-500">
              {user.reputation?.negative || 0}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            ({user.reputation?.total || 0} {t.common.total || "total"})
          </div>
        </div>
      </div>

      {/* Top Tags */}
      {user.reputation?.topTags && user.reputation.topTags.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">{t.common.topTags || "Top Tags"}</p>
          <div className="flex flex-wrap gap-1">
            {user.reputation.topTags.slice(0, 3).map((tagData: any) => (
              <Badge key={tagData.tag} variant="outline" className="text-xs">
                {tagData.tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link href={`/profile/${userId}`} onClick={onViewProfile}>
          <Button variant="outline" className="w-full" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t.common.viewProfile || "View Profile"}
          </Button>
        </Link>

        {/* Report Button - only show if not viewing own profile */}
        {session?.user?.id && session.user.id !== userId && (
          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
            size="sm"
            onClick={() => setShowReportDialog(true)}
          >
            <Flag className="mr-2 h-4 w-4" />
            {t.common.reportUser || "Report User"}
          </Button>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t.reports?.title || t.common.reportUser || "Report User"}: {user?.playerProfile?.nickname}
            </DialogTitle>
          </DialogHeader>
          <ReportForm
            targetUserId={userId}
            listingId={listingId}
            onSuccess={() => setShowReportDialog(false)}
            onCancel={() => setShowReportDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
