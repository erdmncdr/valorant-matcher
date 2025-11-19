import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { messageRateLimiter } from "@/lib/rate-limit"

const sendMessageSchema = z.object({
  receiverUserId: z.string(),
  content: z.string().min(1).max(2000),
})

// GET conversations list
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all unique users the current user has messaged with
    const sentMessages = await prisma.privateMessage.findMany({
      where: { senderUserId: session.user.id },
      distinct: ['receiverUserId'],
      select: { receiverUserId: true },
    })

    const receivedMessages = await prisma.privateMessage.findMany({
      where: { receiverUserId: session.user.id },
      distinct: ['senderUserId'],
      select: { senderUserId: true },
    })

    const userIds = new Set([
      ...sentMessages.map((m: any) => m.receiverUserId),
      ...receivedMessages.map((m: any) => m.senderUserId),
    ])

    // Get user details and last message for each conversation
    const conversations = await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const lastMessage = await prisma.privateMessage.findFirst({
          where: {
            OR: [
              { senderUserId: session.user.id, receiverUserId: userId },
              { senderUserId: userId, receiverUserId: session.user.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })

        const unreadCount = await prisma.privateMessage.count({
          where: {
            senderUserId: userId,
            receiverUserId: session.user.id,
            isRead: false,
          },
        })

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            lastSeenAt: true,
            isAdmin: true,
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
                rankCurrent: true,
              },
            },
          },
        })

        return {
          user,
          lastMessage,
          unreadCount,
        }
      })
    )

    // Sort by last message time
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt.getTime() || 0
      const timeB = b.lastMessage?.createdAt.getTime() || 0
      return timeB - timeA
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST send a new message
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: 20 messages per minute
    const { success, reset } = await messageRateLimiter.limit(session.user.id)
    if (!success) {
      const secondsLeft = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: `Çok fazla mesaj gönderdiniz. ${secondsLeft} saniye sonra tekrar deneyin.`,
          resetAt: new Date(reset).toISOString()
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { receiverUserId, content } = sendMessageSchema.parse(body)

    // Check if user is trying to message themselves
    if (receiverUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send messages to yourself" },
        { status: 400 }
      )
    }

    // Check if receiver exists and is not banned
    const receiver = await prisma.user.findUnique({
      where: { id: receiverUserId },
      select: { isBanned: true },
    })

    if (!receiver) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (receiver.isBanned) {
      return NextResponse.json(
        { error: "Cannot message banned users" },
        { status: 403 }
      )
    }

    // Check if blocked
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: session.user.id, blockedUserId: receiverUserId },
          { blockerUserId: receiverUserId, blockedUserId: session.user.id },
        ],
      },
    })

    if (isBlocked) {
      return NextResponse.json(
        { error: "Cannot send messages to this user" },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.privateMessage.create({
      data: {
        senderUserId: session.user.id,
        receiverUserId,
        content,
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
        receiver: {
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
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverUserId,
        type: "PRIVATE_MESSAGE",
        title: "New Message",
        message: `${message.sender.playerProfile?.nickname} sent you a message`,
        link: `/messages/${session.user.id}`,
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
