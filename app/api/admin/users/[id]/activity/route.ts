import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/users/[id]/activity - Get user activity timeline
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
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    // Fetch all user activities
    const [
      listings,
      applications,
      messages,
      ratingsGiven,
      ratingsReceived,
      reportsSubmitted,
      reportsReceived,
      privateMessages,
    ] = await Promise.all([
      // Listings created
      prisma.listing.findMany({
        where: { ownerUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          listingType: true,
          status: true,
          createdAt: true,
        },
      }),
      // Applications made
      prisma.listingApplication.findMany({
        where: { applicantUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              owner: {
                select: {
                  playerProfile: {
                    select: { nickname: true, tagline: true },
                  },
                },
              },
            },
          },
        },
      }),
      // Messages sent
      prisma.listingMessage.findMany({
        where: { senderUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: { id: true, title: true },
          },
        },
      }),
      // Ratings given
      prisma.playerRating.findMany({
        where: { raterUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          target: {
            select: {
              playerProfile: {
                select: { nickname: true, tagline: true },
              },
            },
          },
          listing: {
            select: { id: true, title: true },
          },
        },
      }),
      // Ratings received
      prisma.playerRating.findMany({
        where: { targetUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          rater: {
            select: {
              playerProfile: {
                select: { nickname: true, tagline: true },
              },
            },
          },
          listing: {
            select: { id: true, title: true },
          },
        },
      }),
      // Reports submitted
      prisma.report.findMany({
        where: { reporterUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          target: {
            select: {
              playerProfile: {
                select: { nickname: true, tagline: true },
              },
            },
          },
        },
      }),
      // Reports received
      prisma.report.findMany({
        where: { targetUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              playerProfile: {
                select: { nickname: true, tagline: true },
              },
            },
          },
        },
      }),
      // Private messages sent
      prisma.privateMessage.findMany({
        where: { senderUserId: userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          receiver: {
            select: {
              playerProfile: {
                select: { nickname: true, tagline: true },
              },
            },
          },
        },
      }),
    ])

    // Combine all activities into a timeline
    const timeline: any[] = []

    listings.forEach((listing) => {
      timeline.push({
        type: "listing_created",
        timestamp: listing.createdAt,
        data: listing,
      })
    })

    applications.forEach((app) => {
      timeline.push({
        type: "application_submitted",
        timestamp: app.createdAt,
        data: app,
      })
    })

    messages.forEach((msg) => {
      timeline.push({
        type: "message_sent",
        timestamp: msg.createdAt,
        data: msg,
      })
    })

    ratingsGiven.forEach((rating) => {
      timeline.push({
        type: "rating_given",
        timestamp: rating.createdAt,
        data: rating,
      })
    })

    ratingsReceived.forEach((rating) => {
      timeline.push({
        type: "rating_received",
        timestamp: rating.createdAt,
        data: rating,
      })
    })

    reportsSubmitted.forEach((report) => {
      timeline.push({
        type: "report_submitted",
        timestamp: report.createdAt,
        data: report,
      })
    })

    reportsReceived.forEach((report) => {
      timeline.push({
        type: "report_received",
        timestamp: report.createdAt,
        data: report,
      })
    })

    privateMessages.forEach((pm) => {
      timeline.push({
        type: "private_message_sent",
        timestamp: pm.createdAt,
        data: pm,
      })
    })

    // Sort timeline by timestamp (newest first)
    timeline.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Limit to requested amount
    const limitedTimeline = timeline.slice(0, limit)

    return NextResponse.json({
      timeline: limitedTimeline,
      counts: {
        listings: listings.length,
        applications: applications.length,
        messages: messages.length,
        ratingsGiven: ratingsGiven.length,
        ratingsReceived: ratingsReceived.length,
        reportsSubmitted: reportsSubmitted.length,
        reportsReceived: reportsReceived.length,
        privateMessages: privateMessages.length,
      },
    })
  } catch (error) {
    console.error("Admin user activity error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
