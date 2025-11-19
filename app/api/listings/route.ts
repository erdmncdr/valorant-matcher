import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ValorantRank, PlayerRole, Seriousness, GameMode, ListingType, ListingStatus } from "@/lib/types"
import { listingRateLimiter } from "@/lib/rate-limit"

const createListingSchema = z.object({
  listingType: z.nativeEnum(ListingType),
  title: z.string().min(5).max(100),
  mode: z.nativeEnum(GameMode),
  region: z.string(),
  languages: z.array(z.string()).min(1),
  seriousness: z.nativeEnum(Seriousness),
  voiceRequired: z.boolean(),
  minRank: z.nativeEnum(ValorantRank),
  maxRank: z.nativeEnum(ValorantRank),
  stackSize: z.number().int().min(1).max(4).optional(),
  desiredRole: z.nativeEnum(PlayerRole).optional(),
  description: z.string().max(500).optional(),
  expiryMinutes: z.number().int().min(30).max(240),
})

// GET listings with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const listingType = searchParams.get("listingType")
    const mode = searchParams.get("mode")
    const region = searchParams.get("region")
    const minRank = searchParams.get("minRank")
    const maxRank = searchParams.get("maxRank")
    const desiredRole = searchParams.get("desiredRole")
    const sortBy = searchParams.get("sortBy") || "createdAt" // "createdAt" or "reputation"
    const my = searchParams.get("my") // Get user's own listings

    // If requesting own listings, require authentication
    if (my === "true") {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }

      // Get only user's listings (including all statuses)
      const listings = await prisma.listing.findMany({
        where: {
          ownerUserId: session.user.id,
        },
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
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({ listings })
    }

    const where: any = {
      status: ListingStatus.OPEN,
      expiresAt: {
        gt: new Date(),
      },
    }

    if (listingType) {
      where.listingType = listingType
    }

    if (mode) {
      where.mode = mode
    }

    if (region) {
      where.region = region
    }

    if (minRank) {
      where.minRank = {
        gte: minRank,
      }
    }

    if (maxRank) {
      where.maxRank = {
        lte: maxRank,
      }
    }

    if (desiredRole) {
      where.desiredRole = desiredRole
    }

    const listings = await prisma.listing.findMany({
      where,
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy:
        sortBy === "reputation"
          ? { owner: { playerProfile: { reputationScore: "desc" } } }
          : { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error("Get listings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST create listing
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Rate limiting: 5 listings per hour
    const { success, reset } = await listingRateLimiter.limit(session.user.id)
    if (!success) {
      const resetDate = new Date(reset)
      const minutesLeft = Math.ceil((reset - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Çok fazla listing oluşturdunuz. ${minutesLeft} dakika sonra tekrar deneyin.`,
          resetAt: resetDate.toISOString()
        },
        { status: 429 }
      )
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.isBanned) {
      const bannedUntil = user.bannedUntil
      if (!bannedUntil || new Date() < bannedUntil) {
        return NextResponse.json(
          { error: "You are banned and cannot create listings" },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const data = createListingSchema.parse(body)

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + data.expiryMinutes * 60 * 1000)

    const listing = await prisma.listing.create({
      data: {
        ownerUserId: session.user.id,
        listingType: data.listingType,
        title: data.title,
        mode: data.mode,
        region: data.region,
        languages: data.languages,
        seriousness: data.seriousness,
        voiceRequired: data.voiceRequired,
        minRank: data.minRank,
        maxRank: data.maxRank,
        stackSize: data.stackSize,
        desiredRole: data.desiredRole,
        description: data.description,
        expiryMinutes: data.expiryMinutes,
        expiresAt,
      },
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
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create listing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
