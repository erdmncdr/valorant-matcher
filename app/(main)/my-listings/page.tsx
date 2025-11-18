"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListingCard } from "@/components/listings/listing-card"
import { Loader2, Clock, MapPin, Users, CheckCircle, XCircle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { getRankBadgeClass } from "@/lib/constants"
import { formatTimeAgo, formatExpiresIn } from "@/lib/utils"

export default function MyListingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [myListings, setMyListings] = useState<any[]>([])
  const [myApplications, setMyApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchMyData()
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

  const fetchMyData = async () => {
    setIsLoading(true)
    try {
      // Fetch user's own listings using the "my" parameter
      const listingsResponse = await fetch("/api/listings?my=true")
      const listingsData = await listingsResponse.json()

      setMyListings(listingsData.listings || [])

      // Fetch user's applications
      const applicationsResponse = await fetch("/api/applications?my=true")
      const applicationsData = await applicationsResponse.json()
      setMyApplications(applicationsData.applications || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      <Navbar profile={profile} currentPage="my-listings" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t.myListings.title}</h1>
          <p className="text-gray-400">{t.myListings.subtitle}</p>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="listings">{t.myListings.myActiveListings}</TabsTrigger>
            <TabsTrigger value="applications">{t.myListings.myApplications}</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {myListings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400 mb-4">{t.myListings.noActiveListings}</p>
                  <Link href="/listings/create">
                    <Button variant="valorant">{t.listings.createTeamListing}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {myApplications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400 mb-4">{t.myListings.noApplications}</p>
                  <Link href="/listings">
                    <Button variant="valorant">{t.listings.title}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myApplications.map((application) => {
                  const listing = application.listing
                  const owner = listing?.owner
                  const ownerProfile = owner?.playerProfile
                  const isExpired = listing && new Date(listing.expiresAt) < new Date()
                  const isClosed = listing?.status !== "OPEN"

                  return (
                    <Card key={application.id} className="border-valorant-cyan/20 hover:border-valorant-cyan/40 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/listings/${listing?.id}`}>
                              <CardTitle className="text-white hover:text-valorant-cyan transition-colors cursor-pointer line-clamp-1">
                                {listing?.title}
                              </CardTitle>
                            </Link>
                            <div className="flex items-center gap-2 mt-2">
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
                                {application.status === "accepted" ? t.common.success || "Accepted" :
                                 application.status === "declined" ? "Declined" :
                                 "Pending"}
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
                        {/* Listing Details */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="mode">{listing?.mode}</Badge>
                          {listing?.desiredRole && (
                            <Badge variant="role">{listing.desiredRole}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {t.listings.region || "Region"}
                            </p>
                            <p className="text-white">{listing?.region}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">{t.listings.rankRange || "Rank Range"}</p>
                            <div className="flex items-center gap-1">
                              <Badge className={`${getRankBadgeClass(listing?.minRank || "IRON")} rank-badge text-xs`}>
                                {listing?.minRank}
                              </Badge>
                              <span className="text-gray-400">-</span>
                              <Badge className={`${getRankBadgeClass(listing?.maxRank || "RADIANT")} rank-badge text-xs`}>
                                {listing?.maxRank}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Owner Info */}
                        <div>
                          <p className="text-gray-400 text-xs mb-2">{t.listings.postedBy || "Posted by"}</p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-valorant-red text-white text-xs">
                                {ownerProfile?.nickname?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {ownerProfile?.nickname}
                                <span className="text-gray-400">#{ownerProfile?.tagline}</span>
                              </p>
                              <div className="flex items-center gap-1">
                                <Badge className={`${getRankBadgeClass(ownerProfile?.rankCurrent || "IRON")} rank-badge text-xs`}>
                                  {ownerProfile?.rankCurrent}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Application Message */}
                        {application.message && (
                          <div className="bg-valorant-dark/30 rounded p-3">
                            <p className="text-xs text-gray-400 mb-1">{t.common.comment || "Your message"}:</p>
                            <p className="text-sm text-white">{application.message}</p>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                          <span>{t.listings.applied || "Applied"} {formatTimeAgo(new Date(application.createdAt))}</span>
                          {listing && !isExpired && !isClosed && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatExpiresIn(new Date(listing.expiresAt))}
                            </span>
                          )}
                        </div>

                        {/* View Listing Button */}
                        <Link href={`/listings/${listing?.id}`}>
                          <Button variant="outline" className="w-full">
                            {t.common.viewProfile || "View Listing"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
