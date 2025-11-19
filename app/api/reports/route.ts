import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ReportReason, ReportCategory } from "@prisma/client"
import { reportRateLimiter } from "@/lib/rate-limit"

const createReportSchema = z.object({
  targetUserId: z.string(),
  listingId: z.string().optional(),
  category: z.nativeEnum(ReportCategory),
  reason: z.nativeEnum(ReportReason),
  description: z.string().min(10).max(1000),
})

// POST create report
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting: 3 reports per hour
    const { success, reset } = await reportRateLimiter.limit(session.user.id)
    if (!success) {
      const minutesLeft = Math.ceil((reset - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Çok fazla şikayet gönderdiniz. ${minutesLeft} dakika sonra tekrar deneyin.`,
          resetAt: new Date(reset).toISOString()
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const data = createReportSchema.parse(body)

    if (data.targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      )
    }

    const report = await prisma.report.create({
      data: {
        reporterUserId: session.user.id,
        targetUserId: data.targetUserId,
        listingId: data.listingId,
        category: data.category,
        reason: data.reason,
        description: data.description,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create report error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET reports (admin only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const targetUserId = searchParams.get("targetUserId")

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (targetUserId) {
      where.targetUserId = targetUserId
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          include: {
            playerProfile: true,
          },
        },
        target: {
          include: {
            playerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
