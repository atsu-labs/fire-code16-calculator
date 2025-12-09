# Cloudflare Pages デプロイガイド

## はじめに

このガイドでは、消防法 用途別面積計算機を Cloudflare Pages にデプロイする手順を説明します。

## 前提条件

- Cloudflare アカウント（無料プランで OK）
- GitHub アカウント
- Git がインストールされていること

## デプロイ方法

### 方法 1: GitHub 連携による自動デプロイ（推奨）

#### ステップ 1: リポジトリを GitHub にプッシュ

```bash
# まだの場合は、GitHub にリポジトリを作成してプッシュ
git remote add origin https://github.com/atsu-labs/fire-code16-calculator.git
git push -u origin main
```

#### ステップ 2: Cloudflare Pages プロジェクトを作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューから "Workers & Pages" を選択
3. "Create application" > "Pages" > "Connect to Git" をクリック
4. GitHub アカウントを連携し、リポジトリを選択
5. ビルド設定を入力：
   - **プロジェクト名**: `fire-code16-calculator`
   - **Production ブランチ**: `main`
   - **ビルドコマンド**: `npm run build`
   - **ビルド出力ディレクトリ**: `dist`
   - **Node.js バージョン**: `20`（環境変数 `NODE_VERSION=20` で設定）
6. "Save and Deploy" をクリック

これで、`main` ブランチへのプッシュ時に自動的にデプロイされます。

#### ステップ 3: GitHub Actions による自動デプロイ（オプション）

より細かい制御が必要な場合は、GitHub Actions を使用できます：

1. **Cloudflare API トークンを取得**
   - [API トークンページ](https://dash.cloudflare.com/profile/api-tokens) にアクセス
   - "Create Token" をクリック
   - "Edit Cloudflare Workers" テンプレートを選択
   - 権限を確認して "Continue to summary" > "Create Token"
   - トークンをコピー（後で確認できないので注意）

2. **Cloudflare アカウント ID を取得**
   - Cloudflare Dashboard の任意のページの URL から取得
   - 形式: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`

3. **GitHub Secrets を設定**
   - GitHub リポジトリの Settings > Secrets and variables > Actions
   - "New repository secret" をクリックして以下を追加：
     - Name: `CLOUDFLARE_API_TOKEN`, Secret: コピーした API トークン
     - Name: `CLOUDFLARE_ACCOUNT_ID`, Secret: アカウント ID

4. **デプロイ**
   ```bash
   git add .
   git commit -m "feat: Cloudflare Pages デプロイ設定を追加"
   git push origin main
   ```

GitHub Actions が自動的に実行され、Cloudflare Pages にデプロイされます。

### 方法 2: Wrangler CLI による手動デプロイ

#### ステップ 1: Wrangler CLI をインストール

```bash
npm install -g wrangler
```

#### ステップ 2: Cloudflare にログイン

```bash
wrangler login
```

ブラウザが開き、Cloudflare へのアクセスを承認します。

#### ステップ 3: プロジェクトをビルド

```bash
npm run build
```

#### ステップ 4: デプロイ

```bash
wrangler pages deploy dist --project-name=fire-code16-calculator
```

または、npm スクリプトを使用：

```bash
npm run pages:deploy
```

初回デプロイ時は、プロジェクトが自動的に作成されます。

## ローカルでのプレビュー

Cloudflare Pages の環境をローカルで再現してテストできます：

```bash
# ビルド
npm run build

# Cloudflare Pages のローカル開発サーバーを起動
npm run pages:dev
```

## 環境変数の設定

環境変数が必要な場合は、Cloudflare Dashboard で設定できます：

1. Pages プロジェクトを開く
2. "Settings" > "Environment variables" に移動
3. 本番環境用とプレビュー環境用にそれぞれ変数を追加

## カスタムドメインの設定

1. Pages プロジェクトを開く
2. "Custom domains" タブを選択
3. "Set up a custom domain" をクリック
4. ドメイン名を入力し、DNS レコードを設定

## トラブルシューティング

### ビルドが失敗する

- Node.js のバージョンを確認（`.node-version` ファイルで指定）
- 依存関係が正しくインストールされているか確認
- ビルドログを確認して、エラーメッセージを特定

### デプロイ後にページが表示されない

- ビルド出力ディレクトリが `dist` になっているか確認
- `public/_redirects` ファイルが正しく配置されているか確認
- ブラウザのコンソールでエラーを確認

### 404 エラーが発生する

- `public/_redirects` ファイルが正しく設定されているか確認
- SPA の場合、すべてのルートが `index.html` にリダイレクトされる必要がある

## リソース

- [Cloudflare Pages 公式ドキュメント](https://developers.cloudflare.com/pages/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html)
