"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, ThumbsUp, ThumbsDown, Star, User } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"
import { useLanguage } from "@/lib/i18n/language-context"
import { RatingForm } from "./rating-form"

interface UserProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  listingId?: string // Optional: for rating after playing together
}

export function UserProfileModal({ userId, isOpen, onClose, listingId }: UserProfileModalProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRatingForm, setShowRatingForm] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile()
    }
  }, [isOpen, userId])

  const fetchUserProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRatingSuccess = () => {
    setShowRatingForm(false)
    fetchUserProfile() // Refresh profile data
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
          </div>
        ) : user ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">
                {t.common.userProfile || "Kullanıcı Profili"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-valorant-red text-white text-xl">
                    {user.playerProfile?.nickname?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">
                    {user.playerProfile?.nickname}
                    <span className="text-gray-400">#{user.playerProfile?.tagline}</span>
                  </h3>
                  <div className="flex gap-2 mt-2">
                    <Badge className={`${getRankBadgeClass(user.playerProfile?.rankCurrent)} rank-badge`}>
                      {user.playerProfile?.rankCurrent}
                    </Badge>
                    <Badge variant="secondary">
                      {user.playerProfile?.mainRole}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Reputation Stats */}
              <Card className="border-valorant-cyan/20">
                <CardContent className="pt-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    {t.common.reputation || "İtibar"}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold text-green-500">
                          {user.reputation?.positive || 0}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{t.dashboard.positive || "Pozitif"}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsDown className="h-5 w-5 text-red-500" />
                        <span className="text-2xl font-bold text-red-500">
                          {user.reputation?.negative || 0}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{t.dashboard.negative || "Negatif"}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-white">
                          {user.reputation?.total || 0}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{t.common.total || "Toplam"}</p>
                    </div>
                  </div>

                  {/* Top Tags */}
                  {user.reputation?.topTags && user.reputation.topTags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">{t.common.topTags || "Sık Kullanılan Etiketler"}</p>
                      <div className="flex flex-wrap gap-2">
                        {user.reputation.topTags.map((tagData: any) => (
                          <Badge key={tagData.tag} variant="secondary">
                            {tagData.tag} ({tagData.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Profile Info */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">{t.common.playerInfo || "Oyuncu Bilgileri"}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">{t.dashboard.peakRank}</p>
                    <Badge className={`${getRankBadgeClass(user.playerProfile?.rankPeak)} rank-badge mt-1`}>
                      {user.playerProfile?.rankPeak}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{t.dashboard.region}</p>
                    <p className="text-white">{user.playerProfile?.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{t.dashboard.languages}</p>
                    <p className="text-white">{user.playerProfile?.languages?.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{t.dashboard.agents}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.playerProfile?.playerAgents?.slice(0, 3).map((agent: any) => (
                        <Badge key={agent.id} variant="outline" className="text-xs">
                          {agent.agentName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {user.playerProfile?.bio && (
                  <div>
                    <p className="text-sm text-gray-400">{t.dashboard.bio}</p>
                    <p className="text-white text-sm mt-1">{user.playerProfile.bio}</p>
                  </div>
                )}
              </div>

              {/* Recent Ratings */}
              {user.recentRatings && user.recentRatings.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    {t.common.recentRatings || "Son Değerlendirmeler"}
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {user.recentRatings.map((rating: any) => (
                      <Card key={rating.id} className="border-white/10">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            {rating.score === 1 ? (
                              <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-gray-400">
                                {rating.rater?.nickname}#{rating.rater?.tagline}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rating.tags.map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              {rating.comment && (
                                <p className="text-sm text-white mt-1">{rating.comment}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Rate User Button */}
              {session?.user?.id !== userId && listingId && (
                <div>
                  {!showRatingForm ? (
                    <Button
                      onClick={() => setShowRatingForm(true)}
                      variant="valorant"
                      className="w-full"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {t.common.ratePlayer || "Oyuncuyu Değerlendir"}
                    </Button>
                  ) : (
                    <RatingForm
                      targetUserId={userId}
                      listingId={listingId}
                      onSuccess={handleRatingSuccess}
                      onCancel={() => setShowRatingForm(false)}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">{t.common.userNotFound || "Kullanıcı bulunamadı"}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
