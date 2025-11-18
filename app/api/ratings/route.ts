import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createRatingSchema = z.object({
  targetUserId: z.string(),
  listingId: z.string(),
  score: z.number().int().min(-1).max(1),
  tags: z.array(z.string()).min(1).max(10),
  comment: z.string().max(500).optional(),
})

// POST create rating
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
    const data = createRatingSchema.parse(body)

    if (data.targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot rate yourself" },
        { status: 400 }
      )
    }

    // Check if already rated this player EVER (across all listings)
    // This prevents rating abuse - one user can only rate another user once, total
    const existingRating = await prisma.playerRating.findFirst({
      where: {
        raterUserId: session.user.id,
        targetUserId: data.targetUserId,
      },
    })

    if (existingRating) {
      return NextResponse.json(
        { error: "You have already rated this player" },
        { status: 400 }
      )
    }

    // Create rating and update reputation score in a transaction
    const [rating, _] = await prisma.$transaction([
      prisma.playerRating.create({
        data: {
          raterUserId: session.user.id,
          targetUserId: data.targetUserId,
          listingId: data.listingId,
          score: data.score,
          tags: data.tags,
          comment: data.comment,
        },
      }),
      // Update the target user's reputation score
      prisma.playerProfile.update({
        where: {
          userId: data.targetUserId,
        },
        data: {
          reputationScore: {
            increment: data.score, // +1 or -1
          },
        },
      }),
    ])

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create rating error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET ratings for a user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get("targetUserId")
    const listingId = searchParams.get("listingId")

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }

    const where: any = {
      targetUserId,
    }

    if (listingId) {
      where.listingId = listingId
    }

    const ratings = await prisma.playerRating.findMany({
      where,
      include: {
        rater: {
          select: {
            id: true,
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error("Get ratings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
