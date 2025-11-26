"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListingCard } from "@/components/listings/listing-card"
import { Loader2, LayoutGrid, LayoutList } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

export default function MyListingsPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [myListings, setMyListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchMyListings()
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

  const fetchMyListings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/listings?my=true")
      const data = await response.json()
      setMyListings(data.listings || [])
    } catch (error) {
      console.error("Failed to fetch listings:", error)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="my-listings" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {t.myListings?.myActiveListings || "İlanlarım"}
              </h1>
              <p className="text-muted-foreground">
                {t.myListings?.subtitle || "Oluşturduğun ilanları buradan yönet"}
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

              {/* Active Listings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {t.myListings?.activeListings || "Aktif İlanlar"}
                </h3>
                {myListings.filter(listing => {
                  const isExpired = new Date(listing.expiresAt) < new Date()
                  const isClosed = listing.status !== "OPEN"
                  return !isExpired && !isClosed
                }).length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        {t.myListings?.noActiveListings || "Aktif ilanınız yok"}
                      </p>
                      <Link href="/listings/create">
                        <Button variant="valorant">
                          {t.listings?.createTeamListing || "İlan Oluştur"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    {myListings.filter(listing => {
                      const isExpired = new Date(listing.expiresAt) < new Date()
                      const isClosed = listing.status !== "OPEN"
                      return !isExpired && !isClosed
                    }).map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </div>

              {/* Expired/Closed Listings */}
              {myListings.filter(listing => {
                const isExpired = new Date(listing.expiresAt) < new Date()
                const isClosed = listing.status !== "OPEN"
                return isExpired || isClosed
              }).length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    {t.myListings?.expiredListings || "Süresi Dolmuş / Kapanmış İlanlar"}
                  </h3>
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    {myListings.filter(listing => {
                      const isExpired = new Date(listing.expiresAt) < new Date()
                      const isClosed = listing.status !== "OPEN"
                      return isExpired || isClosed
                    }).map((listing) => (
                      <div key={listing.id} className="opacity-60">
                        <ListingCard listing={listing} />
                      </div>
                    ))}
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
