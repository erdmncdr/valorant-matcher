import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET online users (users active in last 5 minutes)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get("sortBy") || "lastSeen" // "lastSeen" or "reputation"

    // Consider users online if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const onlineUsers = await prisma.user.findMany({
      where: {
        lastSeenAt: {
          gte: fiveMinutesAgo,
        },
        isBanned: false,
      },
      select: {
        id: true,
        isAdmin: true,
        lastSeenAt: true,
        playerProfile: {
          select: {
            nickname: true,
            tagline: true,
            rankCurrent: true,
            mainRole: true,
            reputationScore: true,
          },
        },
      },
      orderBy: { lastSeenAt: "desc" },
      take: 50, // Limit to 50 online users
    })

    // Filter out users without profiles
    const usersWithProfiles = onlineUsers.filter((user: any) => user.playerProfile !== null)

    return NextResponse.json({
      onlineUsers: usersWithProfiles,
      count: usersWithProfiles.length
    })
  } catch (error) {
    console.error("Get online users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
