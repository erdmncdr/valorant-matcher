import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Admin purchases API called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session found:", session.user.id)

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { playerProfile: true },
    })

    console.log("👤 User found:", user?.email, "isAdmin:", user?.isAdmin)

    if (!user?.isAdmin) {
      console.log("❌ User is not admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("📦 Fetching purchases...")

    // Fetch all purchases with user and store item details
    const purchases = await prisma.purchase.findMany({
      include: {
        user: {
          include: {
            playerProfile: {
              select: {
                nickname: true,
                tagline: true,
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

    console.log("✅ Purchases fetched:", purchases.length)

    return NextResponse.json({ purchases })
  } catch (error: any) {
    console.error("❌ Failed to fetch purchases:", error)
    console.error("Error details:", error.message)
    console.error("Error stack:", error.stack)
    return NextResponse.json(
      { error: "Failed to fetch purchases", details: error.message },
      { status: 500 }
    )
  }
}
