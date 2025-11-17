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

    // Check if already rated
    const existing = await prisma.playerRating.findUnique({
      where: {
        raterUserId_targetUserId_listingId: {
          raterUserId: session.user.id,
          targetUserId: data.targetUserId,
          listingId: data.listingId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You have already rated this player for this listing" },
        { status: 400 }
      )
    }

    const rating = await prisma.playerRating.create({
      data: {
        raterUserId: session.user.id,
        targetUserId: data.targetUserId,
        listingId: data.listingId,
        score: data.score,
        tags: data.tags,
        comment: data.comment,
      },
    })

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
