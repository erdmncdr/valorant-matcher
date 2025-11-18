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
import { Loader2, Filter } from "lucide-react"
import { GAME_MODES, REGIONS, VALORANT_RANKS, PLAYER_ROLES } from "@/lib/constants"
import { ListingType } from "@prisma/client"

export default function ListingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ListingType>("TEAM")

  const [filters, setFilters] = useState({
    mode: "",
    region: "",
    minRank: "",
    maxRank: "",
    desiredRole: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchListings()
    }
  }, [status, activeTab, filters])

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        listingType: activeTab,
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
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-valorant-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                <span className="text-white font-bold text-xl">N1</span>
              </div>
              <span className="text-white font-bold text-xl">NeedOne</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/listings/create">
                <Button variant="valorant">Create Listing</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Browse Listings</h1>
          <p className="text-gray-400">Find your perfect teammate</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="border-valorant-purple/20 h-fit">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-valorant-cyan hover:text-valorant-cyan/80"
                >
                  Clear
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Game Mode</label>
                  <Select
                    value={filters.mode || undefined}
                    onValueChange={(value) => setFilters({ ...filters, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      {GAME_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Region</label>
                  <Select
                    value={filters.region || undefined}
                    onValueChange={(value) => setFilters({ ...filters, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {REGIONS.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Desired Role</label>
                  <Select
                    value={filters.desiredRole || undefined}
                    onValueChange={(value) => setFilters({ ...filters, desiredRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {PLAYER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Min Rank</label>
                  <Select
                    value={filters.minRank || undefined}
                    onValueChange={(value) => setFilters({ ...filters, minRank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      {VALORANT_RANKS.map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Max Rank</label>
                  <Select
                    value={filters.maxRank || undefined}
                    onValueChange={(value) => setFilters({ ...filters, maxRank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
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
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ListingType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="TEAM">Teams Looking for 5th</TabsTrigger>
                <TabsTrigger value="SOLO">Solo Players</TabsTrigger>
              </TabsList>

              <TabsContent value="TEAM" className="mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
                  </div>
                ) : listings.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-400">No team listings found</p>
                      <Link href="/listings/create?type=team">
                        <Button variant="valorant" className="mt-4">
                          Create Team Listing
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-gray-400">No solo listings found</p>
                      <Link href="/listings/create?type=solo">
                        <Button variant="valorant" className="mt-4">
                          Create Solo Listing
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
