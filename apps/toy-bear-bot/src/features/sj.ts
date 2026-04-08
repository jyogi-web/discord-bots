import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import { FIVE_MATCH_STICKER_ID } from './gacha.js';

export function setupSj(client: Client, logger: Logger): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'sj') return;

    if (!interaction.channel?.isSendable()) {
      await interaction.reply({ content: 'このチャンネルには送信できません', ephemeral: true });
      return;
    }

    await interaction.reply({ content: 'ステッカー送信！', ephemeral: true });
    await interaction.channel.send({ stickers: [FIVE_MATCH_STICKER_ID] });
    logger.info(`/sj: ステッカーを送信しました (channel: ${interaction.channelId})`);
  });

  logger.info('sj機能を初期化しました');
}
