import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/users/[id] - Get user details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        playerProfile: {
          include: {
            playerAgents: true,
          },
        },
        socialAccounts: true,
        _count: {
          select: {
            listingsOwned: true,
            listingApplications: true,
            messagesSent: true,
            ratingsGiven: true,
            ratingsReceived: true,
            reportsSubmitted: true,
            reportsReceived: true,
            blocksInitiated: true,
            blocksReceived: true,
            privateMessagesSent: true,
            privateMessagesReceived: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Admin user detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user (ban/unban)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = params.id
    const body = await req.json()
    const { isBanned, banDuration, banReason } = body

    const updateData: any = {
      isBanned,
    }

    if (isBanned && banDuration) {
      updateData.bannedUntil = new Date(
        Date.now() + banDuration * 24 * 60 * 60 * 1000
      )
      updateData.banReason = banReason || "Banned by admin"
    } else if (!isBanned) {
      updateData.bannedUntil = null
      updateData.banReason = null
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        playerProfile: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
