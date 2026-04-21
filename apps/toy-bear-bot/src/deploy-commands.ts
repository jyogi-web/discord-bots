import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';
import { config } from './config.js';
import type { Logger } from '@discord-bots/shared';

const COMMANDS = [
  {
    name: 'gacha',
    description: '情報技術研究部の文字をシャッフルします',
  },
  {
    name: 'superchat',
    description: 'スーパーチャット風の画像を生成します',
    options: [
      {
        name: '金額',
        description: '100〜50,000円',
        type: ApplicationCommandOptionType.Integer,
        required: true,
        min_value: 100,
        max_value: 50000,
      },
      {
        name: 'コメント',
        description: 'コメント（金額により最大文字数が変わります）',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

];

export async function registerCommands(logger: Logger): Promise<void> {
  const rest = new REST().setToken(config.DISCORD_TOKEN);
  logger.info('グローバルスラッシュコマンドを登録中...');
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: COMMANDS });
  logger.info('グローバルスラッシュコマンドの登録が完了しました（反映まで最大1時間かかります）');
}

// 手動実行用: `node dist/deploy-commands.js` で直接実行された場合のみ動作
const isMain = process.argv[1]?.endsWith('deploy-commands.js');
if (isMain) {
  const { createLogger } = await import('@discord-bots/shared');
  const logger = createLogger('deploy-commands');
  await registerCommands(logger);
}
