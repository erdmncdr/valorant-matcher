import { Message, EmbedBuilder, PrismaClient } from 'discord.js'

const RANK_ORDER = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Ascendant',
  'Immortal',
  'Radiant',
]

const ROLES = ['Duelist', 'Initiator', 'Controller', 'Sentinel', 'FLEX']

export async function handleLFGCommand(
  message: Message,
  args: string[],
  prisma: PrismaClient
) {
  try {
    // Parse filters from arguments
    let rankFilter: string | null = null
    let roleFilter: string | null = null

    // Check if args contain rank or role
    for (const arg of args) {
      const upperArg = arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase()

      // Check if it's a rank
      if (RANK_ORDER.some(rank => rank.toLowerCase() === arg.toLowerCase())) {
        rankFilter = upperArg
      }

      // Check if it's a role
      if (ROLES.some(role => role.toLowerCase() === arg.toLowerCase())) {
        roleFilter = arg.toUpperCase() === 'FLEX' ? 'FLEX' : upperArg
      }
    }

    // Build where clause
    const where: any = {
      status: 'OPEN',
      expiresAt: {
        gte: new Date(),
      },
    }

    if (rankFilter) {
      where.preferredRank = {
        contains: rankFilter,
      }
    }

    if (roleFilter) {
      where.lookingFor = roleFilter
    }

    // Fetch listings
    const listings = await prisma.listing.findMany({
      where,
      include: {
        owner: {
          include: {
            playerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to 5 results
    })

    if (listings.length === 0) {
      const filterText = []
      if (rankFilter) filterText.push(`Rank: ${rankFilter}`)
      if (roleFilter) filterText.push(`Role: ${roleFilter}`)

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🔍 No Listings Found')
            .setDescription(
              filterText.length > 0
                ? `No active listings found with filters: ${filterText.join(', ')}`
                : 'No active listings found'
            )
            .addFields({
              name: '💡 Tips',
              value:
                '• Try removing filters to see more results\n' +
                '• Create your own listing at https://needone.gg\n' +
                '• Check back later for new listings',
            })
        ],
      })
    }

    // Create embed with listings
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('🎮 Active Listings')
      .setDescription(
        listings.length === 5
          ? `Showing top ${listings.length} listings (more available on website)`
          : `Found ${listings.length} active listing${listings.length > 1 ? 's' : ''}`
      )

    // Add filter info if any
    if (rankFilter || roleFilter) {
      const filters = []
      if (rankFilter) filters.push(`**Rank:** ${rankFilter}`)
      if (roleFilter) filters.push(`**Role:** ${roleFilter}`)
      embed.addFields({
        name: '🔎 Filters Applied',
        value: filters.join(' | '),
        inline: false,
      })
    }

    // Add each listing
    listings.forEach((listing, index) => {
      const profile = listing.owner.playerProfile
      const nickname = profile?.nickname || 'Unknown'
      const tagline = profile?.tagline || ''
      const rank = profile?.rankCurrent || 'Unranked'
      const region = profile?.region || 'Unknown'

      const fieldValue = [
        `**${nickname}${tagline}** (${rank})`,
        `🌍 Region: ${region}`,
        `🎯 Looking for: ${listing.lookingFor}`,
        listing.preferredRank ? `📊 Preferred Rank: ${listing.preferredRank}` : '',
        listing.description ? `📝 ${listing.description.slice(0, 100)}${listing.description.length > 100 ? '...' : ''}` : '',
        `\n🔗 [View Listing](https://needone.gg/listings/${listing.id})`,
      ].filter(Boolean).join('\n')

      embed.addFields({
        name: `${index + 1}. ${listing.gameMode}${listing.competitive ? ' (Competitive)' : ' (Casual)'}`,
        value: fieldValue,
        inline: false,
      })
    })

    embed.setFooter({
      text: '🌐 Visit https://needone.gg to apply or create your own listing!'
    })

    return message.reply({ embeds: [embed] })
  } catch (error) {
    console.error('Error in lfg command:', error)
    throw error
  }
}
