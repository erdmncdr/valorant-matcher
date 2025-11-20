import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const storeItems = [
  {
    type: 'VP_BUNDLE',
    nameEn: '475 VP',
    nameTr: '475 VP',
    descriptionEn: 'Small Valorant Points bundle',
    descriptionTr: 'Küçük Valorant Points paketi',
    vpAmount: 475,
    nPointsCost: 500,
    icon: '💎',
    isActive: true,
    sortOrder: 1,
  },
  {
    type: 'VP_BUNDLE',
    nameEn: '1,000 VP',
    nameTr: '1.000 VP',
    descriptionEn: 'Medium Valorant Points bundle',
    descriptionTr: 'Orta Valorant Points paketi',
    vpAmount: 1000,
    nPointsCost: 1000,
    icon: '💎',
    isActive: true,
    sortOrder: 2,
  },
  {
    type: 'VP_BUNDLE',
    nameEn: '2,050 VP',
    nameTr: '2.050 VP',
    descriptionEn: 'Large Valorant Points bundle',
    descriptionTr: 'Büyük Valorant Points paketi',
    vpAmount: 2050,
    nPointsCost: 2000,
    icon: '💎',
    isActive: true,
    sortOrder: 3,
  },
  {
    type: 'VP_BUNDLE',
    nameEn: '3,650 VP',
    nameTr: '3.650 VP',
    descriptionEn: 'Extra Large Valorant Points bundle',
    descriptionTr: 'Ekstra Büyük Valorant Points paketi',
    vpAmount: 3650,
    nPointsCost: 3500,
    icon: '💎',
    isActive: true,
    sortOrder: 4,
  },
  {
    type: 'VP_BUNDLE',
    nameEn: '5,350 VP',
    nameTr: '5.350 VP',
    descriptionEn: 'Mega Valorant Points bundle',
    descriptionTr: 'Mega Valorant Points paketi',
    vpAmount: 5350,
    nPointsCost: 5000,
    icon: '💎',
    isActive: true,
    sortOrder: 5,
  },
  {
    type: 'VP_BUNDLE',
    nameEn: '11,000 VP',
    nameTr: '11.000 VP',
    descriptionEn: 'Ultimate Valorant Points bundle',
    descriptionTr: 'Ultimate Valorant Points paketi',
    vpAmount: 11000,
    nPointsCost: 10000,
    icon: '💎',
    isActive: true,
    sortOrder: 6,
  },
]

async function seedStoreItems() {
  console.log('🛒 Seeding store items...')

  for (const item of storeItems) {
    await prisma.storeItem.upsert({
      where: {
        nameEn: item.nameEn
      },
      update: item,
      create: item,
    })
  }

  console.log('✅ Store items seeded successfully!')
}

// Run if called directly
if (require.main === module) {
  seedStoreItems()
    .catch((e) => {
      console.error('❌ Error seeding store items:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export default seedStoreItems
