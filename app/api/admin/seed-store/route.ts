import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { storeItems } from "@/prisma/store-seed"

/**
 * POST /api/admin/seed-store
 * Seeds the store items into the database
 *
 * This is a convenience endpoint for development.
 * In production, you should seed via: npm run db:seed
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/admin/seed-store
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Optional: Require admin authentication
    // Uncomment the following lines if you want to restrict access
    /*
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { user: { select: { isAdmin: true } } }
    })

    if (!profile?.user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    */

    console.log('🛒 Seeding store items...')

    const results = []
    for (const item of storeItems) {
      // Find existing item by nameEn
      const existing = await prisma.storeItem.findFirst({
        where: { nameEn: item.nameEn },
      })

      let result
      if (existing) {
        // Update existing item
        result = await prisma.storeItem.update({
          where: { id: existing.id },
          data: {
            type: item.type,
            nameEn: item.nameEn,
            nameTr: item.nameTr,
            descriptionEn: item.descriptionEn,
            descriptionTr: item.descriptionTr,
            vpAmount: item.vpAmount,
            nPointsCost: item.nPointsCost,
            icon: item.icon,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
          },
        })
        console.log(`✅ Updated: ${item.nameEn}`)
      } else {
        // Create new item
        result = await prisma.storeItem.create({
          data: {
            type: item.type,
            nameEn: item.nameEn,
            nameTr: item.nameTr,
            descriptionEn: item.descriptionEn,
            descriptionTr: item.descriptionTr,
            vpAmount: item.vpAmount,
            nPointsCost: item.nPointsCost,
            icon: item.icon,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
          },
        })
        console.log(`✅ Created: ${item.nameEn}`)
      }
      results.push(result)
    }

    console.log('✅ Store items seeded successfully!')

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${results.length} store items`,
      items: results.map(item => ({
        name: item.nameEn,
        vpAmount: item.vpAmount,
        nPointsCost: item.nPointsCost,
      })),
    })
  } catch (error) {
    console.error('❌ Error seeding store items:', error)
    return NextResponse.json(
      {
        error: "Failed to seed store items",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/seed-store
 * Returns current store items in database
 */
export async function GET(req: Request) {
  try {
    const items = await prisma.storeItem.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.nameEn,
        vpAmount: item.vpAmount,
        nPointsCost: item.nPointsCost,
        isActive: item.isActive,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch store items", details: String(error) },
      { status: 500 }
    )
  }
}
