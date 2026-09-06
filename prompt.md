以下が実現可能なモノレポ構成を提案して

- 複数のfrontend(Vite React Typescript ) と 複数のbackend(例えばpython の fastapi) を持つ
- 複数のfrontendおよび複数backend は `frontend-***/backend-***` フォルダ以下に Dockerfileを持つ
  - Dockerfileにおいて、frontend の default image は node:24-alpine, backend の default image は python-3.12:slim を利する
  - Dockerfile は極力シンプルにする
  - frontend の dist / node_modules は ファイルとして永続化できるようにする（ネットワーク環境でビルドし、ネットワークがない環境でも実行できるようにする）
- 複数のfrontend、複数のbackend のどれをビルド、起動、停止させるかは docker compose で制御する
- 複数の backend は nginx を用いてアクセスする。 nginx.conf にすべての API を書くのが面倒なので、frontend/backend 毎に一つの設定でアクセスできるようにする
- 複数の backend の  API は Swagger (OpenAPI) で確認できる
- frontend/backendsを単体テストできる仕組みを持つ
- 複数のfrontend、複数のbackend のビルド、起動、停止させることができるスクリプトを持つ
- READMEはdoc以外のコメントは英語で出力する
