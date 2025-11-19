import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET user profile with reputation
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = params.id

    // Get user with profile and ratings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        playerProfile: {
          include: {
            playerAgents: true,
          },
        },
        ratingsReceived: {
          include: {
            rater: {
              select: {
                id: true,
                playerProfile: {
                  select: {
                    nickname: true,
                    tagline: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50, // Last 50 ratings
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Calculate reputation stats
    const positiveRatings = user.ratingsReceived.filter((r: any) => r.score === 1).length
    const negativeRatings = user.ratingsReceived.filter((r: any) => r.score === -1).length
    const totalRatings = user.ratingsReceived.length

    // Calculate tag frequency
    const tagFrequency: { [key: string]: number } = {}
    user.ratingsReceived.forEach((rating: any) => {
      rating.tags.forEach((tag: any) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
      })
    })

    // Get top tags (sorted by frequency)
    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
        lastSeenAt: user.lastSeenAt,
        playerProfile: user.playerProfile,
        reputation: {
          positive: positiveRatings,
          negative: negativeRatings,
          total: totalRatings,
          topTags,
        },
        recentRatings: user.ratingsReceived.slice(0, 10).map((rating: any) => ({
          id: rating.id,
          score: rating.score,
          tags: rating.tags,
          comment: rating.comment,
          createdAt: rating.createdAt,
          rater: rating.rater.playerProfile ? {
            nickname: rating.rater.playerProfile.nickname,
            tagline: rating.rater.playerProfile.tagline,
          } : null,
        })),
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
