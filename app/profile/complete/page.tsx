"use client"

import { ProfileForm } from "@/components/profile/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CompleteProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">
            Let&apos;s set up your Valorant profile so others can find you
          </p>
        </div>

        <ProfileForm />
      </div>
    </div>
  )
}
