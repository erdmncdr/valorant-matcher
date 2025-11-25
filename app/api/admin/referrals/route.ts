import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/referrals - Get referral statistics (admin only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    // Get all users with referral data
    const profiles = await prisma.playerProfile.findMany({
      select: {
        id: true,
        userId: true,
        nickname: true,
        tagline: true,
        referralCode: true,
        referralBalance: true,
        nPoints: true,
        createdAt: true,
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
        _count: {
          select: {
            referredUsers: true, // Count of people who used this user's referral code
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get referral earnings for each profile
    const profilesWithEarnings = await Promise.all(
      profiles.map(async (profile) => {
        const totalEarnings = await prisma.referralEarning.aggregate({
          where: {
            referrerProfileId: profile.id,
          },
          _sum: {
            earnedAmount: true,
          },
        })

        // Get transactions to calculate 50 NP bonuses received
        const referrerBonuses = await prisma.nPointsTransaction.aggregate({
          where: {
            userId: profile.userId,
            type: "EARN_REFERRAL_REWARD",
          },
          _sum: {
            amount: true,
          },
          _count: true,
        })

        return {
          ...profile,
          referredByNickname: profile.referredByUser?.playerProfile?.nickname || null,
          referredCount: profile._count.referredUsers,
          totalCommissionEarned: totalEarnings._sum.earnedAmount || 0,
          referrerBonusesReceived: referrerBonuses._sum.amount || 0,
          referrerBonusCount: referrerBonuses._count || 0,
        }
      })
    )

    // Calculate overall stats
    const totalUsers = profiles.length
    const usersWithReferrals = profiles.filter((p) => p._count.referredUsers > 0).length
    const totalReferralConnections = profiles.filter((p) => p.referredByUserId).length

    const totalCommission = profilesWithEarnings.reduce(
      (sum, p) => sum + p.totalCommissionEarned,
      0
    )

    const totalReferrerBonuses = profilesWithEarnings.reduce(
      (sum, p) => sum + p.referrerBonusesReceived,
      0
    )

    const totalPiggyBankBalance = profiles.reduce(
      (sum, p) => sum + p.referralBalance,
      0
    )

    // Recent referral activity
    const recentReferrals = await prisma.playerProfile.findMany({
      where: {
        referredByUserId: {
          not: null,
        },
      },
      select: {
        nickname: true,
        createdAt: true,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        usersWithReferrals,
        totalReferralConnections,
        totalCommission,
        totalReferrerBonuses,
        totalPiggyBankBalance,
      },
      profiles: profilesWithEarnings,
      recentActivity: recentReferrals.map((r) => ({
        newUser: r.nickname,
        referrer: r.referredByUser?.playerProfile?.nickname || "Unknown",
        date: r.createdAt,
      })),
    })
  } catch (error) {
    console.error("Admin referrals error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
