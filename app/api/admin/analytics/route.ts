import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/analytics - Get analytics data
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get("range") || "7d" // 24h, 7d, 30d, 90d, all

    // Calculate date ranges
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)

    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    const last24Hours = new Date(now)
    last24Hours.setHours(last24Hours.getHours() - 24)

    // 1. OVERVIEW STATS
    const totalUsers = await prisma.user.count()
    const totalListings = await prisma.listing.count()
    const totalMessages = await prisma.privateMessage.count()
    const totalReports = await prisma.report.count()

    // 2. TODAY'S STATS
    const todayNewUsers = await prisma.user.count({
      where: { createdAt: { gte: today } },
    })

    const todayActiveUsers = await prisma.user.count({
      where: { lastSeenAt: { gte: today } },
    })

    const todayLogins = await prisma.user.count({
      where: { lastLoginAt: { gte: today } },
    })

    const todayListings = await prisma.listing.count({
      where: { createdAt: { gte: today } },
    })

    const todayMessages = await prisma.privateMessage.count({
      where: { createdAt: { gte: today } },
    })

    // 3. ONLINE USERS (active in last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const onlineUsers = await prisma.user.count({
      where: { lastSeenAt: { gte: fiveMinutesAgo } },
    })

    // 4. DAILY ACTIVE USERS TREND (last 7 days)
    const dailyActiveUsersTrend = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const activeUsers = await prisma.user.count({
        where: {
          lastSeenAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      })

      const logins = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      })

      dailyActiveUsersTrend.push({
        date: dayStart.toISOString().split('T')[0],
        activeUsers,
        logins,
      })
    }

    // 5. NEW REGISTRATIONS TREND (last 7 days)
    const registrationsTrend = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      })

      registrationsTrend.push({
        date: dayStart.toISOString().split('T')[0],
        registrations: newUsers,
      })
    }

    // 6. SESSION DURATION STATS
    // Calculate average session duration (time between login and lastSeen)
    const recentSessions = await prisma.user.findMany({
      where: {
        lastLoginAt: { gte: last7Days },
        lastSeenAt: { gte: last7Days },
      },
      select: {
        lastLoginAt: true,
        lastSeenAt: true,
      },
      take: 100,
    })

    const sessionDurations = recentSessions
      .filter(s => s.lastLoginAt && s.lastSeenAt)
      .map(s => {
        const duration = s.lastSeenAt!.getTime() - s.lastLoginAt!.getTime()
        return Math.max(0, duration / (1000 * 60)) // minutes
      })
      .filter(d => d > 0 && d < 480) // Filter out unrealistic durations (0-8 hours)

    const avgSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0

    // 7. LISTING STATS
    const openListings = await prisma.listing.count({
      where: {
        status: "OPEN",
        expiresAt: { gt: now },
      },
    })

    const listingsByType = await prisma.listing.groupBy({
      by: ["listingType"],
      _count: true,
      where: { createdAt: { gte: last7Days } },
    })

    // 8. MOST ACTIVE USERS (last 7 days)
    const mostActiveUsers = await prisma.user.findMany({
      where: {
        lastSeenAt: { gte: last7Days },
      },
      select: {
        id: true,
        email: true,
        playerProfile: {
          select: {
            nickname: true,
            tagline: true,
            reputationScore: true,
          },
        },
        lastSeenAt: true,
        _count: {
          select: {
            listingsOwned: true,
            messagesSent: true,
            listingApplications: true,
          },
        },
      },
      orderBy: {
        lastSeenAt: "desc",
      },
      take: 10,
    })

    // 9. ENGAGEMENT METRICS
    const totalAimTrainerScores = await prisma.aimTrainerScore.count({
      where: { createdAt: { gte: last7Days } },
    })

    const totalApplications = await prisma.listingApplication.count({
      where: { createdAt: { gte: last7Days } },
    })

    const totalRatings = await prisma.rating.count({
      where: { createdAt: { gte: last7Days } },
    })

    // 10. REPORT STATS
    const pendingReports = await prisma.report.count({
      where: { status: "PENDING" },
    })

    const todayReports = await prisma.report.count({
      where: { createdAt: { gte: today } },
    })

    // 11. USER RETENTION (users who logged in both this week and last week)
    const thisWeekLogins = await prisma.user.count({
      where: { lastLoginAt: { gte: last7Days } },
    })

    const last14Days = new Date(today)
    last14Days.setDate(last14Days.getDate() - 14)

    const twoWeeksLogins = await prisma.user.count({
      where: { lastLoginAt: { gte: last14Days } },
    })

    const retentionRate = twoWeeksLogins > 0
      ? ((thisWeekLogins / twoWeeksLogins) * 100).toFixed(1)
      : 0

    // 12. PEAK HOURS ANALYSIS
    const last24HoursActivity = await prisma.user.findMany({
      where: {
        lastSeenAt: { gte: last24Hours },
      },
      select: {
        lastSeenAt: true,
      },
    })

    const hourlyActivity = Array(24).fill(0)
    last24HoursActivity.forEach(user => {
      if (user.lastSeenAt) {
        const hour = user.lastSeenAt.getHours()
        hourlyActivity[hour]++
      }
    })

    const peakHourData = hourlyActivity.map((count, hour) => ({
      hour: `${hour}:00`,
      users: count,
    }))

    // 13. GROWTH METRICS
    const lastMonthUsers = await prisma.user.count({
      where: { createdAt: { lt: last30Days } },
    })

    const thisMonthNewUsers = await prisma.user.count({
      where: { createdAt: { gte: last30Days } },
    })

    const growthRate = lastMonthUsers > 0
      ? ((thisMonthNewUsers / lastMonthUsers) * 100).toFixed(1)
      : 100

    return NextResponse.json({
      overview: {
        totalUsers,
        totalListings,
        totalMessages,
        totalReports,
        onlineUsers,
        openListings,
        pendingReports,
      },
      today: {
        newUsers: todayNewUsers,
        activeUsers: todayActiveUsers,
        logins: todayLogins,
        listings: todayListings,
        messages: todayMessages,
        reports: todayReports,
      },
      trends: {
        dailyActiveUsers: dailyActiveUsersTrend,
        registrations: registrationsTrend,
        peakHours: peakHourData,
      },
      engagement: {
        avgSessionDuration: Math.round(avgSessionDuration),
        aimTrainerPlays: totalAimTrainerScores,
        applications: totalApplications,
        ratings: totalRatings,
        listingsByType: listingsByType.map(l => ({
          type: l.listingType,
          count: l._count,
        })),
      },
      users: {
        mostActive: mostActiveUsers,
        retentionRate: parseFloat(retentionRate as string),
        growthRate: parseFloat(growthRate as string),
      },
    })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
