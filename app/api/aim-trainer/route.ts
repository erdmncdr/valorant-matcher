import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const scoreSchema = z.object({
  score: z.number().min(0),
  accuracy: z.number().min(0).max(100),
  timeElapsed: z.number().min(0),
  targetsHit: z.number().min(0),
  targetsMissed: z.number().min(0),
})

// POST /api/aim-trainer - Save score
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = scoreSchema.parse(body)

    // Check if user already claimed reward today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayScore = await prisma.aimTrainerScore.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
        rewardClaimed: true,
      },
    })

    const canClaimReward = !todayScore && data.score >= 100
    let reputationAdded = 0

    // Save score
    const score = await prisma.aimTrainerScore.create({
      data: {
        userId: session.user.id,
        score: data.score,
        accuracy: data.accuracy,
        timeElapsed: data.timeElapsed,
        targetsHit: data.targetsHit,
        targetsMissed: data.targetsMissed,
        rewardClaimed: canClaimReward,
      },
    })

    // If eligible for reward, add reputation
    if (canClaimReward) {
      await prisma.playerProfile.update({
        where: { userId: session.user.id },
        data: {
          reputationScore: {
            increment: 1,
          },
        },
      })
      reputationAdded = 1
    }

    return NextResponse.json({
      score,
      rewardClaimed: canClaimReward,
      reputationAdded,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Save aim trainer score error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/aim-trainer - Get leaderboard and user stats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get today's best scores (leaderboard) - one per user
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all today's scores grouped by user, selecting max score
    const todayScores = await prisma.aimTrainerScore.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      include: {
        user: {
          select: {
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
        score: "desc",
      },
    })

    // Group by user and keep only best score per user
    const userBestScores = new Map()
    todayScores.forEach(score => {
      const existing = userBestScores.get(score.userId)
      if (!existing || score.score > existing.score) {
        userBestScores.set(score.userId, score)
      }
    })

    const leaderboard = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Get user's personal best
    const userBest = await prisma.aimTrainerScore.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        score: "desc",
      },
    })

    // Check if user can claim reward today
    const todayReward = await prisma.aimTrainerScore.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
        rewardClaimed: true,
      },
    })

    return NextResponse.json({
      leaderboard,
      userBest,
      canClaimReward: !todayReward,
    })
  } catch (error) {
    console.error("Get aim trainer stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
