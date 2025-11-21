import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lootbox rewards with probabilities
const LOOTBOX_REWARDS = [
  { nPoints: 5, probability: 30, color: '#94a3b8' },     // 30% - Common
  { nPoints: 10, probability: 25, color: '#3b82f6' },    // 25% - Common
  { nPoints: 15, probability: 20, color: '#10b981' },    // 20% - Uncommon
  { nPoints: 20, probability: 15, color: '#8b5cf6' },    // 15% - Uncommon
  { nPoints: 50, probability: 5, color: '#f59e0b' },     // 5% - Rare
  { nPoints: 70, probability: 3, color: '#ef4444' },     // 3% - Epic
  { nPoints: 80, probability: 1.5, color: '#ec4899' },   // 1.5% - Epic
  { nPoints: 90, probability: 0.4, color: '#eab308' },   // 0.4% - Legendary
  { nPoints: 100, probability: 0.1, color: '#fbbf24' },  // 0.1% - Legendary
]

function selectReward(): { nPoints: number; color: string } {
  const random = Math.random() * 100
  let cumulative = 0

  for (const reward of LOOTBOX_REWARDS) {
    cumulative += reward.probability
    if (random <= cumulative) {
      return { nPoints: reward.nPoints, color: reward.color }
    }
  }

  // Fallback (shouldn't happen)
  return { nPoints: 5, color: '#94a3b8' }
}

// GET /api/lootbox - Get lootbox status
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile for N-Points balance
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    // Get today's lootboxes
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayLootboxes = await prisma.dailyLootbox.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get last 10 lootboxes for history
    const lootboxHistory = await prisma.dailyLootbox.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const canOpen = todayLootboxes.length === 0

    return NextResponse.json({
      nPointsBalance: profile?.nPoints || 0,
      canOpen,
      openedToday: todayLootboxes.length > 0,
      rewards: LOOTBOX_REWARDS,
      lootboxHistory,
    })
  } catch (error) {
    console.error("Get lootbox status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/lootbox - Open daily lootbox
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already opened today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayLootboxes = await prisma.dailyLootbox.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
    })

    if (todayLootboxes.length > 0) {
      return NextResponse.json(
        { error: "You have already opened your daily lootbox today!" },
        { status: 429 }
      )
    }

    // Select reward
    const reward = selectReward()

    // Create lootbox record and add N-Points
    const lootbox = await prisma.$transaction(async (tx) => {
      // Create lootbox record
      const newLootbox = await tx.dailyLootbox.create({
        data: {
          userId: session.user.id,
          nPointsWon: reward.nPoints,
        },
      })

      // Add N-Points
      await tx.playerProfile.update({
        where: { userId: session.user.id },
        data: {
          nPoints: {
            increment: reward.nPoints,
          },
        },
      })

      // Create transaction log
      await tx.nPointsTransaction.create({
        data: {
          userId: session.user.id,
          amount: reward.nPoints,
          type: 'EARN_LOOTBOX',
          description: `Daily Lootbox: Won ${reward.nPoints} N-Points`,
          reference: newLootbox.id,
        },
      })

      return newLootbox
    })

    // Get updated balance
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    console.log(`🎁 User ${session.user.id} won ${reward.nPoints} N-Points from lootbox!`)

    return NextResponse.json({
      success: true,
      lootbox,
      reward: {
        nPoints: reward.nPoints,
        color: reward.color,
      },
      newBalance: profile?.nPoints || 0,
    })
  } catch (error) {
    console.error("Lootbox open error:", error)
    return NextResponse.json(
      { error: "Failed to open lootbox. Please try again." },
      { status: 500 }
    )
  }
}
