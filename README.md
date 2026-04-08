# toy-bear-bot

じょぎ用の統合 Discord Bot。1つの Bot アカウントで複数の機能を提供します。

## 機能

| 機能 | 説明 |
|------|------|
| kawaii転送 | `:kawaii:` リアクションが押された投稿を指定チャンネルに転送 |
| eyes-lips | `:eyes:` / `👀` のメッセージに `👄` か `🫦` でリアクション |
| gacha | `/gacha` コマンドで文字をシャッフル |

## 構成

```
discord-bots/
├── package.json
├── tsconfig.base.json
├── docker-compose.yml
├── apps/
│   └── toy-bear-bot/          # 統合Bot（TypeScript）
│       ├── src/
│       │   ├── index.ts           # エントリーポイント
│       │   ├── config.ts          # 環境変数管理
│       │   ├── deploy-commands.ts # スラッシュコマンド登録
│       │   └── features/
│       │       ├── kawaii.ts  # kawaii転送機能
│       │       ├── eyes-lips.ts # eyes-lips機能
│       │       └── gacha.ts   # gachaコマンド
│       ├── Containerfile
│       └── .env.example
├── packages/
│   ├── shared/                # logger, config, lifecycle（TypeScript）
│   └── discord-api/           # Discord Client ヘルパー（TypeScript）
└── services/
    └── text-gacha/            # ガチャ用テキストシャッフルAPI（Haskell）
```

## クイックスタート

### 1. 環境変数を設定

```bash
cp apps/toy-bear-bot/.env.example apps/toy-bear-bot/.env
# .env を編集して DISCORD_TOKEN、CLIENT_ID、FORWARD_CHANNEL_ID を設定
```

`CLIENT_ID` は Discord Developer Portal → アプリ選択 → **Application ID** で確認できます。

### 2. 起動

```bash
# Docker
docker compose down
docker compose up -d --build

# Podman
podman compose down
podman compose up -d --build
```

> **スラッシュコマンドの登録はBot起動時に自動で行われます。**  
> グローバル登録のため、Discord全体への反映まで最大1時間かかります。

### 手動でコマンドを登録する場合

```bash
pnpm --filter @discord-bots/toy-bear-bot deploy
```

### 3. ログ確認

```bash
docker compose logs -f toy-bear-bot
```

詳細は [SETUP.md](./SETUP.md) を参照してください。

## 共通モジュールの使い方

### Logger

```typescript
import { createLogger } from '@discord-bots/shared';

const logger = createLogger('my-feature');
logger.info('起動中...');
logger.success('完了');
logger.error('エラー:', error);
```

### Config

```typescript
import { createConfig } from '@discord-bots/shared';

const config = createConfig({
  required: ['DISCORD_TOKEN'],
  optional: { LOG_LEVEL: 'info' }
});
```

### Discord Client

```typescript
import { createDiscordClient, getIntents } from '@discord-bots/discord-api';

const client = createDiscordClient({
  intents: getIntents('REACTION_MONITOR')
});
```

## 新しい機能の追加

`apps/toy-bear-bot/src/features/` に新しい `.ts` ファイルを作成し、`index.ts` から呼び出すだけです。
詳細は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

## ドキュメント

- [SETUP.md](./SETUP.md) — 環境構築・起動手順・トラブルシューティング
- [DEVELOPMENT.md](./DEVELOPMENT.md) — 開発フロー・機能追加手順
- [docker-commands.md](./docker-commands.md) — Docker/Podman コマンド集
