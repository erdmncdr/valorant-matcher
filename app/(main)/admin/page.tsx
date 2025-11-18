"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield, AlertTriangle } from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"
import { Navbar } from "@/components/layout/navbar"

export default function AdminPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      checkAdminAndFetchData()
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

  const checkAdminAndFetchData = async () => {
    try {
      const response = await fetch("/api/reports")

      if (response.status === 403) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin permissions",
        })
        router.push("/dashboard")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      setReports(data.reports || [])
      setIsAdmin(true)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
      router.push("/dashboard")
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

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      <Navbar profile={profile} currentPage="admin" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-valorant-red" />
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Manage reports and moderation</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-valorant-red/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Reports</p>
                  <p className="text-3xl font-bold text-white">{reports.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-valorant-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Open Reports</p>
                  <p className="text-3xl font-bold text-white">
                    {reports.filter((r) => r.status === "OPEN").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-valorant-cyan/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Under Review</p>
                  <p className="text-3xl font-bold text-white">
                    {reports.filter((r) => r.status === "UNDER_REVIEW").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-valorant-cyan" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card className="border-valorant-purple/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No reports yet</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg bg-valorant-dark/30 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">{report.reason}</Badge>
                          <Badge variant="outline">{report.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          {formatTimeAgo(new Date(report.createdAt))}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Reporter</p>
                        <p className="text-white">
                          {report.reporter.playerProfile?.nickname || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Reported User</p>
                        <p className="text-white font-medium">
                          {report.target.playerProfile?.nickname || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-400 text-sm mb-1">Description</p>
                      <p className="text-white text-sm">{report.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" variant="destructive">
                        Ban User
                      </Button>
                      <Button size="sm" variant="ghost">
                        Mark Reviewed
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
