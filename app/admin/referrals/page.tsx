"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/layout/navbar"
import { Loader2, Users, TrendingUp, Coins, PiggyBank, Gift, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ReferralProfile {
  id: string
  userId: string
  nickname: string
  tagline: string
  referralCode: string
  referralBalance: number
  nPoints: number
  createdAt: string
  referredByNickname: string | null
  referredCount: number
  totalCommissionEarned: number
  referrerBonusesReceived: number
  referrerBonusCount: number
}

interface ReferralStats {
  totalUsers: number
  usersWithReferrals: number
  totalReferralConnections: number
  totalCommission: number
  totalReferrerBonuses: number
  totalPiggyBankBalance: number
}

interface RecentActivity {
  newUser: string
  referrer: string
  date: string
}

export default function AdminReferralsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [profiles, setProfiles] = useState<ReferralProfile[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [profileRes, referralRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/admin/referrals"),
      ])

      const profileData = await profileRes.json()
      const referralData = await referralRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)

        // Check if user is admin
        if (!profileData.profile.isAdmin) {
          router.push("/dashboard")
          return
        }
      }

      if (referralData.stats) {
        setStats(referralData.stats)
        setProfiles(referralData.profiles)
        setRecentActivity(referralData.recentActivity)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" />
            Referans Sistemi - Admin Paneli
          </h1>
          <p className="text-muted-foreground">
            Referans sistemini buradan takip edebilirsiniz
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="border-blue-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {stats?.totalUsers.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referans Veren</p>
                  <p className="text-3xl font-bold text-green-500">
                    {stats?.usersWithReferrals.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Davet Edilen</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {stats?.totalReferralConnections.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Komisyon (%5)</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {stats?.totalCommission.toLocaleString() || 0} NP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/20">
                  <Gift className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam 50 NP Bonusları</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {stats?.totalReferrerBonuses.toLocaleString() || 0} NP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-pink-500/20">
                  <PiggyBank className="h-8 w-8 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Kumbara</p>
                  <p className="text-3xl font-bold text-pink-500">
                    {stats?.totalPiggyBankBalance.toLocaleString() || 0} NP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son Referans İşlemleri
            </CardTitle>
            <CardDescription>Son 20 referans işlemi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{activity.newUser}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.referrer} tarafından davet edildi
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activity.date)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tüm Kullanıcılar - Referans Detayları</CardTitle>
            <CardDescription>
              Kullanıcıların referans istatistikleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3">Kullanıcı</th>
                    <th className="text-left p-3">Referans Kodu</th>
                    <th className="text-center p-3">Davet Sayısı</th>
                    <th className="text-right p-3">50 NP Bonuslar</th>
                    <th className="text-right p-3">%5 Komisyon</th>
                    <th className="text-right p-3">Kumbara</th>
                    <th className="text-right p-3">Ana Bakiye</th>
                    <th className="text-left p-3">Davet Eden</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-3">
                        <div>
                          <p className="font-semibold">{p.nickname}</p>
                          <p className="text-xs text-muted-foreground">{p.tagline}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {p.referralCode}
                        </code>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant={p.referredCount > 0 ? "default" : "secondary"}>
                          {p.referredCount}
                        </Badge>
                      </td>
                      <td className="text-right p-3">
                        <div>
                          <p className="font-semibold text-orange-500">
                            {p.referrerBonusesReceived} NP
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({p.referrerBonusCount} × 50 NP)
                          </p>
                        </div>
                      </td>
                      <td className="text-right p-3">
                        <p className="font-semibold text-yellow-500">
                          {p.totalCommissionEarned} NP
                        </p>
                      </td>
                      <td className="text-right p-3">
                        <p className="font-semibold text-pink-500">
                          {p.referralBalance} NP
                        </p>
                      </td>
                      <td className="text-right p-3">
                        <p className="font-semibold">{p.nPoints} NP</p>
                      </td>
                      <td className="p-3">
                        {p.referredByNickname ? (
                          <Badge variant="outline">{p.referredByNickname}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
