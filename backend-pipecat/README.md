# Pipecat + faster-whisper WebUI リアルタイム音声認識サンプル

Pipecat フレームワークと `faster-whisper` を使用し、ブラウザのマイク入力を WebSocket 経由でリアルタイムに文字起こしする WebUI アプリケーションです。

---

## 概要

- **Pipecat**: 音声処理パイプラインの管理（WebsocketTransport, Silero VAD）
- **faster-whisper**: CTranslate2 に基づく高速 Whisper インファレンス
- **FastAPI**: 非同期 Web サーバー & WebSocket 通信
- **WebUI**: Vanilla HTML/CSS/JS (ガラスモルフィズムデザイン・リアルタイム波形描画)

※ 独自の WebUI や既存の Web アプリケーションに本機能を組み込む方法については、[INTEGRATION_GUIDE.md](file:///home/dmng/pipecat-whisper/INTEGRATION_GUIDE.md) を参照してください。

---

## 開発・実行環境のセットアップ (`uv` 使用)

Python 環境の依存関係管理には `uv` を使用します。

### 1. 依存関係の同期

```bash
uv sync
```

### 2. サーバーの起動

```bash
uv run python src/server.py
```

起動後、ブラウザで以下の URL にアクセスします:
- **WebUI**: `http://127.0.0.1:7860`

---

## Docker / Docker Compose での起動 (GPU 対応)

本プロジェクトは **NVIDIA GPU (CUDA)** に対応した Docker 構成となっています。

### 1. Docker Compose を使用する場合 (推奨)

NVIDIA Container Toolkit がセットアップされている環境で以下を実行します。

```bash
docker compose up --build
```

#### Faster-Whisper モデルの選択と設定
Docker Compose 起動時に環境変数 `WHISPER_MODEL` を指定してモデルを変更できます (デフォルト: `turbo` または `Systran/faster-whisper-*` リポジトリ名)。

- **一時的にモデルを指定して起動する場合**:
  ```bash
  WHISPER_MODEL=turbo docker compose up
  # または
  WHISPER_MODEL=large-v3 docker compose up
  # または
  WHISPER_MODEL=Systran/faster-whisper-large-v3 docker compose up
  ```

- **`.env` ファイルを使用する場合**:
  ```bash
  cp .env.example .env
  # .env 内の WHISPER_MODEL=large-v3 などを編集して起動
  docker compose up
  ```

#### モデルファイルの永続化
ダウンロードされた Whisper モデルは、プロジェクト直下の `./models` フォルダに自動的に保存・永続化されます。コンテナを再作成・削除してもモデルの再ダウンロードは発生しません。

#### HTTPS 接続設定 (https-portal)
Web ブラウザのセキュリティ仕様により、マイク入力 (`getUserMedia`) を許可するには `localhost` または `HTTPS` 接続が必須となります。
本構成では [https-portal](https://github.com/SteveLTN/https-portal) をリバースプロキシとして統合しており、IP アドレスをハードコードせずに動的取得またはキャッチオール (`_`) 接続に対応しています。

- **自動 IP/ホスト名検出スクリプトで起動する場合 (推奨)**:
  `./start.sh` を実行すると、現在のマシン名（例: `fractal.local`）とローカル IP アドレス（例: `192.168.1.8`）を自動取得して Docker Compose を起動します。
  ```bash
  ./start.sh
  ```

- **Docker Compose で直接起動する場合 (キャッチオール `_`)**:
  `docker-compose.yml` 内の `DOMAINS` はデフォルトで `localhost, _`（全ての IP/ホスト名にマッチ）に設定されているため、IP 直書きなしで起動可能です。
  ```bash
  docker compose up
  ```

- **アクセス URL**:
  - `https://<マシン名>.local` (例: `https://fractal.local`)
  - `https://<IPアドレス>` (例: `https://192.168.1.8`)
  - `https://localhost`

  ※ 自己署名証明書（`STAGE=local`）のため初回アクセス時に「保護されていない通信 / 証明書エラー」の警告が表示されますが、「詳細設定」→「（IPアドレス/ホスト名）に進む / 危険を承知で続行」を選択すると HTTPS / WSS 接続が完了し、マイクの使用が許可されます。

- **本番環境 (Let's Encrypt 自動発行)**:
  独自ドメインを取得し、`.env` で設定することで Let's Encrypt から正式な SSL 証明書が自動取得されます。
  ```env
  DOMAIN=example.com
  STAGE=production
  ```

---

### 2. Docker コマンドを使用する場合 (GPU 指定)

```bash
docker build -t pipecat-whisper .
docker run --gpus all -v $(pwd)/models:/app/models -e WHISPER_MODEL=base -p 7860:7860 pipecat-whisper
```

※ CPU で実行したい場合は環境変数 `WHISPER_DEVICE=cpu` および `WHISPER_COMPUTE_TYPE=int8` を指定して起動できます:
```bash
docker run -p 7860:7860 -v $(pwd)/models:/app/models -e WHISPER_DEVICE=cpu -e WHISPER_COMPUTE_TYPE=int8 pipecat-whisper
```

起動後、ブラウザで `http://127.0.0.1:7860` にアクセスします。

---

## 使用方法

1. ブラウザで `https://localhost` や `https://fractal.local` を開きます。
2. ステータスが「オンライン」になったら「録音開始」ボタンをクリックし、マイク入力を許可します。
3. マイクに向かって日本語で話します。
4. 発話が終わると、`Silero VAD` が発話終了を自動検出し、`faster-whisper` による認識結果が画面上にリアルタイム表示されます。
5. **自動停止機能**: 「最初の認識完了で自動停止」トグルを有効にすると、1回目の発話・認識が確定したタイミングでマイク入力が自動的にオフになります（設定はブラウザに保持されます）。
6. 「コピー」ボタンでテキストをクリップボードに保存、「クリア」ボタンで履歴を消去できます。

---

## セキュリティに関する仕様
- サーバーはローカルホスト (`127.0.0.1`) のみにバインドされます。
- WebUI では XSS 対策のため `innerHTML` を排し、セキュアな DOM 操作メソッド (`textContent`, `document.createElement`) を使用しています。

---

## ライセンス

本プロジェクトは **[MIT License](file:///home/dmng/pipecat-whisper/LICENSE)** のもとで公開されています。

### 依存ライブラリのライセンス

本プロジェクトが依存・使用している主要フレームワークおよびモデルのライセンスは以下の通りです：

- **[Pipecat](https://github.com/pipecat-ai/pipecat)** (`pipecat-ai`): [BSD 2-Clause License](https://github.com/pipecat-ai/pipecat/blob/main/LICENSE) (Copyright (c) Daily)
- **[faster-whisper](https://github.com/SYSTRAN/faster-whisper)** / **[OpenAI Whisper](https://github.com/openai/whisper)**: [MIT License](https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE) (Copyright (c) SYSTRAN / OpenAI)

