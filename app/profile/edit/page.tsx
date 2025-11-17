"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/components/profile/profile-form"
import { Loader2 } from "lucide-react"

export default function EditProfilePage() {
  const { status } = useSession()
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

  const handleSuccess = () => {
    router.push("/dashboard")
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
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white">Cancel</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Edit Profile</h1>
          <p className="text-gray-400">Update your Valorant profile information</p>
        </div>

        {profile && <ProfileForm initialData={profile} onSuccess={handleSuccess} />}
      </div>
    </div>
  )
}
