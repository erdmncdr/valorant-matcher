import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET messages with a specific user
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = params

    // Get messages between current user and the specified user
    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderUserId: session.user.id, receiverUserId: userId },
          { senderUserId: userId, receiverUserId: session.user.id },
        ],
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
      orderBy: {
        createdAt: "asc",
      },
      take: 100, // Last 100 messages
    })

    // Mark messages as read
    await prisma.privateMessage.updateMany({
      where: {
        senderUserId: userId,
        receiverUserId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    // Get other user's info
    const otherUser = await prisma.user.findUnique({
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
            mainRole: true,
          },
        },
      },
    })

    return NextResponse.json({
      messages,
      otherUser,
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
