import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';

export function setupErrorHandlers(client: Client, logger: Logger): void {
  client.on('error', (error) => {
    logger.error('Discord クライアントエラー:', error);
  });

  client.on('warn', (warning) => {
    logger.warn('Discord 警告:', warning);
  });

  process.on('unhandledRejection', (error) => {
    logger.error('未処理の Promise rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    logger.error('未処理の例外:', error);
    process.exit(1);
  });
}
