import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { playerProfile: true },
    })

    if (!user?.playerProfile?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch all purchases with user and store item details
    const purchases = await prisma.purchase.findMany({
      include: {
        user: {
          include: {
            playerProfile: {
              select: {
                nickname: true,
                tagLine: true,
              },
            },
          },
        },
        storeItem: {
          select: {
            nameEn: true,
            nameTr: true,
            vpAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ purchases })
  } catch (error: any) {
    console.error("Failed to fetch purchases:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    )
  }
}
