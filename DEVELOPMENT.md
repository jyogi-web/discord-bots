# 開発ガイド

## 開発フロー

### ローカルでの動作確認

```bash
# 1. ビルド
npm run build --workspace=packages/shared
npm run build --workspace=packages/discord-api
npm run build --workspace=apps/toy-bear-bot

# 2. 起動
cd apps/toy-bear-bot
node dist/index.js
```

### Docker で本番に近い環境でテスト

```bash
# toy-bear-bot のみビルド・起動
docker compose up toy-bear-bot --build

# バックグラウンドで起動
docker compose up -d --build
```

### デプロイ

```bash
# 1. コミット・プッシュ
git add .
git commit -m "feat: ..."
git push

# 2. 本番サーバーで
git pull
docker compose up -d --build

# 3. 動作確認
docker compose logs -f toy-bear-bot
```

---

## 新しい機能の追加

### 手順

1. `apps/toy-bear-bot/src/features/` に新しいファイルを作成

```typescript
// apps/toy-bear-bot/src/features/my-feature.ts
import type { Client } from 'discord.js';
import type { Logger } from '@discord-bots/shared';

export function setupMyFeature(client: Client, logger: Logger): void {
  client.on('messageCreate', async (message) => {
    // 実装
  });

  logger.info('my-feature を初期化しました');
}
```

2. `apps/toy-bear-bot/src/index.ts` に追加

```typescript
import { setupMyFeature } from './features/my-feature.js';

// 既存の setup 呼び出しの後に追加
setupMyFeature(client, logger);
```

3. 必要な環境変数があれば `src/config.ts` と `.env.example` に追加

---

## ファイル構成

```text
discord-bots/
├── package.json               # npm workspaces 設定
├── tsconfig.base.json         # TypeScript 共通設定
├── docker-compose.yml
├── apps/
│   └── toy-bear-bot/
│       ├── src/
│       │   ├── index.ts       # エントリーポイント・Bot 初期化
│       │   ├── config.ts      # 環境変数の読み込みと定義
│       │   └── features/
│       │       ├── kawaii.ts  # :kawaii: リアクション転送
│       │       ├── eyes-lips.ts # :eyes: リアクション
│       │       └── gacha.ts   # /gacha コマンド
│       ├── Containerfile
│       ├── tsconfig.json
│       └── .env.example
├── packages/
│   ├── shared/                # logger / config / lifecycle
│   └── discord-api/           # Discord Client ヘルパー・Intent プリセット
└── services/
    └── text-gacha/            # Haskell 製テキストシャッフル API
```

---

## よく使うコマンド

```bash
# 依存関係インストール
npm install

# TypeScript ビルド（全パッケージ）
npm run build --workspace=packages/shared
npm run build --workspace=packages/discord-api
npm run build --workspace=apps/toy-bear-bot

# ログ確認
docker compose logs -f toy-bear-bot

# 再起動
docker compose restart toy-bear-bot

# コンテナに入る
docker compose exec toy-bear-bot sh

# workspace の依存関係がおかしくなった場合
rm -rf node_modules package-lock.json
npm install
```

---

## ベストプラクティス

- **ローカルで確認 → Docker でテスト → デプロイ** の順で進める
- `.env` は Git に含めない（`.gitignore` で除外済み）
- 新機能は `features/` に独立したファイルとして追加し、`index.ts` はシンプルに保つ
- ログは `logger.info` / `logger.error` を積極的に使う
