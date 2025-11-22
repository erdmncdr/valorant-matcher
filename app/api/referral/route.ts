import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addNPoints } from "@/lib/npoints"

const MIN_WITHDRAWAL_AMOUNT = 100

// GET /api/referral - Get referral info, stats, and piggy bank balance
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with referral data
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        referralCode: true,
        referralBalance: true,
        referredByUserId: true,
        referredByUser: {
          select: {
            playerProfile: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Get count of users referred by this user
    const referredUsersCount = await prisma.playerProfile.count({
      where: {
        referredByUserId: session.user.id,
      },
    })

    // Get recent referral earnings
    const recentEarnings = await prisma.referralEarning.findMany({
      where: {
        referrerProfileId: profile.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        sourceAmount: true,
        earnedAmount: true,
        transactionType: true,
        description: true,
        createdAt: true,
      },
    })

    // Get total earnings ever
    const totalEarnings = await prisma.referralEarning.aggregate({
      where: {
        referrerProfileId: profile.id,
      },
      _sum: {
        earnedAmount: true,
      },
    })

    // Get referred users with their nicknames and total earned from them
    const referredUsers = await prisma.playerProfile.findMany({
      where: {
        referredByUserId: session.user.id,
      },
      select: {
        userId: true,
        nickname: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    // Get earning totals per referred user
    const earningsPerUser = await prisma.referralEarning.groupBy({
      by: ["referredUserId"],
      where: {
        referrerProfileId: profile.id,
      },
      _sum: {
        earnedAmount: true,
      },
    })

    const earningsMap = new Map(
      earningsPerUser.map((e) => [e.referredUserId, e._sum.earnedAmount || 0])
    )

    const referredUsersWithEarnings = referredUsers.map((user) => ({
      ...user,
      totalEarned: earningsMap.get(user.userId) || 0,
    }))

    return NextResponse.json({
      referralCode: profile.referralCode,
      piggyBankBalance: profile.referralBalance,
      minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
      canWithdraw: profile.referralBalance >= MIN_WITHDRAWAL_AMOUNT,
      referredUsersCount,
      totalEarnings: totalEarnings._sum.earnedAmount || 0,
      referredBy: profile.referredByUser?.playerProfile?.nickname || null,
      recentEarnings,
      referredUsers: referredUsersWithEarnings,
    })
  } catch (error) {
    console.error("Get referral info error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/referral - Withdraw from piggy bank
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (action === "withdraw") {
      // Get user profile
      const profile = await prisma.playerProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        )
      }

      if (profile.referralBalance < MIN_WITHDRAWAL_AMOUNT) {
        return NextResponse.json(
          {
            error: `Minimum çekim miktarı ${MIN_WITHDRAWAL_AMOUNT} NP'dir. Kumbaranızda ${profile.referralBalance} NP var.`,
          },
          { status: 400 }
        )
      }

      const withdrawAmount = profile.referralBalance

      // Transfer from piggy bank to main balance
      await prisma.$transaction(async (tx) => {
        // Deduct from piggy bank
        await tx.playerProfile.update({
          where: { id: profile.id },
          data: {
            referralBalance: 0,
          },
        })

        // Add to main balance
        await tx.playerProfile.update({
          where: { id: profile.id },
          data: {
            nPoints: {
              increment: withdrawAmount,
            },
          },
        })

        // Create transaction record
        await tx.nPointsTransaction.create({
          data: {
            userId: session.user.id,
            amount: withdrawAmount,
            type: "EARN_REFERRAL_WITHDRAW",
            description: `Referans kumbarasından çekim`,
          },
        })
      })

      // Get updated profile
      const updatedProfile = await prisma.playerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          nPoints: true,
          referralBalance: true,
        },
      })

      return NextResponse.json({
        success: true,
        withdrawnAmount: withdrawAmount,
        newBalance: updatedProfile?.nPoints || 0,
        newPiggyBankBalance: updatedProfile?.referralBalance || 0,
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Referral action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
