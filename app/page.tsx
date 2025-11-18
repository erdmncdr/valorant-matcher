"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Star, MessageCircle, Loader2 } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/dashboard"
    }
  }, [status])

  if (status === "loading" || status === "authenticated") {
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
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                <span className="text-white font-bold text-xl">N1</span>
              </div>
              <span className="text-white font-bold text-xl">NeedOne</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="valorant">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-valorant-red via-valorant-purple to-valorant-cyan">
              5th Teammate
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            No more toxic randoms. Match with compatible players based on rank, role, and reputation.
            Built for the Valorant community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="valorant" className="text-lg px-8 glow-red">
                Find a 5th Now
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="text-lg px-8 border-valorant-cyan text-valorant-cyan hover:bg-valorant-cyan/10">
                Browse Players
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-valorant-red/20 bg-card/50 backdrop-blur hover:border-valorant-red/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-valorant-red/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-valorant-red" />
              </div>
              <CardTitle className="text-white">Team & Solo Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create listings as a 4-stack or solo player. Find exactly what you&apos;re looking for.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-valorant-cyan/20 bg-card/50 backdrop-blur hover:border-valorant-cyan/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-valorant-cyan/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-valorant-cyan" />
              </div>
              <CardTitle className="text-white">Safe & Moderated</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Report toxic behavior. Active moderation keeps the community clean and friendly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-valorant-purple/20 bg-card/50 backdrop-blur hover:border-valorant-purple/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-valorant-purple/20 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-valorant-purple" />
              </div>
              <CardTitle className="text-white">Reputation System</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Rate teammates after playing. Build your reputation and find trustworthy players.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-card/50 backdrop-blur hover:border-yellow-500/40 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <CardTitle className="text-white">Built-in Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Talk before you play. Coordinate roles and strategies in real-time.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 text-lg">Simple, fast, and effective</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-valorant-red/20 flex items-center justify-center mx-auto mb-4 border-2 border-valorant-red">
              <span className="text-2xl font-bold text-valorant-red">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Create Your Profile</h3>
            <p className="text-gray-400">Set your rank, main roles, and playstyle preferences</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-valorant-cyan/20 flex items-center justify-center mx-auto mb-4 border-2 border-valorant-cyan">
              <span className="text-2xl font-bold text-valorant-cyan">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Browse or Create Listing</h3>
            <p className="text-gray-400">Find teams looking for your role or post your own request</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-valorant-purple/20 flex items-center justify-center mx-auto mb-4 border-2 border-valorant-purple">
              <span className="text-2xl font-bold text-valorant-purple">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connect & Play</h3>
            <p className="text-gray-400">Chat, verify compatibility, and queue together</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="border-valorant-red/30 bg-gradient-to-r from-valorant-red/10 to-valorant-purple/10 backdrop-blur">
          <CardHeader className="text-center pb-8 pt-12">
            <CardTitle className="text-4xl text-white mb-4">Ready to Find Your Team?</CardTitle>
            <CardDescription className="text-lg text-gray-300">
              Join the growing community of Valorant players finding better teammates
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Link href="/register">
              <Button size="lg" variant="valorant" className="text-lg px-12 glow-red">
                Get Started Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-valorant-darker/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 NeedOne. Not affiliated with Riot Games or Valorant.</p>
            <p className="mt-2">All trademarks are property of their respective owners.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
