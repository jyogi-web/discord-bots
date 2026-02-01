import { createConfig } from '@discord-bots/shared';

// 環境変数を読み込み
const envConfig = createConfig({
  required: ['DISCORD_TOKEN'],
  optional: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info'
  }
});

// Bot固有の設定
export const config = {
  ...envConfig,

  // リアクション設定
  reactions: {
    triggers: [':eyes:', '👀'],  // メッセージに含まれているかチェックする文字列
    responses: ['👄', '🫦']  // lips, biting_lip - ランダムに選択される絵文字
  }
};
