import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { censorProfanity, containsProfanity } from "@/lib/profanity-filter"

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
})

// GET messages for a listing
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const messages = await prisma.listingMessage.findMany({
      where: { listingId: params.id },
      include: {
        sender: {
          select: {
            id: true,
            isAdmin: true,
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
        createdAt: "asc",
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST send a message
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.isBanned) {
      return NextResponse.json(
        { error: "You are banned and cannot send messages" },
        { status: 403 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { content } = sendMessageSchema.parse(body)

    // Auto-censor profanity in messages
    const censoredContent = censorProfanity(content)

    const message = await prisma.listingMessage.create({
      data: {
        listingId: params.id,
        senderUserId: session.user.id,
        content: censoredContent,
      },
      include: {
        sender: {
          select: {
            id: true,
            isAdmin: true,
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Send message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
