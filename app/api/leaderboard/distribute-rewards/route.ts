import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addNPoints, getLeaderboardRewards } from "@/lib/npoints"

/**
 * POST /api/leaderboard/distribute-rewards
 * Distributes daily rewards to top 3 players
 *
 * This endpoint should be called by a cron job once per day
 * You can set up a cron job using services like:
 * - Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
 * - GitHub Actions
 * - External cron service (cron-job.org, etc.)
 *
 * Example cron expression for daily at midnight UTC: 0 0 * * *
 */
export async function POST(req: Request) {
  try {
    // Verify request is authorized (you can add a secret token check here)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-this'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      )
    }

    // Get today's date (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get yesterday's date (end of day)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 999)

    // Check if rewards were already distributed today
    const existingRewards = await prisma.leaderboardReward.findFirst({
      where: {
        period: 'DAILY',
        periodEnd: {
          gte: today,
        },
      },
    })

    if (existingRewards) {
      return NextResponse.json({
        message: "Rewards already distributed today",
        alreadyDistributed: true,
      })
    }

    // Get top 10 players by reputation score
    const topPlayers = await prisma.playerProfile.findMany({
      where: {
        user: {
          isBanned: false,
        },
        reputationScore: {
          gt: 0, // Only players with positive reputation
        },
      },
      select: {
        userId: true,
        nickname: true,
        tagline: true,
        reputationScore: true,
      },
      orderBy: {
        reputationScore: 'desc',
      },
      take: 10,
    })

    if (topPlayers.length === 0) {
      return NextResponse.json({
        message: "No eligible players for rewards",
        playersRewarded: 0,
      })
    }

    const rewards = getLeaderboardRewards()
    const rewardedPlayers = []

    // Distribute rewards to top 10
    for (let i = 0; i < topPlayers.length && i < 10; i++) {
      const player = topPlayers[i]
      const rank = i + 1
      const nPointsWon = rewards[rank]

      if (!nPointsWon) continue // Skip if no reward defined for this rank

      try {
        // Create reward in transaction
        await prisma.$transaction(async (tx) => {
          // Add N-Points to player
          await tx.playerProfile.update({
            where: { userId: player.userId },
            data: {
              nPoints: {
                increment: nPointsWon,
              },
            },
          })

          // Create transaction log
          await tx.nPointsTransaction.create({
            data: {
              userId: player.userId,
              amount: nPointsWon,
              type: 'EARN_LEADERBOARD',
              description: `Daily Leaderboard Reward - Rank #${rank}`,
            },
          })

          // Create leaderboard reward record
          await tx.leaderboardReward.create({
            data: {
              userId: player.userId,
              period: 'DAILY',
              rank,
              nPointsWon,
              periodEnd: today,
            },
          })
        })

        rewardedPlayers.push({
          rank,
          userId: player.userId,
          nickname: player.nickname,
          tagline: player.tagline,
          reputationScore: player.reputationScore,
          nPointsWon,
        })

        console.log(`✅ Awarded ${nPointsWon} N-Points to ${player.nickname}${player.tagline} (Rank #${rank})`)
      } catch (error) {
        console.error(`❌ Failed to reward player ${player.nickname}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Distributed rewards to ${rewardedPlayers.length} players`,
      date: today.toISOString(),
      playersRewarded: rewardedPlayers.length,
      rewards: rewardedPlayers,
    })
  } catch (error) {
    console.error("Leaderboard reward distribution error:", error)
    return NextResponse.json(
      { error: "Failed to distribute rewards" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leaderboard/distribute-rewards
 * Returns information about the last reward distribution
 */
export async function GET(req: Request) {
  try {
    // Get most recent reward distribution
    const lastRewards = await prisma.leaderboardReward.findMany({
      where: {
        period: 'DAILY',
      },
      include: {
        user: {
          select: {
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
                reputationScore: true,
              },
            },
          },
        },
      },
      orderBy: {
        periodEnd: 'desc',
      },
      take: 3,
    })

    if (lastRewards.length === 0) {
      return NextResponse.json({
        message: "No rewards distributed yet",
        lastDistribution: null,
      })
    }

    return NextResponse.json({
      lastDistribution: lastRewards[0].periodEnd,
      rewards: lastRewards.map(r => ({
        rank: r.rank,
        nickname: r.user.playerProfile?.nickname,
        tagline: r.user.playerProfile?.tagline,
        nPointsWon: r.nPointsWon,
        distributedAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching reward distribution info:", error)
    return NextResponse.json(
      { error: "Failed to fetch distribution info" },
      { status: 500 }
    )
  }
}
