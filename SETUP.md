# セットアップと起動手順

## 前提条件

- Node.js 24以上
- Docker
- Discord Bot Token

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp apps/toy-bear-bot/.env.example apps/toy-bear-bot/.env
```

`.env` を編集して以下を設定します：

```env
# 必須
DISCORD_TOKEN=your_discord_token_here
FORWARD_CHANNEL_ID=your_channel_id_here

# 任意（デフォルト値あり）
TARGET_EMOJI_NAME=kawaii
NODE_ENV=production
LOG_LEVEL=info
```

**Discord Bot Token の取得:**
1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. アプリを作成 → Bot タブ → Token をコピー
3. Privileged Gateway Intents で `MESSAGE CONTENT INTENT` を有効化

---

## 起動

### 本番環境（Docker）

```bash
# ビルドして起動（初回またはコード変更後）
docker compose up -d --build

# 既存イメージで起動
docker compose up -d
```

### ローカル開発

```bash
# TypeScript をビルド
npm run build --workspace=packages/shared
npm run build --workspace=packages/discord-api
npm run build --workspace=apps/toy-bear-bot

# 起動
cd apps/toy-bear-bot
node dist/index.js
```

---

## 操作コマンド

```bash
# ログをリアルタイム表示
docker compose logs -f toy-bear-bot

# 停止
docker compose down

# 再起動
docker compose restart toy-bear-bot

# コンテナ状態確認
docker compose ps
```

---

## トラブルシューティング

### `Cannot find package '@discord-bots/shared'`

```bash
rm -rf node_modules package-lock.json
npm install
```

### コンテナが起動しない

```bash
# ログを確認
docker compose logs toy-bear-bot

# 強制再ビルド
docker compose up -d --build --force-recreate
```

### 環境変数が読み込まれない

`.env` が `apps/toy-bear-bot/.env` に存在するか確認してください。

```bash
ls apps/toy-bear-bot/.env
```

### `Invalid token` エラー

[Discord Developer Portal](https://discord.com/developers/applications) でトークンを再生成して `.env` を更新してください。
