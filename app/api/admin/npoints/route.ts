import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addNPoints, deductNPoints } from "@/lib/npoints"

// GET /api/admin/npoints - Get all transactions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        user: {
          select: { isAdmin: true }
        }
      }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const userId = searchParams.get("userId")

    // Get transactions
    const transactions = await prisma.nPointsTransaction.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get overall stats
    const totalEarned = await prisma.nPointsTransaction.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true },
    })

    const totalSpent = await prisma.nPointsTransaction.aggregate({
      where: { amount: { lt: 0 } },
      _sum: { amount: true },
    })

    const totalPlayers = await prisma.playerProfile.count()

    const totalNPointsInCirculation = await prisma.playerProfile.aggregate({
      _sum: { nPoints: true },
    })

    return NextResponse.json({
      transactions,
      stats: {
        totalEarned: totalEarned._sum.amount || 0,
        totalSpent: Math.abs(totalSpent._sum.amount || 0),
        totalPlayers,
        totalNPointsInCirculation: totalNPointsInCirculation._sum.nPoints || 0,
      }
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/npoints - Grant or deduct N-Points
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        user: {
          select: { isAdmin: true }
        }
      }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, amount, reason } = await req.json()

    if (!userId || amount === undefined || amount === 0) {
      return NextResponse.json(
        { error: "userId and non-zero amount required" },
        { status: 400 }
      )
    }

    // Get target user
    const targetProfile = await prisma.playerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            playerProfile: {
              select: { nickname: true, tagline: true }
            }
          }
        }
      }
    })

    if (!targetProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Add or deduct points
    if (amount > 0) {
      await addNPoints(
        userId,
        amount,
        'ADMIN_GRANT',
        reason || `Admin granted ${amount} N-Points`
      )
    } else {
      await deductNPoints(
        userId,
        Math.abs(amount),
        'ADMIN_REMOVE',
        reason || `Admin removed ${Math.abs(amount)} N-Points`
      )
    }

    // Get updated profile
    const updatedProfile = await prisma.playerProfile.findUnique({
      where: { userId },
      select: { nPoints: true }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully ${amount > 0 ? 'granted' : 'removed'} ${Math.abs(amount)} N-Points`,
      newBalance: updatedProfile?.nPoints || 0,
    })
  } catch (error: any) {
    console.error("Grant/deduct N-Points error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process N-Points" },
      { status: 500 }
    )
  }
}
