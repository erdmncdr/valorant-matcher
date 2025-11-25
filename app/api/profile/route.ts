import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ValorantRank, PlayerRole, Seriousness } from "@/lib/types"
import { addNPoints, giveReferrerBonus } from "@/lib/npoints"

const REFERRAL_BONUS = 100 // 100 NP for new users who use a referral code
const MAX_BONUS_REFERRALS = 5 // Only first 5 referrals get the bonus

const profileSchema = z.object({
  nickname: z.string().min(2).max(20),
  tagline: z.string().regex(/^#[A-Z0-9]{3,5}$/i, "Tagline must be in format #1234"),
  region: z.string(),
  rankCurrent: z.nativeEnum(ValorantRank),
  rankPeak: z.nativeEnum(ValorantRank),
  mainRole: z.nativeEnum(PlayerRole),
  languages: z.array(z.string()).min(1),
  mic: z.boolean(),
  seriousness: z.nativeEnum(Seriousness),
  typicalPlaytime: z.string().optional(),
  bio: z.string().max(500).optional(),
  agents: z.array(z.object({
    agentName: z.string(),
    priority: z.enum(["main", "secondary"]),
  })).min(1).max(10),
  referralCode: z.string().optional(), // Optional referral code for new users
})

// GET current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        playerAgents: true,
        user: {
          select: {
            isAdmin: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ profile: null })
    }

    // Add isAdmin to profile object
    const profileWithAdmin = {
      ...profile,
      isAdmin: profile.user.isAdmin,
    }

    return NextResponse.json({ profile: profileWithAdmin })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST create or update profile
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = profileSchema.parse(body)

    // Check if profile already exists
    const existingProfile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.playerProfile.update({
        where: { userId: session.user.id },
        data: {
          nickname: data.nickname,
          tagline: data.tagline,
          region: data.region,
          rankCurrent: data.rankCurrent,
          rankPeak: data.rankPeak,
          mainRole: data.mainRole,
          languages: data.languages,
          mic: data.mic,
          seriousness: data.seriousness,
          typicalPlaytime: data.typicalPlaytime,
          bio: data.bio,
          playerAgents: {
            deleteMany: {},
            create: data.agents,
          },
        },
        include: {
          playerAgents: true,
        },
      })

      return NextResponse.json({ profile: updatedProfile })
    } else {
      // Check for referral code if provided
      let referredByUserId: string | null = null
      let referrerNickname: string | null = null

      if (data.referralCode) {
        const referrerProfile = await prisma.playerProfile.findUnique({
          where: { referralCode: data.referralCode },
        })

        if (referrerProfile && referrerProfile.userId !== session.user.id) {
          referredByUserId = referrerProfile.userId
          referrerNickname = referrerProfile.nickname
        }
      }

      // Create new profile
      const newProfile = await prisma.playerProfile.create({
        data: {
          userId: session.user.id,
          nickname: data.nickname,
          tagline: data.tagline,
          region: data.region,
          rankCurrent: data.rankCurrent,
          rankPeak: data.rankPeak,
          mainRole: data.mainRole,
          languages: data.languages,
          mic: data.mic,
          seriousness: data.seriousness,
          typicalPlaytime: data.typicalPlaytime,
          bio: data.bio,
          referredByUserId: referredByUserId,
          playerAgents: {
            create: data.agents,
          },
        },
        include: {
          playerAgents: true,
        },
      })

      // If there was a valid referral, ALWAYS give the bonus to new user
      if (referredByUserId) {
        try {
          // Give 100 NP to new user
          await addNPoints(
            session.user.id,
            REFERRAL_BONUS,
            "EARN_REFERRAL_BONUS",
            `Referans kodu bonusu (${referrerNickname} tarafından davet edildi)`,
            undefined,
            true // Skip referral commission for the bonus itself
          )

          // Give 50 NP to referrer (only for first 5 referrals)
          await giveReferrerBonus(referredByUserId, data.nickname)
        } catch (error) {
          console.error("Failed to add referral bonuses:", error)
        }
      }

      return NextResponse.json({
        profile: newProfile,
        referralBonusApplied: !!referredByUserId,
        referralBonus: referredByUserId ? REFERRAL_BONUS : 0,
        referrerNickname,
      }, { status: 201 })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Profile creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
