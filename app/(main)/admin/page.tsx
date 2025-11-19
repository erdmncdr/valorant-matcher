"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield, AlertTriangle, Users, ArrowRight, Activity, Flag } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"

export default function AdminPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    totalReports: 0,
    openReports: 0,
    underReview: 0,
    totalUsers: 0,
    bannedUsers: 0,
    activeUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchStats()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)

        if (!data.profile.isAdmin) {
          router.push("/")
          toast({
            title: "Access Denied",
            description: "You don't have admin permissions",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Fetch reports stats
      const reportsResponse = await fetch("/api/reports")
      if (reportsResponse.status === 403) {
        router.push("/dashboard")
        return
      }

      const reportsData = await reportsResponse.json()
      const reports = reportsData.reports || []

      // Fetch users stats
      const usersResponse = await fetch("/api/admin/users?limit=1000")
      const usersData = await usersResponse.json()
      const users = usersData.users || []

      setStats({
        totalReports: reports.length,
        openReports: reports.filter((r: any) => r.status === "OPEN").length,
        underReview: reports.filter((r: any) => r.status === "UNDER_REVIEW").length,
        totalUsers: users.length,
        bannedUsers: users.filter((u: any) => u.isBanned).length,
        activeUsers: users.filter((u: any) => !u.isBanned).length,
      })
    } catch (error: any) {
      console.error("Failed to fetch stats:", error)
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
      <Navbar profile={profile} currentPage="admin" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">{t.admin.title}</h1>
            <p className="text-muted-foreground">{t.admin.subtitle}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Analytics Card */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
            <Link href="/admin/analytics">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                      <Activity className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{t.admin.analytics}</CardTitle>
                      <CardDescription>{t.admin.analyticsDesc}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Kullanıcı aktivitesi, oturum süreleri, online kullanıcılar ve daha fazlası
                  </p>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500">
                    Real-time Data
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Reports Card */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
            <Link href="/admin/reports">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Flag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{t.admin.reportsTitle}</CardTitle>
                      <CardDescription>{t.admin.reportsDesc}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Toplam</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalReports}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Açık</p>
                    <p className="text-2xl font-bold text-red-500">{stats.openReports}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">İncelemede</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.underReview}</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Users Card */}
          <Card className="border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
            <Link href="/admin/users">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{t.admin.usersTitle}</CardTitle>
                      <CardDescription>{t.admin.usersDesc}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.admin.total}</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.admin.active}</p>
                    <p className="text-2xl font-bold text-green-500">{stats.activeUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t.admin.banned}</p>
                    <p className="text-2xl font-bold text-red-500">{stats.bannedUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-primary" />
                {t.admin.needsAttention}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-sm text-foreground">{t.admin.openReports}</span>
                  <Badge variant="destructive">{stats.openReports}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-sm text-foreground">{t.admin.underReview}</span>
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">{stats.underReview}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-accent" />
                {t.admin.quickActions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/reports?status=OPEN">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Flag className="h-4 w-4 mr-2" />
                    {t.admin.viewOpenReports}
                  </Button>
                </Link>
                <Link href="/admin/users?status=banned">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    {t.admin.bannedUsers}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-secondary" />
                {t.admin.systemInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.admin.totalUsersLabel}</span>
                  <span className="font-semibold text-foreground">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.admin.totalReportsLabel}</span>
                  <span className="font-semibold text-foreground">{stats.totalReports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.admin.banRate}</span>
                  <span className="font-semibold text-foreground">
                    {stats.totalUsers > 0 ? ((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
