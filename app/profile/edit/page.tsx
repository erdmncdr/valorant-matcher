"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/components/profile/profile-form"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { usePresence } from "@/hooks/use-presence"
import { useLanguage } from "@/lib/i18n/language-context"

export default function EditProfilePage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
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
      <Navbar profile={profile} currentPage="dashboard" />

      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t.profileEdit.title}</h1>
          <p className="text-gray-400">{t.profileEdit.subtitle}</p>
        </div>

        {profile && <ProfileForm initialData={profile} onSuccess={handleSuccess} />}
      </div>
    </div>
  )
}
