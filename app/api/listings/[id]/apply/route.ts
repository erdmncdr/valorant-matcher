import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const applySchema = z.object({
  message: z.string().max(500).optional(),
})

// POST apply to listing
export async function POST(
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

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.isBanned) {
      return NextResponse.json(
        { error: "You are banned and cannot apply to listings" },
        { status: 403 }
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

    if (listing.ownerUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot apply to your own listing" },
        { status: 400 }
      )
    }

    if (listing.status !== "OPEN") {
      return NextResponse.json(
        { error: "This listing is no longer open" },
        { status: 400 }
      )
    }

    if (new Date() > listing.expiresAt) {
      return NextResponse.json(
        { error: "This listing has expired" },
        { status: 400 }
      )
    }

    // Check if already applied
    const existingApplication = await prisma.listingApplication.findUnique({
      where: {
        listingId_applicantUserId: {
          listingId: params.id,
          applicantUserId: session.user.id,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this listing" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { message } = applySchema.parse(body)

    const application = await prisma.listingApplication.create({
      data: {
        listingId: params.id,
        applicantUserId: session.user.id,
        message,
      },
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
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Apply to listing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
