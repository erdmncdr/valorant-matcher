import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const blockSchema = z.object({
  blockedUserId: z.string(),
})

// GET list of blocked users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const blocks = await prisma.block.findMany({
      where: { blockerUserId: session.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
                rankCurrent: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ blockedUsers: blocks })
  } catch (error) {
    console.error("Get blocked users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST block a user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { blockedUserId } = blockSchema.parse(body)

    // Check if trying to block themselves
    if (blockedUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      )
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: blockedUserId },
    })

    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: session.user.id,
          blockedUserId,
        },
      },
    })

    if (existingBlock) {
      return NextResponse.json(
        { error: "User already blocked" },
        { status: 400 }
      )
    }

    // Create block
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

    console.error("Block user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE unblock a user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const blockedUserId = searchParams.get("userId")

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      )
    }

    // Delete block
    await prisma.block.delete({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: session.user.id,
          blockedUserId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unblock user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
