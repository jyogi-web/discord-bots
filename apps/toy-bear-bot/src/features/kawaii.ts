import { EmbedBuilder, type Client, type MessageReaction, type User, type GuildTextBasedChannel } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import { config } from '../config.js';

export function setupKawaii(client: Client, logger: Logger): void {
  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      if (user.bot) return;

      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          logger.error('リアクション情報補完失敗:', error);
          return;
        }
      }

      if (reaction.emoji.name !== config.kawaii.emojiName) return;

      if (reaction.message.partial) {
        try {
          await reaction.message.fetch();
        } catch (error) {
          logger.error('メッセージ情報補完失敗:', error);
          return;
        }
      }

      const forwardChannel = client.channels.cache.get(config.FORWARD_CHANNEL_ID);
      if (!forwardChannel) {
        logger.error('転送先チャンネルが見つかりません');
        return;
      }

      if (!forwardChannel.isTextBased() || forwardChannel.isDMBased()) {
        logger.error('転送先チャンネルはサーバーのテキストチャンネルではありません');
        return;
      }

      const guildChannel = forwardChannel as GuildTextBasedChannel;
      if (!client.user) {
        logger.error('client.user が null です（ready前に呼ばれた可能性）');
        return;
      }
      const permissions = guildChannel.permissionsFor(client.user);
      if (!permissions?.has(['SendMessages', 'EmbedLinks'])) {
        logger.error('転送先チャンネルへの送信権限がありません');
        return;
      }

      const embed = createMessageEmbed(reaction as MessageReaction, user as User);
      await guildChannel.send({ embeds: [embed] });

      logger.info('kawaii: メッセージを転送しました', {
        feature: 'kawaii',
        action: 'forward',
        user: (user as User).username,
        messageId: reaction.message.id,
        emoji: reaction.emoji.name,
      });
    } catch (error) {
      logger.error('メッセージ転送エラー:', error);
    }
  });

  logger.info(`kawaii機能を初期化しました (emoji: ${config.kawaii.emojiName})`);
}

function createMessageEmbed(reaction: MessageReaction, reactor: User): EmbedBuilder {
  const message = reaction.message;
  const author = message.author;
  const embed = new EmbedBuilder()
    .setTitle('リアクションで共有されました')
    .setDescription(message.content || '（内容なし）');

  if (author) {
    embed.setAuthor({
      name: author.tag,
      iconURL: author.displayAvatarURL(),
    });
  }

  embed.addFields(
      { name: 'チャンネル', value: `#${'name' in message.channel ? message.channel.name : 'DM'}`, inline: true },
      { name: '反応したユーザー', value: reactor.tag, inline: true },
      { name: '送信日時', value: message.createdAt.toLocaleString('ja-JP'), inline: false }
    )
    .setURL(message.url)
    .setColor(0x9c27b0)
    .setTimestamp();

  if (message.attachments.size > 0) {
    const attachmentList = [...message.attachments.values()]
      .map((att, idx) => `[${idx + 1}] ${att.name} (${(att.size / 1024).toFixed(2)} KB)`)
      .join('\n');
    embed.addFields({ name: '添付ファイル', value: attachmentList, inline: false });
  }

  return embed;
}
