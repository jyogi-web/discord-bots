# Docker/Podman コマンド集

ルートディレクトリ (`/path/to/discord-bots`) で実行するコマンド一覧です。

## 基本操作

### 全てのボットを起動

```bash
# ビルドして起動（初回 or コード変更時）
podman-compose up -d --build

# 既存イメージで起動
podman-compose up -d
```

### 特定のボットのみ起動

```bash
# eyes-lips-bot のみ起動
podman-compose up -d eyes-lips-bot

# 複数指定（将来的に）
podman-compose up -d eyes-lips-bot music-bot
```

### 停止

```bash
# 全てのボットを停止
podman-compose stop

# 特定のボットのみ停止
podman-compose stop eyes-lips-bot

# 停止してコンテナ削除
podman-compose down
```

### 再起動

```bash
# 全てのボットを再起動
podman-compose restart

# 特定のボットのみ再起動
podman-compose restart eyes-lips-bot
```

## ログ確認

### ログをリアルタイム表示

```bash
# 全てのボットのログ
podman-compose logs -f

# 特定のボットのログ
podman-compose logs -f eyes-lips-bot

# 最新50行のみ表示
podman-compose logs --tail 50 -f eyes-lips-bot
```

### ログを一度だけ表示

```bash
# 全てのボット
podman-compose logs

# 最新100行
podman-compose logs --tail 100
```

## ステータス確認

### 起動中のコンテナ一覧

```bash
podman-compose ps
```

出力例:
```
NAME            IMAGE                      COMMAND              STATUS
eyes-lips-bot   discord-bots-eyes-lips-bot node src/index.js   Up 5 minutes
```

### リソース使用状況

```bash
podman stats
```

出力例:
```
CONTAINER       CPU %   MEM USAGE / LIMIT   MEM %   NET IO      BLOCK IO    PIDS
eyes-lips-bot   0.5%    50MB / 8GB          0.6%    1kB / 0B    0B / 0B     10
```

## ビルド管理

### 強制リビルド

```bash
# キャッシュを使わずに再ビルド
podman-compose build --no-cache

# 再ビルドして起動
podman-compose up -d --build --force-recreate
```

### イメージの確認

```bash
# ビルドされたイメージ一覧
podman images | grep discord-bots
```

### 不要なイメージを削除

```bash
# 未使用イメージの削除
podman image prune -f

# 全ての未使用リソースを削除（注意）
podman system prune -a
```

## トラブルシューティング

### コンテナに入る

```bash
# eyes-lips-bot のコンテナ内でシェルを起動
podman exec -it eyes-lips-bot sh

# コンテナ内で確認
pwd                    # 作業ディレクトリ確認
ls -la                 # ファイル確認
node --version         # Node.jsバージョン確認
exit                   # 終了
```

### 環境変数の確認

```bash
# eyes-lips-bot の環境変数を表示
podman exec eyes-lips-bot env | grep DISCORD
```

### ログファイルの場所

```bash
# ログファイルの確認
podman inspect eyes-lips-bot | grep LogPath
```

### コンテナの完全な再作成

```bash
# 停止 → 削除 → 再作成
podman-compose down
podman-compose up -d --build --force-recreate
```

## 高度な操作

### 特定のボットをスケール（複数起動）

```bash
# eyes-lips-bot を3つ起動（通常は不要）
podman-compose up -d --scale eyes-lips-bot=3
```

### ログの保存

```bash
# ログをファイルに保存
podman-compose logs eyes-lips-bot > logs/eyes-lips-bot.log

# タイムスタンプ付きでリアルタイム保存
podman-compose logs -f eyes-lips-bot | tee -a logs/eyes-lips-bot-$(date +%Y%m%d).log
```

### ヘルスチェック

```bash
# コンテナのヘルスステータス確認
podman inspect eyes-lips-bot --format='{{.State.Health.Status}}'
```

## 開発時に便利なコマンド

### コード変更後の素早い反映

```bash
# ボットを停止せずにコードを反映（開発モードの場合）
podman-compose restart eyes-lips-bot
```

### ログをクリア

```bash
# コンテナを再作成してログをクリア
podman-compose up -d --force-recreate eyes-lips-bot
```

## 複数ボット管理の例（将来的に）

### 全てのボットを順次起動

```bash
# 依存関係がある場合に順次起動
podman-compose up -d eyes-lips-bot
sleep 5
podman-compose up -d music-bot
sleep 5
podman-compose up -d admin-bot
```

### 特定のボット以外を起動

```bash
# eyes-lips-bot 以外を起動
podman-compose up -d music-bot admin-bot
```

---

## Docker 使用時の違い

Podman の代わりに Docker を使う場合、コマンドは同じです:

```bash
# Podman
podman-compose up -d

# Docker（同じ）
docker-compose up -d
```

**主な違い:**
- Podman: rootless（非root）で実行可能、デーモン不要
- Docker: デーモン必須、通常rootまたはdockerグループが必要

---

## クイックリファレンス

| 操作 | コマンド |
|------|---------|
| 起動 | `podman-compose up -d` |
| 停止 | `podman-compose down` |
| 再起動 | `podman-compose restart` |
| ログ表示 | `podman-compose logs -f` |
| ステータス | `podman-compose ps` |
| リビルド | `podman-compose up -d --build` |
| コンテナに入る | `podman exec -it <name> sh` |
| 完全削除 | `podman-compose down -v --rmi all` |
