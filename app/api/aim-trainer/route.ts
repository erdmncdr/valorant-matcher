import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { aimTrainerRateLimiter } from "@/lib/rate-limit"
import { addNPoints, calculateAimTrainerReward } from "@/lib/npoints"

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

    // Rate limiting: 10 attempts per 10 minutes
    const { success, reset } = await aimTrainerRateLimiter.limit(session.user.id)
    if (!success) {
      const minutesLeft = Math.ceil((reset - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Çok fazla deneme yaptınız. ${minutesLeft} dakika sonra tekrar deneyin.`,
          resetAt: new Date(reset).toISOString()
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    console.log('Received score data:', body)

    const data = scoreSchema.parse(body)
    console.log('Validated score data:', data)

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
    let nPointsAdded = 0

    console.log('Can claim reward:', canClaimReward, 'Score:', data.score, 'Already claimed today:', !!todayScore)

    // Calculate N-Points reward based on performance (always awarded)
    const nPointsReward = calculateAimTrainerReward(data.score, data.accuracy)

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

    console.log('Score saved:', score.id, 'Accuracy:', score.accuracy)

    // Award N-Points based on performance (always)
    if (nPointsReward > 0) {
      await addNPoints(
        session.user.id,
        nPointsReward,
        'EARN_AIM_TRAINER',
        `Aim Trainer: ${data.score} points, ${data.accuracy.toFixed(1)}% accuracy`,
        score.id
      )
      nPointsAdded = nPointsReward
      console.log('N-Points added:', nPointsReward)
    }

    // If eligible for daily reward, add reputation
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
      console.log('Daily reputation added: +1')
    }

    return NextResponse.json({
      score,
      rewardClaimed: canClaimReward,
      reputationAdded,
      nPointsAdded,
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
    todayScores.forEach((score: any) => {
      const existing = userBestScores.get(score.userId)
      if (!existing || score.score > existing.score) {
        userBestScores.set(score.userId, score)
      }
    })

    const leaderboard = Array.from(userBestScores.values())
      .sort((a: any, b: any) => b.score - a.score)
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
      lastRewardTime: todayReward?.createdAt || null,
    })
  } catch (error) {
    console.error("Get aim trainer stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
