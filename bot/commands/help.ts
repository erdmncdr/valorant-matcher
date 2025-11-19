import { Message, EmbedBuilder } from 'discord.js'

export async function handleHelpCommand(message: Message) {
  const embed = new EmbedBuilder()
    .setColor('#FF4655')
    .setTitle('🎮 NeedOne Discord Bot - Commands')
    .setDescription('VALORANT matchmaking bot for finding teammates')
    .addFields(
      {
        name: '🔗 !needone link <code>',
        value: 'Link your Discord account to NeedOne\nGet your code from: https://needone.gg/settings',
        inline: false,
      },
      {
        name: '🔍 !needone lfg [rank] [role]',
        value: 'Search for active listings\nExample: `!needone lfg Diamond Duelist`\nExample: `!needone lfg` (show all)',
        inline: false,
      },
      {
        name: '📊 !needone stats [@user]',
        value: 'View your stats or mention a user to see theirs\nExample: `!needone stats`\nExample: `!needone stats @username`',
        inline: false,
      },
      {
        name: '❓ !needone help',
        value: 'Show this help message',
        inline: false,
      }
    )
    .setFooter({ text: '🌐 Visit https://needone.gg to create listings and find teammates!' })
    .setTimestamp()

  await message.reply({ embeds: [embed] })
}
