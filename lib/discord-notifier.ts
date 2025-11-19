import { EmbedBuilder } from 'discord.js'
import { prisma } from './prisma'

// This will be populated by the bot when it starts
let discordClient: any = null

export function setDiscordClient(client: any) {
  discordClient = client
}

export async function sendDiscordNotification(
  userId: string,
  notification: {
    title: string
    message: string
    link?: string
    color?: string
  }
) {
  try {
    // Check if Discord bot is available
    if (!discordClient) {
      console.log('Discord bot not available, skipping Discord notification')
      return false
    }

    // Find user's Discord account
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId,
        provider: 'discord',
      },
    })

    if (!socialAccount) {
      console.log(`User ${userId} does not have Discord linked`)
      return false
    }

    // Try to fetch and send DM to user
    try {
      const user = await discordClient.users.fetch(socialAccount.providerUserId)

      if (!user) {
        console.log(`Could not find Discord user ${socialAccount.providerUserId}`)
        return false
      }

      const embed = new EmbedBuilder()
        .setColor(notification.color || '#00D9FF')
        .setTitle(notification.title)
        .setDescription(notification.message)
        .setFooter({ text: '🌐 NeedOne - VALORANT Matchmaking' })
        .setTimestamp()

      if (notification.link) {
        embed.addFields({
          name: '🔗 View on Website',
          value: `https://needone.gg${notification.link}`,
        })
      }

      await user.send({ embeds: [embed] })
      console.log(`✅ Discord notification sent to ${socialAccount.username}`)
      return true
    } catch (dmError: any) {
      // User might have DMs disabled
      if (dmError.code === 50007) {
        console.log(`User ${socialAccount.username} has DMs disabled`)
      } else {
        console.error('Error sending Discord DM:', dmError)
      }
      return false
    }
  } catch (error) {
    console.error('Error in sendDiscordNotification:', error)
    return false
  }
}

// Helper to send application notification
export async function notifyNewApplication(
  listingOwnerId: string,
  applicantName: string,
  listingId: string
) {
  return sendDiscordNotification(listingOwnerId, {
    title: '📩 New Application Received!',
    message: `**${applicantName}** has applied to your listing.`,
    link: `/listings/${listingId}`,
    color: '#00D9FF',
  })
}

// Helper to send application accepted notification
export async function notifyApplicationAccepted(
  applicantId: string,
  listingTitle: string,
  listingId: string
) {
  return sendDiscordNotification(applicantId, {
    title: '✅ Application Accepted!',
    message: `Your application for **${listingTitle}** has been accepted!`,
    link: `/listings/${listingId}`,
    color: '#00FF00',
  })
}

// Helper to send application declined notification
export async function notifyApplicationDeclined(
  applicantId: string,
  listingTitle: string,
  listingId: string
) {
  return sendDiscordNotification(applicantId, {
    title: '❌ Application Declined',
    message: `Your application for **${listingTitle}** has been declined.`,
    link: `/listings/${listingId}`,
    color: '#FF4655',
  })
}

// Helper to send new message notification
export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  messagePreview: string,
  listingId: string
) {
  return sendDiscordNotification(recipientId, {
    title: '💬 New Message',
    message: `**${senderName}** sent you a message:\n"${messagePreview.slice(0, 100)}${messagePreview.length > 100 ? '...' : ''}"`,
    link: `/listings/${listingId}`,
    color: '#A855F7',
  })
}

// Helper to send rating received notification
export async function notifyRatingReceived(
  userId: string,
  raterName: string,
  isPositive: boolean
) {
  return sendDiscordNotification(userId, {
    title: isPositive ? '⭐ Positive Rating Received!' : '👎 Rating Received',
    message: `**${raterName}** has rated you ${isPositive ? 'positively' : 'negatively'}.`,
    link: `/profile/${userId}`,
    color: isPositive ? '#FFD700' : '#FF4655',
  })
}
