import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to get the end of current week (Sunday 23:59:59)
function getWeekEndDate(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + daysUntilSunday)
  weekEnd.setHours(23, 59, 59, 999)

  return weekEnd
}

// GET leaderboard - top players by reputation score
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    const topPlayers = await prisma.playerProfile.findMany({
      where: {
        user: {
          isBanned: false,
        },
      },
      select: {
        id: true,
        nickname: true,
        tagline: true,
        rankCurrent: true,
        rankPeak: true,
        mainRole: true,
        reputationScore: true,
        userId: true,
        user: {
          select: {
            id: true,
            isAdmin: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: {
        reputationScore: "desc",
      },
      take: limit,
    })

    // Calculate week end date for countdown
    const weekEndDate = getWeekEndDate()

    return NextResponse.json({
      topPlayers,
      count: topPlayers.length,
      weekEndDate: weekEndDate.toISOString(),
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
}
