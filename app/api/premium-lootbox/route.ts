import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addNPoints, deductNPoints } from "@/lib/npoints"

// Premium Lootbox Configuration
const PREMIUM_LOOTBOX_COST = 100 // N-Points cost to open

const PREMIUM_REWARDS = [
  // Mavi (Common) - 50% toplam
  { nPoints: 10, probability: 25, color: '#3b82f6', rarity: 'common' },
  { nPoints: 25, probability: 15, color: '#3b82f6', rarity: 'common' },
  { nPoints: 50, probability: 10, color: '#3b82f6', rarity: 'common' },

  // Yeşil (Uncommon) - 30% toplam
  { nPoints: 75, probability: 12, color: '#10b981', rarity: 'uncommon' },
  { nPoints: 100, probability: 10, color: '#10b981', rarity: 'uncommon' },
  { nPoints: 125, probability: 8, color: '#10b981', rarity: 'uncommon' },

  // Pembe (Rare) - 10% toplam
  { nPoints: 150, probability: 6, color: '#ec4899', rarity: 'rare' },
  { nPoints: 200, probability: 4, color: '#ec4899', rarity: 'rare' },

  // Mor (Epic) - 6% toplam
  { nPoints: 250, probability: 4, color: '#8b5cf6', rarity: 'epic' },
  { nPoints: 500, probability: 2, color: '#8b5cf6', rarity: 'epic' },

  // Kırmızı (Legendary) - 3% toplam
  { nPoints: 750, probability: 2, color: '#ef4444', rarity: 'legendary' },
  { nPoints: 1000, probability: 1, color: '#ef4444', rarity: 'legendary' },

  // Sarı (Mythic/Efsanevi) - 1% (çok nadir)
  { nPoints: 10000, probability: 1, color: '#fbbf24', rarity: 'mythic' },
]

function selectReward(): { nPoints: number; color: string; rarity: string } {
  const random = Math.random() * 100
  let cumulative = 0

  for (const reward of PREMIUM_REWARDS) {
    cumulative += reward.probability
    if (random <= cumulative) {
      return {
        nPoints: reward.nPoints,
        color: reward.color,
        rarity: reward.rarity
      }
    }
  }

  // Fallback to lowest reward
  return { nPoints: 10, color: '#3b82f6', rarity: 'common' }
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
