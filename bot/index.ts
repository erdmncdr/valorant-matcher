import { Client, GatewayIntentBits, Events, Message, EmbedBuilder } from 'discord.js'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { setDiscordClient } from '../lib/discord-notifier'

// Load environment variables
dotenv.config()

// Initialize Prisma
const prisma = new PrismaClient()

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
})

// Import commands
import { handleLinkCommand } from './commands/link'
import { handleLFGCommand } from './commands/lfg'
import { handleStatsCommand } from './commands/stats'
import { handleHelpCommand } from './commands/help'

// Bot ready event
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Discord Bot is ready! Logged in as ${c.user.tag}`)
  console.log(`📊 Serving ${c.guilds.cache.size} servers`)

  // Set Discord client for notifications
  setDiscordClient(c)
  console.log('📬 Discord notification system enabled')

  // Set bot status
  c.user.setPresence({
    activities: [{ name: 'VALORANT matchmaking | !needone help' }],
    status: 'online',
  })
})

// Message handler
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return

  // Only respond to messages starting with !needone
  if (!message.content.toLowerCase().startsWith('!needone')) return

  // Parse command and arguments
  const args = message.content.slice(9).trim().split(/ +/)
  const command = args.shift()?.toLowerCase()

  try {
    switch (command) {
      case 'link':
        await handleLinkCommand(message, args, prisma)
        break

      case 'lfg':
        await handleLFGCommand(message, args, prisma)
        break

      case 'stats':
        await handleStatsCommand(message, args, prisma)
        break

      case 'help':
      case undefined:
        await handleHelpCommand(message)
        break

      default:
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF4655')
              .setTitle('❌ Unknown Command')
              .setDescription(`Unknown command: \`${command}\`\n\nUse \`!needone help\` to see all available commands.`)
          ],
        })
    }
  } catch (error) {
    console.error('Error handling command:', error)
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF4655')
          .setTitle('❌ Error')
          .setDescription('An error occurred while processing your command. Please try again later.')
      ],
    })
  }
})

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
})

// Login to Discord
const token = process.env.DISCORD_BOT_TOKEN
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is not defined in environment variables')
  process.exit(1)
}

client.login(token).catch((error) => {
  console.error('❌ Failed to login to Discord:', error)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Shutting down Discord bot...')
  await prisma.$disconnect()
  client.destroy()
  process.exit(0)
})

export { client, prisma }
