import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import type { Logger } from '@discord-bots/shared';

const COMMANDS = [
  {
    name: 'gacha',
    description: '情報技術研究部の文字をシャッフルします',
  },
  {
    name: 'sj',
    description: 'ステッカーを送信します（テスト用）',
  },
];

export async function registerCommands(logger: Logger): Promise<void> {
  const rest = new REST().setToken(config.DISCORD_TOKEN);
  logger.info('グローバルスラッシュコマンドを登録中...');
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: COMMANDS });
  logger.success('グローバルスラッシュコマンドの登録が完了しました（反映まで最大1時間かかります）');
}

// 手動実行用: `node dist/deploy-commands.js` で直接実行された場合のみ動作
const isMain = process.argv[1]?.endsWith('deploy-commands.js');
if (isMain) {
  const { createLogger } = await import('@discord-bots/shared');
  const logger = createLogger('deploy-commands');
  await registerCommands(logger);
}
