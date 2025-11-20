import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addNPoints } from "@/lib/npoints"

// Wheel prizes with probabilities
const WHEEL_PRIZES = [
  { nPoints: 10, probability: 30, color: '#94a3b8' },    // 30% - Gray
  { nPoints: 25, probability: 25, color: '#3b82f6' },    // 25% - Blue
  { nPoints: 50, probability: 20, color: '#10b981' },    // 20% - Green
  { nPoints: 100, probability: 15, color: '#8b5cf6' },   // 15% - Purple
  { nPoints: 250, probability: 7, color: '#f59e0b' },    // 7% - Orange
  { nPoints: 500, probability: 2.5, color: '#ef4444' },  // 2.5% - Red
  { nPoints: 1000, probability: 0.5, color: '#eab308' }, // 0.5% - Gold
]

const SPIN_COST = 0 // Free spins (can be changed to cost N-Points)
const DAILY_FREE_SPINS = 3
const COOLDOWN_HOURS = 8 // 8 hours between free spins

function selectPrize(): { nPoints: number; color: string } {
  const random = Math.random() * 100
  let cumulative = 0

  for (const prize of WHEEL_PRIZES) {
    cumulative += prize.probability
    if (random <= cumulative) {
      return { nPoints: prize.nPoints, color: prize.color }
    }
  }

  // Fallback (shouldn't happen)
  return { nPoints: 10, color: '#94a3b8' }
}

// GET /api/wheel - Get wheel status and spin history
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    // Get today's spins
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaySpins = await prisma.wheelSpin.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get last spin time
    const lastSpin = await prisma.wheelSpin.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate cooldown
    let canSpin = true
    let nextSpinAt = null

    if (lastSpin) {
      const timeSinceLastSpin = Date.now() - lastSpin.createdAt.getTime()
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000

      if (timeSinceLastSpin < cooldownMs) {
        canSpin = false
        nextSpinAt = new Date(lastSpin.createdAt.getTime() + cooldownMs)
      }
    }

    // Get spin history (last 10)
    const spinHistory = await prisma.wheelSpin.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      nPointsBalance: profile?.nPoints || 0,
      canSpin,
      nextSpinAt,
      spinsToday: todaySpins.length,
      dailyLimit: DAILY_FREE_SPINS,
      spinCost: SPIN_COST,
      cooldownHours: COOLDOWN_HOURS,
      prizes: WHEEL_PRIZES,
      spinHistory,
    })
  } catch (error) {
    console.error("Get wheel status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/wheel - Spin the wheel
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get last spin
    const lastSpin = await prisma.wheelSpin.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Check cooldown
    if (lastSpin) {
      const timeSinceLastSpin = Date.now() - lastSpin.createdAt.getTime()
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000

      if (timeSinceLastSpin < cooldownMs) {
        const minutesLeft = Math.ceil((cooldownMs - timeSinceLastSpin) / 60000)
        return NextResponse.json(
          { error: `Please wait ${minutesLeft} minutes before spinning again` },
          { status: 429 }
        )
      }
    }

    // Select prize
    const prize = selectPrize()

    // Create spin record and add N-Points
    const spin = await prisma.$transaction(async (tx) => {
      // Create spin record
      const newSpin = await tx.wheelSpin.create({
        data: {
          userId: session.user.id,
          nPointsWon: prize.nPoints,
          cost: SPIN_COST,
        },
      })

      // Add N-Points
      await tx.playerProfile.update({
        where: { userId: session.user.id },
        data: {
          nPoints: {
            increment: prize.nPoints,
          },
        },
      })

      // Create transaction log
      await tx.nPointsTransaction.create({
        data: {
          userId: session.user.id,
          amount: prize.nPoints,
          type: 'EARN_WHEEL',
          description: `Lucky Wheel: Won ${prize.nPoints} N-Points`,
          reference: newSpin.id,
        },
      })

      return newSpin
    })

    // Get updated balance
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    console.log(`🎡 User ${session.user.id} won ${prize.nPoints} N-Points from wheel!`)

    return NextResponse.json({
      success: true,
      spin,
      prize: {
        nPoints: prize.nPoints,
        color: prize.color,
      },
      newBalance: profile?.nPoints || 0,
    })
  } catch (error) {
    console.error("Wheel spin error:", error)
    return NextResponse.json(
      { error: "Failed to spin wheel. Please try again." },
      { status: 500 }
    )
  }
}
