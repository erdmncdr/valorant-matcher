import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// GET - Get current Discord linking status
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has Discord account linked
    const discordAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "discord",
      },
    })

    // Get current linking code if exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        discordLinkingCode: true,
        discordLinkingCodeExpiry: true,
      },
    })

    return NextResponse.json({
      isLinked: !!discordAccount,
      discordAccount: discordAccount
        ? {
            username: discordAccount.username,
            linkedAt: discordAccount.createdAt,
          }
        : null,
      linkingCode: user?.discordLinkingCode,
      linkingCodeExpiry: user?.discordLinkingCodeExpiry,
    })
  } catch (error) {
    console.error("Get Discord link status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Generate new linking code
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already linked
    const existingLink = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "discord",
      },
    })

    if (existingLink) {
      return NextResponse.json(
        { error: "Discord account already linked" },
        { status: 400 }
      )
    }

    // Generate unique 8-character code
    const linkingCode = crypto.randomBytes(4).toString("hex").toUpperCase()

    // Set expiry to 15 minutes from now
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    // Update user with linking code
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        discordLinkingCode: linkingCode,
        discordLinkingCodeExpiry: expiry,
      },
    })

    return NextResponse.json({
      linkingCode,
      expiry,
    })
  } catch (error) {
    console.error("Generate Discord linking code error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Unlink Discord account
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete social account
    await prisma.socialAccount.deleteMany({
      where: {
        userId: session.user.id,
        provider: "discord",
      },
    })

    // Clear linking code
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        discordLinkingCode: null,
        discordLinkingCodeExpiry: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unlink Discord account error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
