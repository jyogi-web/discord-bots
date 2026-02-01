# Eyes-Lips Bot 👀💋

Discord botで、サーバー内で`:eyes:` (👀) **単体のメッセージ**が送信されたら、`:lips:` (👄)または`:biting_lip:` (🫦)をランダムでリアクションします。

## 機能

- `:eyes:` または `👀` **だけ**のメッセージにリアクション
- 👄 と 🫦 をランダムで選択
- Podman環境で簡単にデプロイ可能

## 必要要件

- Node.js 24以上（ローカル開発の場合）
- Podman（コンテナ環境で実行する場合）
- Discord Bot Token

---

## 🚀 セットアップ

### ステップ1: Discord Developer Portalでの設定

#### 1.1 アプリケーションとBotの作成

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 「**New Application**」をクリックしてアプリケーションを作成
3. アプリケーション名を入力して「Create」

#### 1.2 Botトークンの取得

1. 左メニューから「**Bot**」を選択
2. 「**Reset Token**」をクリックしてトークンを生成
3. **トークンをコピーして安全な場所に保存**（後で.envファイルに設定します）

#### 1.3 ⚠️ MESSAGE CONTENT INTENT の有効化（最重要！）

**これを忘れるとBotが起動しません！**

1. 同じ「**Bot**」タブで**下にスクロール**
2. 「**Privileged Gateway Intents**」セクションを探す
3. 「**MESSAGE CONTENT INTENT**」を**ONにする** ✅
4. 「**Save Changes**」をクリック

> **注意:** MESSAGE CONTENT INTENTを有効にしないと、`Used disallowed intents` エラーが発生してBotが起動できません。

#### 1.4 Botをサーバーに招待

**方法1: URL Generator を使う**

1. 左メニューから「**OAuth2**」→「**URL Generator**」を選択
2. **Scopes**で「**bot**」を選択
3. **Bot Permissions**で以下を選択:
   - ✅ **View Channels** (Read Messages/View Channels)
   - ✅ **Add Reactions**
4. 生成されたURLをコピーしてブラウザで開く
5. Botを招待するサーバーを選択して「認証」

**方法2: 直接URLを使う**

以下のURLの`YOUR_CLIENT_ID`を、「General Information」ページの「Application ID」に置き換えてブラウザで開く:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1088&scope=bot
```

---

### ステップ2: Botのセットアップと起動

#### オプション1: Podman環境で実行（推奨）

```bash
# 1. .envファイルを作成
cp .env.example .env

# 2. .envファイルを編集してDISCORD_TOKENを設定
# DISCORD_TOKEN=your_actual_token_here

# 3. package-lock.jsonを生成（初回のみ）
npm install

# 4. Podman Composeで起動
podman-compose up -d --build

# 5. ログを確認
podman-compose logs -f
```

**起動成功の確認:**
```
✅ eyes-lips-bot#XXXX としてログインしました
👀 メッセージを監視中: :eyes: または 👀
💋 リアクション: 👄 または 🫦
```

#### オプション2: ローカル環境で実行

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数ファイルの作成
cp .env.example .env

# 3. .envファイルを編集してDISCORD_TOKENを設定
# DISCORD_TOKEN=your_actual_token_here

# 4. Botの起動
npm start

# または開発モード（ファイル変更時に自動再起動）
npm run dev
```

---

## 📖 使い方

### リアクションされる例

以下のメッセージに対して、Botが👄または🫦をランダムでリアクションします:

- `:eyes:` だけを送信
- `👀` だけを送信
- ` :eyes: ` （前後に空白があってもOK）

### リアクションされない例

- `hello :eyes:` ← 単体じゃない
- `:eyes: test` ← 単体じゃない
- `eyes` ← 絵文字じゃない
- `:eye:` ← スペルが違う

---

## 🔧 開発・メンテナンス

### コード変更後の再ビルド

ソースコード（`src/`以下）を変更した場合:

```bash
# Podman環境の場合
podman-compose down
podman-compose up -d --build

# ローカル環境の場合（devモードなら自動再起動）
# Ctrl+C で停止して再度 npm start
```

### ログの確認

```bash
# Podman環境
podman logs -f eyes-lips-bot

# ローカル環境
# コンソールに直接出力されます
```

### コンテナの停止・削除

```bash
# 停止
podman-compose down

# または個別に
podman stop eyes-lips-bot
podman rm eyes-lips-bot
```

---

## ⚠️ トラブルシューティング

### エラー: `Used disallowed intents`

**原因:** MESSAGE CONTENT INTENTが有効化されていない

**解決策:**
1. Discord Developer Portalの「Bot」タブを開く
2. 下にスクロールして「Privileged Gateway Intents」を探す
3. 「MESSAGE CONTENT INTENT」をONにする
4. 「Save Changes」をクリック
5. Botを再起動: `podman-compose restart`

### エラー: `DISCORD_TOKEN is not defined`

**原因:** .envファイルが存在しないか、トークンが設定されていない

**解決策:**
1. `.env.example`をコピーして`.env`を作成
2. `.env`ファイルを開いて`DISCORD_TOKEN=`の後にトークンを貼り付け
3. Botを再起動

### Botがリアクションしない

**確認事項:**

1. **Botがオンラインか確認**
   - Discordサーバーでメンバーリストを見る
   - ログを確認: `podman logs eyes-lips-bot`

2. **メッセージが単体の`:eyes:`か確認**
   - `:eyes:`だけを送信（他の文字を含めない）
   - または`👀`だけを送信

3. **Bot権限を確認**
   - サーバー設定 → 役職 → Botの役職
   - 「メッセージを読む」と「リアクションの追加」が有効か確認

4. **チャンネル権限を確認**
   - チャンネル設定 → 権限 → Bot役職
   - 「メッセージを読む」と「リアクションの追加」を許可

### npm ci エラー（package-lock.jsonがない）

**原因:** `package-lock.json`が存在しない

**解決策:**
```bash
npm install  # package-lock.jsonを生成
podman-compose up -d --build  # 再ビルド
```

---

## 📁 プロジェクト構造

```
eyes-lips-bot/
├── src/
│   ├── index.js       # エントリーポイント
│   ├── bot.js         # メインロジック
│   └── config.js      # 設定管理
├── Containerfile      # Podmanイメージ定義
├── docker-compose.yml # Podman Compose設定
├── package.json       # 依存関係
├── .env.example       # 環境変数テンプレート
├── .gitignore         # Git除外設定
└── README.md          # このファイル
```

---

## 🔐 セキュリティ

- `.env`ファイルは`.gitignore`に含まれており、Gitにコミットされません
- Botトークンは絶対に公開しないでください
- トークンが漏洩した場合は、Discord Developer Portalで即座に再生成してください

---

## 📝 ライセンス

MIT

---

## 🆘 サポート

問題が発生した場合は、以下を確認してください:

1. このREADMEのトラブルシューティングセクション
2. ログ出力（`podman logs eyes-lips-bot`）
3. Discord Developer Portalの設定（特にMESSAGE CONTENT INTENT）

それでも解決しない場合は、ログのエラーメッセージを確認して、設定を見直してください。
