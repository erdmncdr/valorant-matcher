import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/store - Get all store items with stats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        user: {
          select: { isAdmin: true }
        }
      }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all store items
    const items = await prisma.storeItem.findMany({
      include: {
        _count: {
          select: { purchases: true }
        },
        purchases: {
          select: {
            nPointsCost: true,
            createdAt: true,
          }
        }
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Calculate stats for each item
    const itemsWithStats = items.map(item => {
      const totalSales = item.purchases.length
      const totalRevenue = item.purchases.reduce((sum, p) => sum + p.nPointsCost, 0)

      return {
        ...item,
        totalSales,
        totalRevenue,
      }
    })

    // Overall stats
    const totalPurchases = await prisma.purchase.count()
    const totalRevenue = await prisma.nPointsTransaction.aggregate({
      where: { type: 'SPEND_STORE' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      items: itemsWithStats,
      stats: {
        totalPurchases,
        totalRevenue: Math.abs(totalRevenue._sum.amount || 0),
      }
    })
  } catch (error) {
    console.error("Get store items error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/store - Create new store item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        user: {
          select: { isAdmin: true }
        }
      }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const data = await req.json()

    const item = await prisma.storeItem.create({
      data: {
        type: data.type,
        nameEn: data.nameEn,
        nameTr: data.nameTr,
        descriptionEn: data.descriptionEn,
        descriptionTr: data.descriptionTr,
        vpAmount: data.vpAmount,
        nPointsCost: data.nPointsCost,
        icon: data.icon,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Create store item error:", error)
    return NextResponse.json(
      { error: "Failed to create store item" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/store - Update store item
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        user: {
          select: { isAdmin: true }
        }
      }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id, ...data } = await req.json()

    const item = await prisma.storeItem.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Update store item error:", error)
    return NextResponse.json(
      { error: "Failed to update store item" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/store - Delete store item
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        user: {
          select: { isAdmin: true }
        }
      }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 })
    }

    await prisma.storeItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete store item error:", error)
    return NextResponse.json(
      { error: "Failed to delete store item" },
      { status: 500 }
    )
  }
}
