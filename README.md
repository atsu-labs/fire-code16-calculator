# 消防法 用途別面積計算機 (Fire Law Area Calculator)

消防法に基づく複合用途防火対象物の用途別面積を計算するWebアプリケーションです。
各階の用途ごとの専用部分面積を入力し、各種共用部（階共用部、建物全体共用部、特定用途間共用部）を按分計算して、最終的な用途別延べ面積を算出します。

## 機能

- **階の管理**: 地上階・地階の追加、削除、並べ替え
- **用途の管理**: 消防法施行令別表第一に基づく用途の追加・設定
- **面積入力**:
  - 用途ごとの専用部分面積
  - 階共用部面積（その階の全用途で按分）
  - 建物全体共用部面積（建物全体の全用途で按分）
  - グループ共用部（特定の用途間でのみ共有する面積の按分）
- **自動計算**: 入力値に基づき、共用部を自動的に按分して合算
- **結果表示**: 用途ごとの合計面積と内訳の表示

## 共用部按分の仕様

### 1. 階共用部
その階の用途のみに按分されます。

- **按分対象**: その階に存在する用途のみ
- **按分比率**: 各用途の専有面積比
- **例**: 1階に階共用部50㎡がある場合
  - 1階の用途（四項100㎡、五項ロ150㎡）に按分
  - 四項への按分: 50 × (100/250) = 20㎡
  - 五項ロへの按分: 50 × (150/250) = 30㎡

### 2. 建物共用部（重要）
**全建物の全用途コードに按分し、その階にのみ加算**されます。

- **按分対象**: 全建物の全用途コード
- **按分比率**: 各用途コードの専有面積合計 / 全建物の専有面積合計
- **加算先**: 建物共用部が存在する階のみ
- **仮想用途**: その階に存在しない用途コードへの按分は、仮想用途として作成
- **例**: 2階に建物共用部100㎡がある場合
  - 全建物の専有面積: 1階の四項100㎡ + 2階の五項ロ200㎡ = 300㎡
  - 四項への按分: 100 × (100/300) = 33.33㎡ → **2階**に加算（仮想用途として）
  - 五項ロへの按分: 100 × (200/300) = 66.67㎡ → **2階**に加算
  - 1階には加算されない

### 3. グループ共用部（重要）
**グループ内の用途コードに按分し、その階にのみ加算**されます。

- **按分対象**: グループに登録された用途コードのみ
- **按分比率**: 各用途コードの専有面積合計 / グループ内の専有面積合計
- **加算先**: グループが存在する階のみ
- **仮想用途**: その階に存在しない用途コードへの按分は、仮想用途として作成
- **例**: 1階にグループ共用部100㎡がある場合（グループ: 二項ロ、四項）
  - グループ内の専有面積: 2階の二項ロ200㎡ + 1階の四項100㎡ = 300㎡
  - 二項ロへの按分: 100 × (200/300) = 66.67㎡ → **1階**に加算（仮想用途として）
  - 四項への按分: 100 × (100/300) = 33.33㎡ → **1階**に加算
  - 2階には加算されない（二項ロは2階に存在するが、グループは1階にあるため）

### 仮想用途について
共用部按分により、その階に実際には存在しない用途コードに按分が発生した場合、専有面積0の仮想用途エントリが自動的に作成されます。仮想用途は結果表示では実際の用途と同様に表示されます。

## 技術スタック

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library
- **Linter/Formatter**: ESLint

## セットアップ

### 必要要件

- Node.js (v18以上推奨)
- npm

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```
ブラウザで `http://localhost:5173` を開いてください。

## テスト

### ユニットテスト・統合テスト

```bash
npm test
```

### UIモードでのテスト実行

```bash
npm run test:ui
```

### カバレッジ計測

```bash
npm run test:coverage
```

## デプロイ

### Cloudflare Pages へのデプロイ

このプロジェクトは Cloudflare Pages にデプロイできます。

#### 自動デプロイ (GitHub Actions)

`main` ブランチへのプッシュ時に自動的にデプロイされます。初回セットアップには以下の手順が必要です：

1. Cloudflare ダッシュボードで API トークンを作成
   - [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) にアクセス
   - "Create Token" をクリック
   - "Edit Cloudflare Workers" テンプレートを選択、または以下の権限を持つカスタムトークンを作成：
     - Account - Cloudflare Pages: Edit

2. GitHub リポジトリの Secrets を設定
   - リポジトリの Settings > Secrets and variables > Actions へ移動
   - 以下のシークレットを追加：
     - `CLOUDFLARE_API_TOKEN`: 上記で作成した API トークン
     - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare アカウント ID（ダッシュボードの URL から取得可能）

3. コミットして `main` ブランチにプッシュ
   ```bash
   git add .
   git commit -m "feat: Cloudflare Pages デプロイ設定を追加"
   git push origin main
   ```

#### 手動デプロイ (Wrangler CLI)

```bash
# Wrangler CLI のインストール
npm install -g wrangler

# Cloudflare にログイン
wrangler login

# ビルド
npm run build

# デプロイ
wrangler pages deploy dist --project-name=fire-code16-calculator
```

#### ローカルプレビュー

```bash
# ビルド
npm run build

# Cloudflare Pages のローカルプレビュー
wrangler pages dev dist
```

## プロジェクト構成

```
src/
├── assets/         # 静的リソース
├── components/     # Reactコンポーネント
│   ├── FloorManager.tsx       # 階の管理
│   ├── UsageManager.tsx       # 用途の管理
│   ├── CommonAreaInputs.tsx   # 共用部入力
│   ├── UsageGroupSelector.tsx # グループ共用部設定
│   └── ResultsDisplay.tsx     # 計算結果表示
├── contexts/       # グローバル状態管理 (AppStateContext)
├── hooks/          # カスタムフック
├── services/       # ビジネスロジック
│   ├── CalculationEngine.ts   # 面積計算エンジン
│   └── ValidationService.ts   # バリデーション
├── types/          # 型定義
└── utils/          # ユーティリティ関数
```

## ライセンス

Private
