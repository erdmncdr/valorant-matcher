import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ReportStatus } from "@/lib/types"

const updateReportSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  reviewNotes: z.string().optional(),
  banUser: z.boolean().optional(),
  banDuration: z.number().optional(), // in days
  banReason: z.string().optional(),
})

// PATCH update report status (admin only)
export async function PATCH(
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = updateReportSchema.parse(body)

    // Update report
    const report = await prisma.report.update({
      where: { id: params.id },
      data: {
        status: data.status,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNotes: data.reviewNotes,
      },
      include: {
        target: {
          select: {
            id: true,
            playerProfile: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    })

    // If admin wants to ban the user
    if (data.banUser && report.targetUserId) {
      const bannedUntil = data.banDuration
        ? new Date(Date.now() + data.banDuration * 24 * 60 * 60 * 1000)
        : null

      await prisma.user.update({
        where: { id: report.targetUserId },
        data: {
          isBanned: true,
          bannedUntil: bannedUntil,
          banReason: data.banReason || "Reported behavior violation",
        },
      })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update report error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE delete report (admin only)
export async function DELETE(
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Delete report
    await prisma.report.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete report error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
