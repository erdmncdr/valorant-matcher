"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ListingCard } from "@/components/listings/listing-card"
import { Loader2, Filter, LayoutGrid, LayoutList } from "lucide-react"
import { GAME_MODES, REGIONS, VALORANT_RANKS, PLAYER_ROLES } from "@/lib/constants"
import { ListingType } from "@prisma/client"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

export default function ListingsPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [listings, setListings] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ListingType>("TEAM")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [filters, setFilters] = useState({
    mode: "",
    region: "",
    minRank: "",
    maxRank: "",
    desiredRole: "",
    sortBy: "createdAt",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchListings()
    }
  }, [status, activeTab, filters])

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

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        listingType: activeTab,
        sortBy: filters.sortBy,
        ...(filters.mode && filters.mode !== "all" && { mode: filters.mode }),
        ...(filters.region && filters.region !== "all" && { region: filters.region }),
        ...(filters.minRank && filters.minRank !== "all" && { minRank: filters.minRank }),
        ...(filters.maxRank && filters.maxRank !== "all" && { maxRank: filters.maxRank }),
        ...(filters.desiredRole && filters.desiredRole !== "all" && { desiredRole: filters.desiredRole }),
      })

      const response = await fetch(`/api/listings?${params}`)
      const data = await response.json()
      setListings(data.listings || [])
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      mode: "",
      region: "",
      minRank: "",
      maxRank: "",
      sortBy: "createdAt",
      desiredRole: "",
    })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      <Navbar profile={profile} currentPage="listings" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t.listings.title}</h1>
          <p className="text-gray-400">{t.listings.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Filters Sidebar */}
          <Card className="border-valorant-purple/20 h-fit lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  {t.listings.filters}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-valorant-cyan hover:text-valorant-cyan/80"
                >
                  {t.listings.clear}
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t.listings.sortBy || "Sıralama"}</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">{t.listings.sortByNewest || "En Yeni"}</SelectItem>
                      <SelectItem value="reputation">{t.listings.sortByReputation || "En Yüksek İtibar"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t.listings.gameMode}</label>
                  <Select
                    value={filters.mode || undefined}
                    onValueChange={(value) => setFilters({ ...filters, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.listings.allModes} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.listings.allModes}</SelectItem>
                      {GAME_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t.listings.region}</label>
                  <Select
                    value={filters.region || undefined}
                    onValueChange={(value) => setFilters({ ...filters, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.listings.allRegions} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.listings.allRegions}</SelectItem>
                      {REGIONS.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t.listings.desiredRole}</label>
                  <Select
                    value={filters.desiredRole || undefined}
                    onValueChange={(value) => setFilters({ ...filters, desiredRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.listings.allRoles} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.listings.allRoles}</SelectItem>
                      {PLAYER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t.listings.minRank}</label>
                  <Select
                    value={filters.minRank || undefined}
                    onValueChange={(value) => setFilters({ ...filters, minRank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.listings.any} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.listings.any}</SelectItem>
                      {VALORANT_RANKS.map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t.listings.maxRank}</label>
                  <Select
                    value={filters.maxRank || undefined}
                    onValueChange={(value) => setFilters({ ...filters, maxRank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.listings.any} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.listings.any}</SelectItem>
                      {VALORANT_RANKS.map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listings */}
          <div className="lg:col-span-3 lg:order-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                {/* TabsList will be here */}
              </div>
              <div className="flex items-center gap-2 ml-4">
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
            </div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ListingType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="TEAM">{t.listings.teamsLookingFor5th}</TabsTrigger>
                <TabsTrigger value="SOLO">{t.listings.soloPlayers}</TabsTrigger>
              </TabsList>

              <TabsContent value="TEAM" className="mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
                  </div>
                ) : listings.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-400">{t.listings.noTeamListings}</p>
                      <Link href="/listings/create?type=team">
                        <Button variant="valorant" className="mt-4">
                          {t.listings.createTeamListing}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="SOLO" className="mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-valorant-cyan" />
                  </div>
                ) : listings.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-400">{t.listings.noSoloListings}</p>
                      <Link href="/listings/create?type=solo">
                        <Button variant="valorant" className="mt-4">
                          {t.listings.createSoloListing}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Online Users Sidebar */}
          <div className="lg:col-span-1 lg:order-3">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
