import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deductNPoints, addNPoints } from "@/lib/npoints"

// GET /api/store - Get all store items and user balance
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active store items
    const items = await prisma.storeItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    // Get user's profile with N-Points balance
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    // Get user's purchase history
    const purchases = await prisma.purchase.findMany({
      where: { userId: session.user.id },
      include: {
        storeItem: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      items,
      nPointsBalance: profile?.nPoints || 0,
      recentPurchases: purchases,
    })
  } catch (error) {
    console.error("Get store items error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/store - Purchase an item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await req.json()

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }

    // Get store item
    const item = await prisma.storeItem.findUnique({
      where: { id: itemId },
    })

    if (!item || !item.isActive) {
      return NextResponse.json(
        { error: "Item not found or not available" },
        { status: 404 }
      )
    }

    // Get user's balance
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    if (!profile || profile.nPoints < item.nPointsCost) {
      return NextResponse.json(
        { error: "Insufficient N-Points balance" },
        { status: 400 }
      )
    }

    // Create purchase record and deduct N-Points in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Deduct N-Points
      await tx.playerProfile.update({
        where: { userId: session.user.id },
        data: {
          nPoints: {
            decrement: item.nPointsCost,
          },
        },
      })

      // Create transaction log
      await tx.nPointsTransaction.create({
        data: {
          userId: session.user.id,
          amount: -item.nPointsCost,
          type: 'SPEND_STORE',
          description: `Purchased ${item.nameEn} (${item.vpAmount} VP)`,
          reference: item.id,
        },
      })

      // Create purchase record with PENDING status (manual delivery)
      const newPurchase = await tx.purchase.create({
        data: {
          userId: session.user.id,
          storeItemId: item.id,
          status: 'PENDING', // Manual delivery - admin will send VP code
          nPointsCost: item.nPointsCost,
          vpAmount: item.vpAmount,
        },
        include: {
          storeItem: true,
        },
      })

      return newPurchase
    })

    // Get updated balance
    const updatedProfile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { nPoints: true },
    })

    console.log(`✅ User ${session.user.id} purchased ${item.nameEn} for ${item.nPointsCost} N-Points`)

    return NextResponse.json({
      success: true,
      purchase,
      newBalance: updatedProfile?.nPoints || 0,
      message: `Successfully purchased ${item.vpAmount} VP!`,
    })
  } catch (error) {
    console.error("Purchase error:", error)
    return NextResponse.json(
      { error: "Purchase failed. Please try again." },
      { status: 500 }
    )
  }
}
