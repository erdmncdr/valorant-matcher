"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  Users,
  Activity,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Eye,
  UserPlus,
  LogIn,
  Loader2,
} from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalListings: number
    totalMessages: number
    totalReports: number
    onlineUsers: number
    openListings: number
    pendingReports: number
  }
  today: {
    newUsers: number
    activeUsers: number
    logins: number
    listings: number
    messages: number
    reports: number
  }
  trends: {
    dailyActiveUsers: Array<{ date: string; activeUsers: number; logins: number }>
    registrations: Array<{ date: string; registrations: number }>
    peakHours: Array<{ hour: string; users: number }>
  }
  engagement: {
    avgSessionDuration: number
    aimTrainerPlays: number
    applications: number
    ratings: number
    listingsByType: Array<{ type: string; count: number }>
  }
  users: {
    mostActive: Array<any>
    retentionRate: number
    growthRate: number
  }
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchAnalytics()
    }
  }, [status, router])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)

        // Check if admin
        const userResponse = await fetch("/api/auth/session")
        const sessionData = await userResponse.json()

        if (!sessionData?.user?.id) {
          router.push("/")
          return
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics")

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/admin")
          return
        }
        throw new Error("Failed to fetch analytics")
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    )
  }

  const COLORS = ["#ff4655", "#00d9ff", "#ffea00", "#7c3aed", "#10b981"]

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              {t.admin.analytics}
            </h1>
            <p className="text-muted-foreground">
              {t.admin.overview}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={autoRefresh ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Badge>
            <Badge variant="outline" className="text-green-500 border-green-500">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              {analytics.overview.onlineUsers} Online
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.admin.onlineUsers}</CardTitle>
              <Eye className="h-4 w-4 text-green-500 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {analytics.overview.onlineUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.admin.activeUsers}
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.admin.activeUsers}</CardTitle>
              <Activity className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics.today.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{analytics.today.logins} logins today
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.admin.newUsersToday}</CardTitle>
              <UserPlus className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics.today.newUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.overview.totalUsers} total users
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.admin.avgSession}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics.engagement.avgSessionDuration}
                <span className="text-sm ml-1">{t.admin.min}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.admin.avgSessionDesc}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t.admin.overview}</TabsTrigger>
            <TabsTrigger value="users">{t.admin.userMetrics}</TabsTrigger>
            <TabsTrigger value="engagement">{t.admin.engagement}</TabsTrigger>
            <TabsTrigger value="content">{t.admin.contentModeration}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Active Users */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>{t.admin.dailyActiveUsersChart}</CardTitle>
                  <CardDescription>{t.admin.dailyActiveUsersDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.trends.dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="date"
                        stroke="#888"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="activeUsers"
                        stroke="#ff4655"
                        fill="#ff4655"
                        fillOpacity={0.3}
                        name="Active Users"
                      />
                      <Area
                        type="monotone"
                        dataKey="logins"
                        stroke="#00d9ff"
                        fill="#00d9ff"
                        fillOpacity={0.3}
                        name="Logins"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* New Registrations */}
              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle>{t.admin.newRegistrations}</CardTitle>
                  <CardDescription>{t.admin.newRegistrationsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.trends.registrations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="date"
                        stroke="#888"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="registrations" fill="#ffea00" name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card className="border-accent/20">
                <CardHeader>
                  <CardTitle>{t.admin.peakActivityHours}</CardTitle>
                  <CardDescription>{t.admin.peakActivityDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.trends.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="hour"
                        stroke="#888"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        name="Active Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Platform Stats */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>{t.admin.platformStats}</CardTitle>
                  <CardDescription>{t.admin.platformStatsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-sm">{t.admin.totalUsers}</span>
                    </div>
                    <span className="text-lg font-bold">{analytics.overview.totalUsers}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-accent" />
                      <span className="text-sm">{t.admin.totalListings}</span>
                    </div>
                    <span className="text-lg font-bold">{analytics.overview.totalListings}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-secondary" />
                      <span className="text-sm">{t.admin.totalMessages}</span>
                    </div>
                    <span className="text-lg font-bold">{analytics.overview.totalMessages}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">{t.admin.pendingReports}</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-500">
                      {analytics.overview.pendingReports}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{t.admin.monthlyGrowth}</span>
                    </div>
                    <span className="text-lg font-bold text-green-500">
                      +{analytics.users.growthRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Most Active Users */}
              <Card className="border-primary/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t.admin.mostActiveUsers}</CardTitle>
                  <CardDescription>Users with highest activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.users.mostActive.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {user.playerProfile?.nickname || "Unknown"}
                              {user.playerProfile?.tagline && (
                                <span className="text-muted-foreground">
                                  #{user.playerProfile.tagline}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-foreground">{user._count.listingsOwned}</p>
                            <p className="text-xs text-muted-foreground">Listings</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-foreground">{user._count.messagesSent}</p>
                            <p className="text-xs text-muted-foreground">Messages</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-primary">
                              {user.playerProfile?.reputationScore || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Rep</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Retention */}
              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>Weekly retention rate</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {analytics.users.retentionRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Users active this week who were also active last week
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Rate */}
              <Card className="border-accent/20">
                <CardHeader>
                  <CardTitle>Growth Rate</CardTitle>
                  <CardDescription>Monthly user growth</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-500 mb-2">
                      +{analytics.users.growthRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      New users this month vs last month
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Listing Types */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>{t.admin.listingsByType}</CardTitle>
                  <CardDescription>Distribution of listing types</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.engagement.listingsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) =>
                          `${props.name || props.type}: ${(props.percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                      >
                        {analytics.engagement.listingsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle>{t.admin.engagement}</CardTitle>
                  <CardDescription>User engagement activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-sm">Aim Trainer Plays</span>
                    </div>
                    <span className="text-lg font-bold">{analytics.engagement.aimTrainerPlays}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-accent" />
                      <span className="text-sm">Applications</span>
                    </div>
                    <span className="text-lg font-bold">{analytics.engagement.applications}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                      <span className="text-sm">Ratings Given</span>
                    </div>
                    <span className="text-lg font-bold">{analytics.engagement.ratings}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm">Avg. Session Duration</span>
                    </div>
                    <span className="text-lg font-bold">
                      {analytics.engagement.avgSessionDuration} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Listings</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {analytics.today.listings}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.overview.openListings} currently open
                  </p>
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {analytics.today.messages}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.overview.totalMessages} total messages
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {analytics.today.reports}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.overview.pendingReports} pending review
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
