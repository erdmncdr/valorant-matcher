import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const purchaseId = params.id

    // Check if purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    })

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }

    // Update purchase status
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: status as any,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Purchase status updated successfully",
      purchase: updatedPurchase,
    })
  } catch (error: any) {
    console.error("Failed to update purchase status:", error)
    return NextResponse.json(
      { error: "Failed to update purchase status" },
      { status: 500 }
    )
  }
}
