import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
