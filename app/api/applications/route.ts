import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET user's applications
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const my = searchParams.get("my") === "true"

    if (!my) {
      return NextResponse.json(
        { error: "Invalid query" },
        { status: 400 }
      )
    }

    // Get user's applications with listing details
    const applications = await prisma.listingApplication.findMany({
      where: {
        applicantUserId: session.user.id,
      },
      include: {
        listing: {
          include: {
            owner: {
              select: {
                id: true,
                playerProfile: {
                  select: {
                    nickname: true,
                    tagline: true,
                    rankCurrent: true,
                    mainRole: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Filter out applications for expired or closed listings
    const activeApplications = applications.filter(
      (app: any) => app.listing.status === "OPEN" || app.status !== "pending"
    )

    return NextResponse.json({
      applications: activeApplications,
      count: activeApplications.length,
    })
  } catch (error) {
    console.error("Get applications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
