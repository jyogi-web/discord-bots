import { createLogger, createShutdownManager } from '@discord-bots/shared';
import { login, client } from './bot.js';

const logger = createLogger('eyes-lips-bot');

// Bot起動
logger.info('Bot を起動中...');

login().catch((error) => {
  logger.error('ログインに失敗しました:', error);
  process.exit(1);
});

// グレースフルシャットダウンの設定
const shutdownManager = createShutdownManager(logger);
shutdownManager.onShutdown(async () => {
  logger.info('Discord クライアントを停止中...');
  await client.destroy();
});
shutdownManager.register();
