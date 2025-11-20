import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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

    const { vpCode, adminNote } = await req.json()

    if (!vpCode || !vpCode.trim()) {
      return NextResponse.json({ error: "VP code is required" }, { status: 400 })
    }

    const purchaseId = params.id

    // Check if purchase exists
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: {
          include: {
            playerProfile: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }

    if (purchase.status === "COMPLETED") {
      return NextResponse.json({ error: "Purchase already completed" }, { status: 400 })
    }

    // Update purchase with VP code and mark as completed
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: "COMPLETED",
        vpCode: vpCode.trim(),
        adminNote: adminNote?.trim() || null,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "VP code sent and purchase completed successfully",
      purchase: updatedPurchase,
    })
  } catch (error: any) {
    console.error("Failed to complete purchase:", error)
    return NextResponse.json(
      { error: "Failed to complete purchase" },
      { status: 500 }
    )
  }
}
