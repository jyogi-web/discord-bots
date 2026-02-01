import { createLogger } from '@discord-bots/shared';
import { createDiscordClient, IntentPresets, setupErrorHandlers } from '@discord-bots/utils';
import { config } from './config.js';

const logger = createLogger('eyes-lips-bot');

// Discord Client の作成
export const client = createDiscordClient({
  intents: IntentPresets.MESSAGE_READER
});

// エラーハンドラーの設定
setupErrorHandlers(client, logger);

// Bot準備完了
client.once('ready', () => {
  logger.success(`${client.user.tag} としてログインしました`);
  logger.info(`メッセージを監視中: ${config.reactions.triggers.join(' または ')}`);
  logger.info(`リアクション: ${config.reactions.responses.join(' または ')}`);
});

// メッセージ送信イベント
client.on('messageCreate', async (message) => {
  try {
    // Botのメッセージは無視
    if (message.author.bot) return;

    // メッセージ内容が :eyes: または 👀 単体かチェック
    const messageContent = message.content.trim();
    const isTrigger = config.reactions.triggers.some(trigger =>
      messageContent === trigger
    );

    if (!isTrigger) return;

    // ランダムに絵文字を選択
    const randomIndex = Math.floor(Math.random() * config.reactions.responses.length);
    const randomEmoji = config.reactions.responses[randomIndex];

    // リアクション追加
    await message.react(randomEmoji);

    logger.info(
      `👀 → ${randomEmoji} メッセージにリアクションしました`,
      `ID: ${message.id}`,
      `チャンネル: #${message.channel.name || 'DM'}`
    );

  } catch (error) {
    logger.error('メッセージ処理エラー:', error.message);
  }
});

// ログイン関数
export function login() {
  return client.login(config.DISCORD_TOKEN);
}
