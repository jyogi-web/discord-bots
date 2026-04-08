# Docker/Podman コマンド集

ルートディレクトリで実行します。`docker` を `podman` に置き換えても動作します。

## 基本操作

```bash
# ビルドして起動（初回・コード変更後）
docker compose up -d --build

# 既存イメージで起動
docker compose up -d

# 停止
docker compose down

# 再起動
docker compose restart toy-bear-bot

# 状態確認
docker compose ps
```

## ログ

```bash
# リアルタイム表示
docker compose logs -f toy-bear-bot

# 最新50行
docker compose logs --tail 50 toy-bear-bot

# 全サービス
docker compose logs -f
```

## ビルド

```bash
# キャッシュなしで再ビルド
docker compose build --no-cache

# 強制再作成
docker compose up -d --build --force-recreate
```

## デバッグ

```bash
# コンテナ内でシェルを起動
docker compose exec toy-bear-bot sh

# 環境変数を確認
docker compose exec toy-bear-bot env | grep DISCORD

# リソース使用状況
docker stats
```

## クリーンアップ

```bash
# コンテナとネットワークを削除
docker compose down

# イメージも削除
docker compose down --rmi all

# 未使用リソースを全削除（注意）
docker system prune -a
```

## クイックリファレンス

| 操作 | コマンド |
|------|---------|
| 起動 | `docker compose up -d --build` |
| 停止 | `docker compose down` |
| 再起動 | `docker compose restart toy-bear-bot` |
| ログ | `docker compose logs -f toy-bear-bot` |
| 状態確認 | `docker compose ps` |
| コンテナに入る | `docker compose exec toy-bear-bot sh` |
