import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test users
  const password_hash = await bcrypt.hash('password123', 10)

  // User 1: Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@needone.gg' },
    update: {},
    create: {
      email: 'admin@needone.gg',
      password_hash,
      isAdmin: true,
      playerProfile: {
        create: {
          nickname: 'AdminPlayer',
          tagline: '#0001',
          region: 'TR',
          rankCurrent: 'IMMORTAL',
          rankPeak: 'RADIANT',
          mainRole: 'FLEX',
          languages: ['TR', 'EN'],
          mic: true,
          seriousness: 'TRYHARD',
          typicalPlaytime: 'Evenings and weekends',
          bio: 'Admin account for testing and moderation',
          playerAgents: {
            create: [
              { agentName: 'Jett', priority: 'main' },
              { agentName: 'Omen', priority: 'secondary' },
              { agentName: 'Sage', priority: 'secondary' },
            ],
          },
        },
      },
    },
  })

  // User 2: Team Captain
  const teamCaptain = await prisma.user.upsert({
    where: { email: 'captain@needone.gg' },
    update: {},
    create: {
      email: 'captain@needone.gg',
      password_hash,
      playerProfile: {
        create: {
          nickname: 'TeamCaptain',
          tagline: '#1337',
          region: 'EU',
          rankCurrent: 'DIAMOND',
          rankPeak: 'ASCENDANT',
          mainRole: 'SENTINEL',
          languages: ['EN', 'DE'],
          mic: true,
          seriousness: 'NORMAL',
          typicalPlaytime: 'Weekdays 18:00-23:00',
          bio: 'Looking for consistent players for ranked grind',
          playerAgents: {
            create: [
              { agentName: 'Cypher', priority: 'main' },
              { agentName: 'Killjoy', priority: 'secondary' },
              { agentName: 'Chamber', priority: 'secondary' },
            ],
          },
        },
      },
    },
  })

  // User 3: Solo Duelist
  const soloDuelist = await prisma.user.upsert({
    where: { email: 'duelist@needone.gg' },
    update: {},
    create: {
      email: 'duelist@needone.gg',
      password_hash,
      playerProfile: {
        create: {
          nickname: 'FragHunter',
          tagline: '#9999',
          region: 'TR',
          rankCurrent: 'PLATINUM',
          rankPeak: 'DIAMOND',
          mainRole: 'DUELIST',
          languages: ['TR', 'EN'],
          mic: true,
          seriousness: 'TRYHARD',
          typicalPlaytime: 'Nights and weekends',
          bio: 'Aggressive duelist main, top fragger',
          playerAgents: {
            create: [
              { agentName: 'Reyna', priority: 'main' },
              { agentName: 'Jett', priority: 'secondary' },
              { agentName: 'Raze', priority: 'secondary' },
            ],
          },
        },
      },
    },
  })

  // User 4: Controller Main
  const controllerMain = await prisma.user.upsert({
    where: { email: 'controller@needone.gg' },
    update: {},
    create: {
      email: 'controller@needone.gg',
      password_hash,
      playerProfile: {
        create: {
          nickname: 'SmokeKing',
          tagline: '#4200',
          region: 'EU',
          rankCurrent: 'GOLD',
          rankPeak: 'PLATINUM',
          mainRole: 'CONTROLLER',
          languages: ['EN', 'FR'],
          mic: true,
          seriousness: 'CASUAL',
          typicalPlaytime: 'Flexible schedule',
          bio: 'Chill controller main, good smokes and comms',
          playerAgents: {
            create: [
              { agentName: 'Omen', priority: 'main' },
              { agentName: 'Brimstone', priority: 'secondary' },
              { agentName: 'Viper', priority: 'secondary' },
            ],
          },
        },
      },
    },
  })

  // User 5: Initiator
  const initiator = await prisma.user.upsert({
    where: { email: 'initiator@needone.gg' },
    update: {},
    create: {
      email: 'initiator@needone.gg',
      password_hash,
      playerProfile: {
        create: {
          nickname: 'InfoGatherer',
          tagline: '#1111',
          region: 'TR',
          rankCurrent: 'ASCENDANT',
          rankPeak: 'IMMORTAL',
          mainRole: 'INITIATOR',
          languages: ['TR', 'EN'],
          mic: true,
          seriousness: 'TRYHARD',
          typicalPlaytime: 'Evenings',
          bio: 'IGL, good util usage and comms',
          playerAgents: {
            create: [
              { agentName: 'Sova', priority: 'main' },
              { agentName: 'Fade', priority: 'secondary' },
              { agentName: 'Breach', priority: 'secondary' },
            ],
          },
        },
      },
    },
  })

  console.log('✅ Created test users')

  // Create sample team listings
  const teamListing1 = await prisma.listing.create({
    data: {
      ownerUserId: teamCaptain.id,
      listingType: 'TEAM',
      status: 'OPEN',
      title: 'Diamond 4-stack LF1 Controller/Sentinel',
      mode: 'RANKED',
      region: 'EU',
      languages: ['EN'],
      seriousness: 'NORMAL',
      voiceRequired: true,
      minRank: 'PLATINUM',
      maxRank: 'ASCENDANT',
      stackSize: 4,
      desiredRole: 'CONTROLLER',
      description: 'We are a friendly 4-stack looking for a consistent 5th. Good comms required. We play weekday evenings.',
      expiryMinutes: 120,
      expiresAt: new Date(Date.now() + 120 * 60 * 1000),
    },
  })

  const teamListing2 = await prisma.listing.create({
    data: {
      ownerUserId: admin.id,
      listingType: 'TEAM',
      status: 'OPEN',
      title: 'Immortal+ Premier Team LF1 Duelist',
      mode: 'PREMIER',
      region: 'TR',
      languages: ['TR', 'EN'],
      seriousness: 'TRYHARD',
      voiceRequired: true,
      minRank: 'IMMORTAL',
      maxRank: 'RADIANT',
      stackSize: 4,
      desiredRole: 'DUELIST',
      description: 'Serious premier team looking for a skilled entry fragger. Must have Radiant peak and good game sense.',
      expiryMinutes: 240,
      expiresAt: new Date(Date.now() + 240 * 60 * 1000),
    },
  })

  // Create sample solo listings
  const soloListing1 = await prisma.listing.create({
    data: {
      ownerUserId: soloDuelist.id,
      listingType: 'SOLO',
      status: 'OPEN',
      title: 'Plat Duelist Main LFT Ranked',
      mode: 'RANKED',
      region: 'TR',
      languages: ['TR', 'EN'],
      seriousness: 'TRYHARD',
      voiceRequired: true,
      minRank: 'GOLD',
      maxRank: 'DIAMOND',
      desiredRole: 'DUELIST',
      description: 'Aggressive entry fragger looking for 4-stack. Good aim, positive attitude.',
      expiryMinutes: 60,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  const soloListing2 = await prisma.listing.create({
    data: {
      ownerUserId: controllerMain.id,
      listingType: 'SOLO',
      status: 'OPEN',
      title: 'Gold Controller LFT Chill Ranked',
      mode: 'RANKED',
      region: 'EU',
      languages: ['EN', 'FR'],
      seriousness: 'CASUAL',
      voiceRequired: false,
      minRank: 'SILVER',
      maxRank: 'PLATINUM',
      desiredRole: 'CONTROLLER',
      description: 'Looking for a chill 4-stack to play with. I play smokes, good comms.',
      expiryMinutes: 120,
      expiresAt: new Date(Date.now() + 120 * 60 * 1000),
    },
  })

  console.log('✅ Created sample listings')

  // Create sample application
  await prisma.listingApplication.create({
    data: {
      listingId: teamListing1.id,
      applicantUserId: controllerMain.id,
      message: 'Hey! I main Omen and Brimstone. Available for weekday evenings. Let me know!',
      status: 'pending',
    },
  })

  console.log('✅ Created sample application')

  // Create sample chat messages
  await prisma.listingMessage.createMany({
    data: [
      {
        listingId: teamListing1.id,
        senderUserId: teamCaptain.id,
        content: 'Looking for a controller to complete our team. Must have good smokes!',
      },
      {
        listingId: teamListing1.id,
        senderUserId: controllerMain.id,
        content: 'Hey! I play Omen and Brimstone. What times do you usually play?',
      },
      {
        listingId: teamListing1.id,
        senderUserId: teamCaptain.id,
        content: 'Usually 18:00-23:00 CET on weekdays. Can you join us tonight?',
      },
    ],
  })

  console.log('✅ Created sample chat messages')

  // Create sample ratings
  await prisma.playerRating.create({
    data: {
      raterUserId: teamCaptain.id,
      targetUserId: initiator.id,
      listingId: teamListing1.id,
      score: 1,
      tags: ['calm', 'good_comms', 'team_player'],
      comment: 'Great teammate, excellent comms and info gathering!',
    },
  })

  console.log('✅ Created sample rating')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📧 Test accounts:')
  console.log('   Email: admin@needone.gg (Admin)')
  console.log('   Email: captain@needone.gg (Team Captain)')
  console.log('   Email: duelist@needone.gg (Solo Duelist)')
  console.log('   Email: controller@needone.gg (Controller)')
  console.log('   Email: initiator@needone.gg (Initiator)')
  console.log('   Password for all: password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
