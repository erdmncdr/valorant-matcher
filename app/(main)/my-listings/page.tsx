"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListingCard } from "@/components/listings/listing-card"
import { Loader2 } from "lucide-react"

export default function MyListingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [myListings, setMyListings] = useState<any[]>([])
  const [myApplications, setMyApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchMyData()
    }
  }, [status, router])

  const fetchMyData = async () => {
    setIsLoading(true)
    try {
      // Fetch user's own listings
      const listingsResponse = await fetch("/api/listings")
      const listingsData = await listingsResponse.json()

      // Filter to only show user's listings (this should be done on the backend ideally)
      // For now, we'll fetch all and filter client-side
      // In a production app, add a "my" query parameter to the API

      setMyListings(listingsData.listings || [])

      // Note: In a real app, you'd have an endpoint like /api/listings/my
      // and /api/applications/my to get user-specific data
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
              <Link href="/listings">
                <Button variant="ghost" className="text-white">Browse Listings</Button>
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
          <h1 className="text-4xl font-bold text-white mb-2">My Listings</h1>
          <p className="text-gray-400">Manage your listings and applications</p>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {myListings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400 mb-4">You haven&apos;t created any listings yet</p>
                  <Link href="/listings/create">
                    <Button variant="valorant">Create Your First Listing</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.slice(0, 6).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            {myApplications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-400 mb-4">You haven&apos;t applied to any listings yet</p>
                  <Link href="/listings">
                    <Button variant="valorant">Browse Listings</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myApplications.map((application) => (
                  <Card key={application.id} className="border-valorant-cyan/20">
                    <CardContent className="p-4">
                      <p className="text-white">Application to: {application.listing?.title}</p>
                      <p className="text-sm text-gray-400">Status: {application.status}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
