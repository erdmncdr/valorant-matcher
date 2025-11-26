"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Clock, MapPin, CheckCircle, XCircle, Trash2, LayoutGrid, LayoutList } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { getRankBadgeClass } from "@/lib/constants"
import { formatTimeAgo, formatExpiresIn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

export default function MyApplicationsPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [myApplications, setMyApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchMyApplications()
    }
  }, [status, router])

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

  const fetchMyApplications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/applications?my=true")
      const data = await response.json()
      setMyApplications(data.applications || [])
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelApplication = async (applicationId: string) => {
    setCancellingId(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: t.common?.success || "Success",
          description: "Application cancelled successfully",
        })
        fetchMyApplications()
      } else {
        const data = await response.json()
        toast({
          title: t.common?.error || "Error",
          description: data.error || "Failed to cancel application",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t.common?.error || "Error",
        description: "Failed to cancel application",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
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
      <Navbar profile={profile} currentPage="my-applications" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {t.myListings?.myApplications || "Başvurularım"}
              </h1>
              <p className="text-muted-foreground">
                Yaptığın başvuruları buradan takip et
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-end gap-2 mb-4">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              {/* Active Applications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {t.myListings?.activeApplications || "Aktif Başvurular"}
                </h3>
                {myApplications.filter(application => {
                  const listing = application.listing
                  const isExpired = listing && new Date(listing.expiresAt) < new Date()
                  const isClosed = listing?.status !== "OPEN"
                  return !isExpired && !isClosed
                }).length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        {t.myListings?.noApplications || "Başvurun yok"}
                      </p>
                      <Link href="/listings">
                        <Button variant="valorant">
                          {t.listings?.title || "İlanlara Göz At"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    {myApplications.filter(application => {
                      const listing = application.listing
                      const isExpired = listing && new Date(listing.expiresAt) < new Date()
                      const isClosed = listing?.status !== "OPEN"
                      return !isExpired && !isClosed
                    }).map((application) => {
                      const listing = application.listing
                      const owner = listing?.owner
                      const ownerProfile = owner?.playerProfile
                      const isExpired = listing && new Date(listing.expiresAt) < new Date()
                      const isClosed = listing?.status !== "OPEN"

                      return (
                        <Card key={application.id} className="border-secondary/20 hover:border-secondary/40 transition-colors overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <Link href={`/listings/${listing?.id}`}>
                                  <CardTitle className="hover:text-secondary transition-colors cursor-pointer line-clamp-2 break-words">
                                    {listing?.title}
                                  </CardTitle>
                                </Link>
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                  <Badge
                                    variant={
                                      application.status === "accepted"
                                        ? "default"
                                        : application.status === "declined"
                                        ? "destructive"
                                        : "outline"
                                    }
                                    className={
                                      application.status === "accepted"
                                        ? "bg-green-500/20 text-green-500 border-green-500"
                                        : application.status === "declined"
                                        ? "bg-red-500/20 text-red-500 border-red-500"
                                        : ""
                                    }
                                  >
                                    {application.status === "accepted" && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {application.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                                    {application.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                    {application.status === "accepted" ? t.common?.accepted || "Accepted" :
                                     application.status === "declined" ? t.common?.declined || "Declined" :
                                     t.common?.pending || "Pending"}
                                  </Badge>
                                  {(isExpired || isClosed) && (
                                    <Badge variant="outline" className="text-gray-400 border-gray-400">
                                      {isClosed ? "Closed" : "Expired"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="mode">{listing?.mode}</Badge>
                              {listing?.desiredRole && (
                                <Badge variant="role">{listing.desiredRole}</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="text-muted-foreground mb-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {t.listings?.region || "Region"}
                                </p>
                                <p className="text-foreground truncate">{listing?.region}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted-foreground mb-1">{t.listings?.rankRange || "Rank Range"}</p>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Badge className={`${getRankBadgeClass(listing?.minRank || "IRON")} rank-badge text-xs`}>
                                    {listing?.minRank}
                                  </Badge>
                                  <span className="text-muted-foreground">-</span>
                                  <Badge className={`${getRankBadgeClass(listing?.maxRank || "RADIANT")} rank-badge text-xs`}>
                                    {listing?.maxRank}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <p className="text-muted-foreground text-xs mb-2">{t.listings?.postedBy || "Posted by"}</p>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {ownerProfile?.nickname?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-foreground text-sm font-medium truncate">
                                    {ownerProfile?.nickname}
                                    <span className="text-muted-foreground">{ownerProfile?.tagline}</span>
                                  </p>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge className={`${getRankBadgeClass(ownerProfile?.rankCurrent || "IRON")} rank-badge text-xs`}>
                                      {ownerProfile?.rankCurrent}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {application.message && (
                              <div className="bg-muted/50 rounded p-3">
                                <p className="text-xs text-muted-foreground mb-1">{t.common?.comment || "Your message"}:</p>
                                <p className="text-sm text-foreground break-words">{application.message}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                              <span className="truncate">{t.listings?.applied || "Applied"} {formatTimeAgo(new Date(application.createdAt))}</span>
                              {listing && !isExpired && !isClosed && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatExpiresIn(new Date(listing.expiresAt))}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/listings/${listing?.id}`} className="flex-1">
                                <Button variant="outline" className="w-full">
                                  {t.common?.viewListing || "View Listing"}
                                </Button>
                              </Link>
                              {application.status === "pending" && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleCancelApplication(application.id)}
                                  disabled={cancellingId === application.id}
                                  title="Cancel Application"
                                >
                                  {cancellingId === application.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Expired/Closed Applications */}
              {myApplications.filter(application => {
                const listing = application.listing
                const isExpired = listing && new Date(listing.expiresAt) < new Date()
                const isClosed = listing?.status !== "OPEN"
                return isExpired || isClosed
              }).length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    {t.myListings?.expiredApplications || "Süresi Dolmuş / Kapanmış Başvurular"}
                  </h3>
                  <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    {myApplications.filter(application => {
                      const listing = application.listing
                      const isExpired = listing && new Date(listing.expiresAt) < new Date()
                      const isClosed = listing?.status !== "OPEN"
                      return isExpired || isClosed
                    }).map((application) => {
                      const listing = application.listing
                      const owner = listing?.owner
                      const ownerProfile = owner?.playerProfile

                      return (
                        <Card key={application.id} className="border-secondary/20 hover:border-secondary/40 transition-colors overflow-hidden opacity-60">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <Link href={`/listings/${listing?.id}`}>
                                  <CardTitle className="hover:text-secondary transition-colors cursor-pointer line-clamp-2 break-words">
                                    {listing?.title}
                                  </CardTitle>
                                </Link>
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                  <Badge
                                    variant={
                                      application.status === "accepted"
                                        ? "default"
                                        : application.status === "declined"
                                        ? "destructive"
                                        : "outline"
                                    }
                                    className={
                                      application.status === "accepted"
                                        ? "bg-green-500/20 text-green-500 border-green-500"
                                        : application.status === "declined"
                                        ? "bg-red-500/20 text-red-500 border-red-500"
                                        : ""
                                    }
                                  >
                                    {application.status === "accepted" && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {application.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                                    {application.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                    {application.status === "accepted" ? t.common?.accepted || "Accepted" :
                                     application.status === "declined" ? t.common?.declined || "Declined" :
                                     t.common?.pending || "Pending"}
                                  </Badge>
                                  <Badge variant="outline" className="text-gray-400 border-gray-400">
                                    {listing?.status !== "OPEN" ? "Closed" : "Expired"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="mode">{listing?.mode}</Badge>
                              {listing?.desiredRole && (
                                <Badge variant="role">{listing.desiredRole}</Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="text-muted-foreground mb-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {t.listings?.region || "Region"}
                                </p>
                                <p className="text-foreground truncate">{listing?.region}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted-foreground mb-1">{t.listings?.rankRange || "Rank Range"}</p>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <Badge className={`${getRankBadgeClass(listing?.minRank || "IRON")} rank-badge text-xs`}>
                                    {listing?.minRank}
                                  </Badge>
                                  <span className="text-muted-foreground">-</span>
                                  <Badge className={`${getRankBadgeClass(listing?.maxRank || "RADIANT")} rank-badge text-xs`}>
                                    {listing?.maxRank}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <p className="text-muted-foreground text-xs mb-2">{t.listings?.postedBy || "Posted by"}</p>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {ownerProfile?.nickname?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-foreground text-sm font-medium truncate">
                                    {ownerProfile?.nickname}
                                    <span className="text-muted-foreground">{ownerProfile?.tagline}</span>
                                  </p>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge className={`${getRankBadgeClass(ownerProfile?.rankCurrent || "IRON")} rank-badge text-xs`}>
                                      {ownerProfile?.rankCurrent}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {application.message && (
                              <div className="bg-muted/50 rounded p-3">
                                <p className="text-xs text-muted-foreground mb-1">{t.common?.comment || "Your message"}:</p>
                                <p className="text-sm text-foreground break-words">{application.message}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                              <span className="truncate">{t.listings?.applied || "Applied"} {formatTimeAgo(new Date(application.createdAt))}</span>
                            </div>

                            <Link href={`/listings/${listing?.id}`}>
                              <Button variant="outline" className="w-full">
                                {t.common?.viewListing || "View Listing"}
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
