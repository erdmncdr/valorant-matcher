"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MapPin, Users, Mic, MicOff } from "lucide-react"
import { getRankBadgeClass, getRoleColor } from "@/lib/constants"
import { formatExpiresIn } from "@/lib/utils"
import { ListingWithOwner } from "@/types"
import { UserProfileModal } from "@/components/profile/user-profile-modal"
import { OnlineStatusIndicator } from "@/components/ui/online-status-indicator"

interface ListingCardProps {
  listing: ListingWithOwner
}

export function ListingCard({ listing }: ListingCardProps) {
  const profile = listing.owner.playerProfile
  const [showProfileModal, setShowProfileModal] = useState(false)

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:glow-red overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1 line-clamp-2 break-words">{listing.title}</CardTitle>
              <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="relative">
                  <Avatar className="h-6 w-6 ring-1 ring-border">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {profile?.nickname?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineStatusIndicator lastSeenAt={listing.owner.lastSeenAt} size="sm" />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowProfileModal(true)
                  }}
                  className="hover:text-accent hover:underline transition-colors"
                >
                  {profile?.nickname || "Unknown"}
                </button>
                <span>•</span>
                <Badge className={`${getRankBadgeClass(profile?.rankCurrent || "IRON")} rank-badge text-xs`}>
                  {profile?.rankCurrent}
                </Badge>
              </div>
            </div>
            <Badge
              variant={listing.listingType === "TEAM" ? "default" : "secondary"}
              className="shrink-0"
            >
              {listing.listingType === "TEAM" ? "Team LF1" : "Solo LFT"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="mode" className="text-xs">
              {listing.mode}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {listing.seriousness}
            </Badge>
            {listing.desiredRole && (
              <Badge variant="role" className="text-xs">
                {listing.desiredRole}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {listing.region}
            </div>
            <div className="flex items-center text-muted-foreground">
              {listing.voiceRequired ? (
                <>
                  <Mic className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-500">Mic Required</span>
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 mr-1" />
                  Optional
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {formatExpiresIn(listing.expiresAt)}
            </div>
            {listing._count && listing._count.applications > 0 && (
              <div className="flex items-center text-secondary">
                <Users className="h-3 w-3 mr-1" />
                {listing._count.applications} interested
              </div>
            )}
          </div>

          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          )}
        </CardContent>
      </Card>
      <UserProfileModal
        userId={listing.ownerUserId}
        listingId={listing.id}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </Link>
  )
}
