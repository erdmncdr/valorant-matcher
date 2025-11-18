import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        reputationScore: {
          gt: 0, // Only show players with reputation
        },
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

    return NextResponse.json({ topPlayers, count: topPlayers.length }, { status: 200 })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
}
