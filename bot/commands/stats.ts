import { Message, EmbedBuilder } from 'discord.js'
import { prisma } from '../../lib/prisma'

export async function handleStatsCommand(
  message: Message,
  args: string[],
  prisma: any
) {
  try {
    // Check if a user was mentioned
    let discordUserId = message.author.id
    let mentionedUser = message.author

    if (message.mentions.users.size > 0) {
      const mentioned = message.mentions.users.first()
      if (mentioned) {
        discordUserId = mentioned.id
        mentionedUser = mentioned
      }
    }

    // Find linked social account
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        provider: 'discord',
        providerUserId: discordUserId,
      },
      include: {
        user: {
          include: {
            playerProfile: true,
            listingsOwned: {
              where: {
                status: 'OPEN',
              },
            },
          },
        },
      },
    })

    if (!socialAccount) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF4655')
            .setTitle('❌ Account Not Linked')
            .setDescription(
              discordUserId === message.author.id
                ? '**Your Discord account is not linked to NeedOne.**\n\n' +
                  'To link your account:\n' +
                  '1. Visit https://needone.gg/settings\n' +
                  '2. Get your linking code\n' +
                  '3. Use: `!needone link YOUR_CODE`'
                : `**${mentionedUser.username}** has not linked their Discord account to NeedOne.`
            )
        ],
      })
    }

    const user = socialAccount.user
    const profile = user.playerProfile

    if (!profile) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ Profile Not Complete')
            .setDescription(
              'This user has not completed their NeedOne profile yet.\n\n' +
              'Visit https://needone.gg/profile/complete to set up your profile!'
            )
        ],
      })
    }

    // Fetch statistics
    const [totalListings, totalApplications, totalMessages, reputationStats] = await Promise.all([
      prisma.listing.count({
        where: { ownerUserId: user.id },
      }),
      prisma.listingApplication.count({
        where: { applicantUserId: user.id },
      }),
      prisma.listingMessage.count({
        where: { senderUserId: user.id },
      }),
      prisma.playerRating.groupBy({
        by: ['score'],
        where: { targetUserId: user.id },
        _count: true,
      }),
    ])

    const positiveRatings = reputationStats.find((r: any) => r.score === 1)?._count || 0
    const negativeRatings = reputationStats.find((r: any) => r.score === -1)?._count || 0
    const totalRatings = positiveRatings + negativeRatings

    // Create stats embed
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle(`📊 ${profile.nickname}${profile.tagline} - Stats`)
      .setDescription(`**NeedOne Profile Statistics**`)
      .addFields(
        {
          name: '🎮 Profile Info',
          value: [
            `**Rank:** ${profile.rankCurrent}`,
            `**Peak Rank:** ${profile.rankPeak}`,
            `**Main Role:** ${profile.mainRole}`,
            `**Region:** ${profile.region}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '💎 Reputation',
          value: [
            `**Total:** ${profile.reputationScore}`,
            `**Positive:** 👍 ${positiveRatings}`,
            `**Negative:** 👎 ${negativeRatings}`,
            totalRatings > 0 ? `**Rating:** ${Math.round((positiveRatings / totalRatings) * 100)}%` : '',
          ].filter(Boolean).join('\n'),
          inline: true,
        },
        {
          name: '📈 Activity',
          value: [
            `**Listings Created:** ${totalListings}`,
            `**Active Listings:** ${user.listingsOwned.length}`,
            `**Applications Sent:** ${totalApplications}`,
            `**Messages Sent:** ${totalMessages}`,
          ].join('\n'),
          inline: false,
        }
      )
      .setFooter({
        text: `🌐 View full profile at https://needone.gg/profile/${user.id}`
      })
      .setTimestamp()

    // Add admin badge if applicable
    if (user.isAdmin) {
      embed.setAuthor({ name: '🛡️ ADMIN' })
    }

    return message.reply({ embeds: [embed] })
  } catch (error) {
    console.error('Error in stats command:', error)
    throw error
  }
}
