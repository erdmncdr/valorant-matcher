import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Admin Setup Endpoint
 * Makes the current logged-in user an admin
 * SECURITY: Remove this endpoint after first use!
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Update user to admin
    const profile = await prisma.playerProfile.update({
      where: { userId: session.user.id },
      data: { isAdmin: true },
    })

    console.log(`✅ User ${session.user.email} is now an admin`)

    return NextResponse.json({
      success: true,
      message: "You are now an admin! Please delete this endpoint from code.",
      email: session.user.email,
      isAdmin: profile.isAdmin,
    })
  } catch (error: any) {
    console.error("Failed to make admin:", error)
    return NextResponse.json(
      { error: "Failed to grant admin access", details: error.message },
      { status: 500 }
    )
  }
}
