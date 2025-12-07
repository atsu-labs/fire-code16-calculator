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
