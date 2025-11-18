import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH accept or decline application
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

    const body = await req.json()
    const { action } = body // "accept" or "decline"

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      )
    }

    // Find the application
    const application = await prisma.listingApplication.findUnique({
      where: { id: params.id },
      include: {
        listing: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Check if user owns the listing
    if (application.listing.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the listing owner can accept or decline applications" },
        { status: 403 }
      )
    }

    // Can only accept/decline pending applications
    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "You can only accept or decline pending applications" },
        { status: 400 }
      )
    }

    // Update the application status
    const updatedApplication = await prisma.listingApplication.update({
      where: { id: params.id },
      data: {
        status: action === "accept" ? "accepted" : "declined",
      },
    })

    // Create notification for the applicant
    await prisma.notification.create({
      data: {
        userId: application.applicantUserId,
        type: action === "accept" ? "APPLICATION_ACCEPTED" : "APPLICATION_DECLINED",
        title: action === "accept" ? "Application Accepted!" : "Application Declined",
        message: action === "accept"
          ? `Your application to "${application.listing.title}" has been accepted!`
          : `Your application to "${application.listing.title}" has been declined.`,
        link: `/listings/${application.listingId}`,
      },
    })

    return NextResponse.json({ application: updatedApplication }, { status: 200 })
  } catch (error) {
    console.error("Update application error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE cancel application
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

    // Find the application
    const application = await prisma.listingApplication.findUnique({
      where: { id: params.id },
      include: {
        listing: true,
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Check if user owns this application
    if (application.applicantUserId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own applications" },
        { status: 403 }
      )
    }

    // Can only cancel pending applications
    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "You can only cancel pending applications" },
        { status: 400 }
      )
    }

    // Delete the application
    await prisma.listingApplication.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Cancel application error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
