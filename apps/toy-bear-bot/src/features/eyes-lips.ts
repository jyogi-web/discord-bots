import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';
import type { KVLogSink } from '@discord-bots/storage';
import { config } from '../config.js';

export function setupEyesLips(client: Client, logger: Logger, logSink?: KVLogSink): void {
  client.on('messageCreate', async (message) => {
    try {
      if (message.author.bot) return;

      const content = message.content.trim();
      const isTrigger = config.eyesLips.triggers.some((trigger) => content === trigger);
      if (!isTrigger) return;

      const randomEmoji = config.eyesLips.responses[
        Math.floor(Math.random() * config.eyesLips.responses.length)
      ];

      await message.react(randomEmoji);

      logger.info(
        `👀 → ${randomEmoji} メッセージにリアクションしました`,
        `ID: ${message.id}`,
        `チャンネル: #${'name' in message.channel ? message.channel.name : 'DM'}`
      );
      logSink?.record({
        feature: 'eyes-lips',
        action: 'react',
        user: message.author.username,
        extra: { emoji: randomEmoji },
      });
    } catch (error) {
      logger.error('メッセージ処理エラー:', error);
    }
  });

  logger.info(`eyes-lips機能を初期化しました (triggers: ${config.eyesLips.triggers.join(', ')})`);
}
