import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Update user's last seen timestamp
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: new Date() },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error updating presence:", error)
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 }
    )
  }
}
