import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/wallet - Get wallet information and transaction history
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

    // Get all transactions for the user
    const transactions = await prisma.nPointsTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Last 100 transactions
    })

    // Calculate stats
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Group by transaction type
    const byType = transactions.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = { count: 0, total: 0 }
      }
      acc[t.type].count++
      acc[t.type].total += t.amount
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentTransactions = transactions.filter(
      t => new Date(t.createdAt) >= sevenDaysAgo
    )

    const recentEarned = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const recentSpent = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return NextResponse.json({
      balance: profile?.nPoints || 0,
      totalEarned,
      totalSpent,
      recentEarned,
      recentSpent,
      transactionCount: transactions.length,
      transactions,
      byType,
    })
  } catch (error) {
    console.error("Get wallet error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
