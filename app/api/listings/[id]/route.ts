import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ListingStatus } from "@prisma/client"

// GET single listing
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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
