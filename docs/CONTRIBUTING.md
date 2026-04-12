# コントリビューションガイド

## 目次

- [開発の進め方](#開発の進め方)
- [テスト用 Bot について](#テスト用-bot-について)
- [環境変数・トークンの取得](#環境変数トークンの取得)
- [Axiom ログ基盤](#axiom-ログ基盤)
- [新機能の追加手順](#新機能の追加手順)
- [コミット・PR のルール](#コミットpr-のルール)

---

## 開発の進め方

**本番環境では動作確認しない。** 開発中の変更は必ずテスト用 Bot で確認してから PR を出す。

```
ローカル開発（テスト用 Bot） → PR → レビュー → main マージ → 本番自動反映
```

### ローカル起動

```bash
npm install
cp apps/toy-bear-bot/.env.example apps/toy-bear-bot/.env
# .env を編集（後述）

# 開発サーバー起動（tsx によるホットリロード）
npm run dev --workspace=apps/toy-bear-bot
```

### テスト

```bash
# 全テスト実行
npx vitest run

# 型チェック
npm run typecheck --workspace=apps/toy-bear-bot
```

TDD を採用している。新機能・修正はテストから書き始める（Red → Green → Refactor）。

---

## テスト用 Bot について

開発・動作確認には専用のテスト用 Bot を使用する。

**招待リンク:**
```
https://discord.com/oauth2/authorize?client_id=1492830192962375801&scope=bot&permissions=8515702525131840
```

テスト用 Bot の Token は管理者に確認すること。`.env` の `DISCORD_TOKEN` にセットして使う。

> 本番 Bot のトークンをローカル開発環境に設定しない。

---

## 環境変数・トークンの取得

`.env.example` をコピーして `.env` を作成し、以下を埋める。

### DISCORD_TOKEN

テスト用 Bot のトークン（管理者から共有）。

本番用トークンが必要な場合:
1. [Discord Developer Portal](https://discord.com/developers/applications) → アプリを選択
2. Bot タブ → Token をリセット・コピー
3. Privileged Gateway Intents で `MESSAGE CONTENT INTENT` を有効化

### CLIENT_ID

Discord Developer Portal → アプリを選択 → Application ID をコピー。

### FORWARD_CHANNEL_ID

kawaii 機能のリアクション転送先チャンネルの ID。  
Discord でチャンネルを右クリック →「ID をコピー」（開発者モードが必要）。

### AXIOM_TOKEN / AXIOM_DATASET

ログ基盤として Axiom を使用している。後述の [Axiom ログ基盤](#axiom-ログ基盤) を参照。

### DISCORD_ERROR_WEBHOOK_URL（省略可）

エラーログを Discord に即時通知したい場合に設定する。  
Discord チャンネル設定 → 連携サービス → Webhook を作成して URL をコピー。

---

## Axiom ログ基盤

Bot のログ（アクションログ・エラーログ）はすべて [Axiom](https://axiom.co/) に送信される。  
ローカル開発ではログは Console にも出力されるため、Axiom 未設定でも動作確認は可能。

### Axiom の設定手順

1. [axiom.co](https://axiom.co/) でアカウントを作成
2. Dataset を作成する

   | 項目 | 開発用 | 本番用 |
   |---|---|---|
   | Name | `discord-bots-dev` | `discord-bots-prod` |
   | Kind | Events | Events |
   | Data retention | 30 days | 30 days |

3. Settings → API Tokens → **New Token** を作成
   - 対象 Dataset への **Ingest 権限のみ** を付与（最小権限）
   - 開発用・本番用で Token を分けることを推奨

4. `.env` に設定

   ```env
   AXIOM_TOKEN=xaat-xxxxxxxxxx
   AXIOM_DATASET=discord-bots-dev   # 開発時
   # AXIOM_DATASET=discord-bots-prod  # 本番時
   ```

### Axiom でのログ確認

Axiom の Explorer で以下の APL クエリが使える：

```sql
-- gacha のアクションログを確認
['discord-bots-dev']
| where feature == 'gacha'
| project _time, action, user

-- エラーのみ表示
['discord-bots-dev']
| where level == 'error'

-- Bot 別に件数を集計
['discord-bots-dev']
| summarize count() by bot
```

### ログのフィールド構成

```json
{
  "_time": "2026-04-13T12:00:00.000Z",
  "level": "info",
  "message": "gacha: 全て揃えた",
  "bot": "toy-bear-bot",
  "feature": "gacha",
  "action": "all_correct",
  "user": "alice"
}
```

`bot` フィールドで Bot を、`feature` + `action` でイベント種別を区別できる。

---

## 新機能の追加手順

1. `apps/toy-bear-bot/src/features/` に新しいファイルを作成

   ```typescript
   // apps/toy-bear-bot/src/features/my-feature.ts
   import type { Client } from 'discord.js';
   import type { Logger } from '@discord-bots/shared';

   export function setupMyFeature(client: Client, logger: Logger): void {
     client.on('messageCreate', async (message) => {
       // 実装
       logger.info('my-feature: イベント発生', {
         feature: 'my-feature',
         action: 'event_name',
         user: message.author.username,
       });
     });

     logger.info('my-feature を初期化しました');
   }
   ```

2. `apps/toy-bear-bot/src/index.ts` に追加

   ```typescript
   import { setupMyFeature } from './features/my-feature.js';
   setupMyFeature(client, logger);
   ```

3. 必要な環境変数があれば `src/config.ts` と `.env.example` に追加

4. テストを書く（`packages/shared/` 以下のロジックは必ずテストを書く）

---

## コミット・PR のルール

- コミットメッセージは `feat:` / `fix:` / `chore:` 等のプレフィックスをつける
- PR はテスト用 Bot で動作確認してから出す
- `GACHA_DEBUG` など開発用フラグを `true` にしたままコミットしない
- `.env` は絶対にコミットしない（`.gitignore` で除外済み）
