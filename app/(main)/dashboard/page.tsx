"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserCircle, Users, MessageCircle, Star, LogOut } from "lucide-react"
import { getRankBadgeClass } from "@/lib/constants"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()

      if (!data.profile) {
        router.push("/profile/complete")
        return
      }

      setProfile(data.profile)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
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

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-valorant-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N1</span>
                </div>
                <span className="text-white font-bold text-xl">NeedOne</span>
              </Link>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/listings">
                  <Button variant="ghost" className="text-white">Find Players</Button>
                </Link>
                <Link href="/my-listings">
                  <Button variant="ghost" className="text-white">My Listings</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/profile/edit">
                <Button variant="outline">Edit Profile</Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{profile.nickname}</p>
                  <p className="text-xs text-gray-400">{profile.tagline}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-gray-400 hover:text-white hover:bg-red-500/10"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {profile.nickname}!
          </h1>
          <p className="text-gray-400">Ready to find your perfect 5th teammate?</p>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-valorant-red/20">
            <CardHeader>
              <CardTitle className="text-white">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Current Rank</p>
                    <div className="mt-1">
                      <Badge className={`${getRankBadgeClass(profile.rankCurrent)} rank-badge`}>
                        {profile.rankCurrent}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Peak Rank</p>
                    <div className="mt-1">
                      <Badge className={`${getRankBadgeClass(profile.rankPeak)} rank-badge`}>
                        {profile.rankPeak}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Main Role</p>
                    <div className="mt-1">
                      <Badge variant="role">
                        {profile.mainRole}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Agents</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.playerAgents.map((agent: any) => (
                      <Badge key={agent.id} variant="secondary">
                        {agent.agentName}
                        {agent.priority === "main" && " ⭐"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Region</p>
                    <p className="text-white">{profile.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Languages</p>
                    <p className="text-white">{profile.languages.join(", ")}</p>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Bio</p>
                    <p className="text-white text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-valorant-cyan/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/listings/create?type=team" className="block">
                  <Button variant="outline" className="w-full justify-start border-valorant-red/30 hover:border-valorant-red">
                    <Users className="mr-2 h-4 w-4" />
                    Create Team Listing
                  </Button>
                </Link>
                <Link href="/listings/create?type=solo" className="block">
                  <Button variant="outline" className="w-full justify-start border-valorant-cyan/30 hover:border-valorant-cyan">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Create Solo Listing
                  </Button>
                </Link>
                <Link href="/listings" className="block">
                  <Button variant="outline" className="w-full justify-start border-valorant-purple/30 hover:border-valorant-purple">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Browse Listings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Star className="mr-2 h-5 w-5 text-yellow-500" />
                  Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">Build your reputation by playing with others and getting rated!</p>
                <div className="mt-3 flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">0</p>
                    <p className="text-xs text-gray-400">Positive</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">0</p>
                    <p className="text-xs text-gray-400">Negative</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="border-valorant-purple/20">
          <CardHeader>
            <CardTitle className="text-white">Getting Started</CardTitle>
            <CardDescription>How to use NeedOne</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-valorant-red mr-3">1.</span>
                <span><strong>Find a Team:</strong> Browse team listings to find stacks looking for a 5th player</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-valorant-cyan mr-3">2.</span>
                <span><strong>Create a Listing:</strong> Post as a team (4-stack) or solo player</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-valorant-purple mr-3">3.</span>
                <span><strong>Connect:</strong> Use the built-in chat to communicate</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-yellow-500 mr-3">4.</span>
                <span><strong>Play & Rate:</strong> After playing, rate your teammates to build trust</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
