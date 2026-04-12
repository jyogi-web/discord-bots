import { createLogger, createShutdownManager } from '@discord-bots/shared';
import { createDiscordClient, setupErrorHandlers } from '@discord-bots/discord-api';
import { GatewayIntentBits, Partials } from 'discord.js';
import { config } from './config.js';
import { setupKawaii } from './features/kawaii.js';
import { setupEyesLips } from './features/eyes-lips.js';
import { setupGacha } from './features/gacha/gacha.js';
import { registerCommands } from './deploy-commands.js';

const logger = createLogger('toy-bear-bot');

const client = createDiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.Channel],
});

setupErrorHandlers(client, logger);

client.once('clientReady', async () => {
  logger.info(`${client.user!.tag} としてログインしました`);
  logger.info(`転送先チャンネルID: ${config.FORWARD_CHANNEL_ID}`);
  await registerCommands(logger);
});

if (config.features.kawaii) {
  setupKawaii(client, logger);
  logger.info('Feature: kawaii 有効');
} else {
  logger.info('Feature: kawaii 無効 (FEATURE_KAWAII=false)');
}

if (config.features.eyesLips) {
  setupEyesLips(client, logger);
  logger.info('Feature: eyes-lips 有効');
} else {
  logger.info('Feature: eyes-lips 無効 (FEATURE_EYES_LIPS=false)');
}

if (config.features.gacha) {
  setupGacha(client, logger);
  logger.info('Feature: gacha 有効');
} else {
  logger.info('Feature: gacha 無効 (FEATURE_GACHA=false)');
}

const shutdownManager = createShutdownManager(logger);
shutdownManager.onShutdown(async () => {
  logger.info('Discord クライアントを停止中...');
  logger.end(); // Axiom Transport のバッファをフラッシュ
  await new Promise(resolve => setTimeout(resolve, 1000));
  await client.destroy();
});
shutdownManager.register();

logger.info('Bot を起動中...');
client.login(config.DISCORD_TOKEN).catch((error) => {
  logger.error('ログインに失敗しました:', error);
  process.exit(1);
});
