import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBlockSchema = z.object({
  blockedUserId: z.string(),
})

// POST create block
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
    const { blockedUserId } = createBlockSchema.parse(body)

    if (blockedUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot block yourself" },
        { status: 400 }
      )
    }

    const block = await prisma.block.create({
      data: {
        blockerUserId: session.user.id,
        blockedUserId,
      },
    })

    return NextResponse.json({ block }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // Handle unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User already blocked" },
        { status: 400 }
      )
    }

    console.error("Create block error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET blocked users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const blocks = await prisma.block.findMany({
      where: { blockerUserId: session.user.id },
      include: {
        blocked: {
          include: {
            playerProfile: true,
          },
        },
      },
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error("Get blocks error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
