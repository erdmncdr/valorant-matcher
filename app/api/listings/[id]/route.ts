import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ListingStatus } from "@/lib/types"

// GET single listing
export async function GET(
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

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          include: {
            playerProfile: {
              include: {
                playerAgents: true,
              },
            },
          },
        },
        applications: {
          include: {
            applicant: {
              include: {
                playerProfile: {
                  include: {
                    playerAgents: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        messages: {
          include: {
            sender: {
              include: {
                playerProfile: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    // Check if user is authorized to see full details
    const isOwner = listing.ownerUserId === session.user.id
    const hasApplied = listing.applications.some(
      (app: any) => app.applicantUserId === session.user.id
    )

    // Only owner and applicants can see messages and applications
    if (!isOwner && !hasApplied) {
      // Return public view - basic listing info only
      return NextResponse.json({
        listing: {
          id: listing.id,
          listingType: listing.listingType,
          title: listing.title,
          mode: listing.mode,
          region: listing.region,
          languages: listing.languages,
          seriousness: listing.seriousness,
          voiceRequired: listing.voiceRequired,
          minRank: listing.minRank,
          maxRank: listing.maxRank,
          stackSize: listing.stackSize,
          desiredRole: listing.desiredRole,
          description: listing.description,
          status: listing.status,
          expiresAt: listing.expiresAt,
          createdAt: listing.createdAt,
          owner: {
            id: listing.owner.id,
            playerProfile: listing.owner.playerProfile
              ? {
                  nickname: listing.owner.playerProfile.nickname,
                  tagline: listing.owner.playerProfile.tagline,
                  rankCurrent: listing.owner.playerProfile.rankCurrent,
                  reputationScore: listing.owner.playerProfile.reputationScore,
                  mainRole: listing.owner.playerProfile.mainRole,
                  playerAgents: listing.owner.playerProfile.playerAgents,
                }
              : null,
          },
          _count: {
            applications: listing.applications.length,
          },
          // Don't include messages and applications for unauthorized users
        },
      })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error("Get listing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE close listing
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

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    if (listing.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only close your own listings" },
        { status: 403 }
      )
    }

    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: { status: ListingStatus.CLOSED },
    })

    return NextResponse.json({ listing: updatedListing })
  } catch (error) {
    console.error("Close listing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
