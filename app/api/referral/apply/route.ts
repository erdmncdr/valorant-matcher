import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addNPoints } from "@/lib/npoints"
import { z } from "zod"

const REFERRAL_BONUS = 100 // 100 NP for new users who use a referral code
const MAX_BONUS_REFERRALS = 5 // Only first 5 referrals get the bonus

const applySchema = z.object({
  referralCode: z.string().min(1, "Referral code is required"),
})

// POST /api/referral/apply - Apply a referral code
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { referralCode } = applySchema.parse(body)

    // Get user's profile
    const userProfile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Check if user already has a referrer
    if (userProfile.referredByUserId) {
      return NextResponse.json(
        { error: "Zaten bir referans kodu kullandınız." },
        { status: 400 }
      )
    }

    // Find the referrer by their referral code
    const referrerProfile = await prisma.playerProfile.findUnique({
      where: { referralCode },
      include: {
        user: true,
      },
    })

    if (!referrerProfile) {
      return NextResponse.json(
        { error: "Geçersiz referans kodu." },
        { status: 400 }
      )
    }

    // Prevent self-referral
    if (referrerProfile.userId === session.user.id) {
      return NextResponse.json(
        { error: "Kendi referans kodunuzu kullanamazsınız." },
        { status: 400 }
      )
    }

    // Check how many people have already used this referral code
    const existingReferralsCount = await prisma.playerProfile.count({
      where: {
        referredByUserId: referrerProfile.userId,
      },
    })

    // Apply the referral code
    await prisma.playerProfile.update({
      where: { id: userProfile.id },
      data: {
        referredByUserId: referrerProfile.userId,
      },
    })

    // Only give bonus if this is one of the first 5 referrals
    const getsBonus = existingReferralsCount < MAX_BONUS_REFERRALS

    if (getsBonus) {
      // Give the new user their referral bonus (skip referral commission for this)
      await addNPoints(
        session.user.id,
        REFERRAL_BONUS,
        "EARN_REFERRAL_BONUS",
        `Referans kodu bonusu (${referrerProfile.nickname} tarafından davet edildi)`,
        undefined,
        true // Skip referral commission for the bonus itself
      )
    }

    return NextResponse.json({
      success: true,
      bonus: getsBonus ? REFERRAL_BONUS : 0,
      referrerNickname: referrerProfile.nickname,
      getsBonus,
      referralPosition: existingReferralsCount + 1,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Apply referral code error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
