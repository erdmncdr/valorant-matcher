import { Message, EmbedBuilder, PrismaClient } from 'discord.js'

export async function handleLinkCommand(
  message: Message,
  args: string[],
  prisma: PrismaClient
) {
  // Get the linking code from arguments
  const linkingCode = args[0]

  if (!linkingCode) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF4655')
          .setTitle('❌ Missing Linking Code')
          .setDescription(
            '**How to link your account:**\n\n' +
            '1. Visit https://needone.gg/settings\n' +
            '2. Go to Discord Linking section\n' +
            '3. Copy your linking code\n' +
            '4. Use the command: `!needone link YOUR_CODE`'
          )
      ],
    })
  }

  try {
    // Find user with this linking code
    const user = await prisma.user.findFirst({
      where: {
        discordLinkingCode: linkingCode,
        discordLinkingCodeExpiry: {
          gte: new Date(),
        },
      },
      include: {
        playerProfile: true,
      },
    })

    if (!user) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF4655')
            .setTitle('❌ Invalid or Expired Code')
            .setDescription(
              'The linking code is invalid or has expired.\n\n' +
              'Please generate a new code at https://needone.gg/settings'
            )
        ],
      })
    }

    // Check if user already has a Discord account linked
    const existingLink = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        provider: 'discord',
      },
    })

    if (existingLink) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ Account Already Linked')
            .setDescription(
              'Your NeedOne account is already linked to a Discord account.\n\n' +
              'If you want to change it, please unlink first on the website.'
            )
        ],
      })
    }

    // Check if this Discord account is already linked to another user
    const discordAlreadyLinked = await prisma.socialAccount.findFirst({
      where: {
        provider: 'discord',
        providerUserId: message.author.id,
      },
    })

    if (discordAlreadyLinked) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF4655')
            .setTitle('❌ Discord Account Already Linked')
            .setDescription(
              'This Discord account is already linked to another NeedOne account.\n\n' +
              'Each Discord account can only be linked to one NeedOne account.'
            )
        ],
      })
    }

    // Create the social account link
    await prisma.socialAccount.create({
      data: {
        userId: user.id,
        provider: 'discord',
        providerUserId: message.author.id,
        username: `${message.author.username}#${message.author.discriminator}`,
      },
    })

    // Clear the linking code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        discordLinkingCode: null,
        discordLinkingCodeExpiry: null,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'RATING_RECEIVED',
        title: '🔗 Discord Account Linked',
        message: `Your Discord account ${message.author.username} has been successfully linked!`,
        link: '/settings',
      },
    })

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#00D9FF')
          .setTitle('✅ Account Linked Successfully!')
          .setDescription(
            `**Welcome, ${user.playerProfile?.nickname || 'Player'}!**\n\n` +
            `Your Discord account has been linked to your NeedOne account.\n\n` +
            `You can now:\n` +
            `• Use \`!needone lfg\` to search for teammates\n` +
            `• Use \`!needone stats\` to view your stats\n` +
            `• Receive Discord notifications for new applications`
          )
          .setFooter({ text: '🌐 Visit https://needone.gg' })
      ],
    })
  } catch (error) {
    console.error('Error in link command:', error)
    throw error
  }
}
