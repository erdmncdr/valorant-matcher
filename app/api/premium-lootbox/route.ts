import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addNPoints, deductNPoints } from "@/lib/npoints"

// Premium Lootbox Configuration
const PREMIUM_LOOTBOX_COST = 100 // N-Points cost to open

const PREMIUM_REWARDS = [
  { nPoints: 50, probability: 25, color: '#94a3b8' },    // Common - 25%
  { nPoints: 75, probability: 20, color: '#3b82f6' },    // Common - 20%
  { nPoints: 100, probability: 18, color: '#10b981' },   // Uncommon - 18%
  { nPoints: 150, probability: 15, color: '#8b5cf6' },   // Uncommon - 15%
  { nPoints: 200, probability: 10, color: '#f59e0b' },   // Rare - 10%
  { nPoints: 250, probability: 6, color: '#ef4444' },    // Rare - 6%
  { nPoints: 300, probability: 3, color: '#ec4899' },    // Epic - 3%
  { nPoints: 400, probability: 2, color: '#eab308' },    // Epic - 2%
  { nPoints: 500, probability: 1, color: '#fbbf24' },    // Legendary - 1%
]

function selectReward(): { nPoints: number; color: string } {
  const random = Math.random() * 100
  let cumulative = 0

  for (const reward of PREMIUM_REWARDS) {
    cumulative += reward.probability
    if (random <= cumulative) {
      return { nPoints: reward.nPoints, color: reward.color }
    }
  }

  // Fallback to lowest reward
  return { nPoints: 50, color: '#94a3b8' }
}

// GET /api/premium-lootbox - Get premium lootbox info
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's N-Points balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        playerProfile: {
          select: {
            nPoints: true,
          },
        },
      },
    })

    const nPointsBalance = user?.playerProfile?.nPoints || 0

    // Get recent premium lootbox openings (last 20)
    const lootboxHistory = await prisma.premiumLootbox.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get total stats
    const totalOpened = await prisma.premiumLootbox.count({
      where: { userId: session.user.id },
    })

    const totalSpent = await prisma.premiumLootbox.aggregate({
      where: { userId: session.user.id },
      _sum: { costPaid: true },
    })

    const totalWon = await prisma.premiumLootbox.aggregate({
      where: { userId: session.user.id },
      _sum: { nPointsWon: true },
    })

    return NextResponse.json({
      cost: PREMIUM_LOOTBOX_COST,
      rewards: PREMIUM_REWARDS,
      nPointsBalance,
      canOpen: nPointsBalance >= PREMIUM_LOOTBOX_COST,
      lootboxHistory,
      stats: {
        totalOpened,
        totalSpent: totalSpent._sum.costPaid || 0,
        totalWon: totalWon._sum.nPointsWon || 0,
        netProfit: (totalWon._sum.nPointsWon || 0) - (totalSpent._sum.costPaid || 0),
      },
    })
  } catch (error) {
    console.error("Get premium lootbox error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/premium-lootbox - Open a premium lootbox
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's current N-Points balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        playerProfile: {
          select: {
            nPoints: true,
          },
        },
      },
    })

    const currentBalance = user?.playerProfile?.nPoints || 0

    // Check if user has enough N-Points
    if (currentBalance < PREMIUM_LOOTBOX_COST) {
      return NextResponse.json(
        {
          error: "Yetersiz N-Points",
          required: PREMIUM_LOOTBOX_COST,
          current: currentBalance,
        },
        { status: 400 }
      )
    }

    // Select random reward
    const reward = selectReward()

    // Deduct cost from user's balance
    await deductNPoints(
      session.user.id,
      PREMIUM_LOOTBOX_COST,
      'SPEND_PREMIUM_LOOTBOX',
      `Premium Lootbox Açıldı`
    )

    // Add reward to user's balance
    const lootbox = await prisma.premiumLootbox.create({
      data: {
        userId: session.user.id,
        costPaid: PREMIUM_LOOTBOX_COST,
        nPointsWon: reward.nPoints,
      },
    })

    await addNPoints(
      session.user.id,
      reward.nPoints,
      'EARN_PREMIUM_LOOTBOX',
      `Premium Lootbox Ödülü: ${reward.nPoints} N-Points`,
      lootbox.id
    )

    // Get updated balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        playerProfile: {
          select: {
            nPoints: true,
          },
        },
      },
    })

    const newBalance = updatedUser?.playerProfile?.nPoints || 0

    return NextResponse.json({
      reward,
      newBalance,
      costPaid: PREMIUM_LOOTBOX_COST,
      netGain: reward.nPoints - PREMIUM_LOOTBOX_COST,
    })
  } catch (error: any) {
    console.error("Open premium lootbox error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
