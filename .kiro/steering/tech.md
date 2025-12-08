# Technology Stack

## Architecture

フロントエンド単体のSPA（Single Page Application）。状態管理はReact Context + useReducerパターンで実装し、計算ロジックは独立したエンジンクラスとして分離。

## Core Technologies

- **Language**: TypeScript 5.9（Strict Mode）
- **Framework**: React 19（関数コンポーネント + Hooks）
- **Build Tool**: Vite 7
- **Runtime**: Node.js 18+

## Key Libraries

- **Testing**: Vitest（ユニット・統合テスト）、React Testing Library、jest-axe（アクセシビリティ）
- **Linting**: ESLint（TypeScript ESLint、React Hooks）

## Development Standards

### Type Safety
- TypeScript strict mode有効
- `any`型の使用禁止
- すべての関数に明示的な型注釈
- ドメインモデル（Building, Floor, Usage）は厳密に型定義

### Code Quality
- ESLint: React Hooks、TypeScript推奨ルール適用
- コメントは日本語で記述（JSDocコメントを含む）
- ファイル冒頭に目的を説明するコメント

### Testing
- Vitest + React Testing Library
- ユニットテスト: ロジック単位のテスト（CalculationEngine、ValidationService）
- 統合テスト: コンポーネント間の連携テスト
- E2Eテスト: ユーザーフロー全体のテスト
- アクセシビリティテスト: jest-axeによる自動検証
- カバレッジ計測: `npm run test:coverage`

## Development Environment

### Required Tools
- Node.js 18以上
- npm（package manager）

### Common Commands
```bash
# Dev: npm run dev
# Build: npm run build
# Test: npm test
# Test UI: npm run test:ui
# Coverage: npm run test:coverage
# Lint: npm run lint
```

## Key Technical Decisions

### 状態管理: React Context + useReducer
- グローバル状態は`AppStateContext`で一元管理
- アクションごとに分離したカスタムフック（`useFloorActions`, `useUsageActions`）
- 理由: 中規模SPAに適したシンプルで理解しやすいパターン

### 計算エンジンの分離
- `CalculationEngine`クラスで按分計算を独立実装
- Result型（`{ success: boolean, value?: T, error?: E }`）で明示的なエラーハンドリング
- 理由: テスト容易性、ビジネスロジックの再利用性

### 累積丸め処理
- 按分計算時に累積誤差を最小化するアルゴリズム採用
- 理由: 小数点以下の丸め誤差による合計値不一致を防止

### コンポーネント設計
- プレゼンテーション層とロジック層の分離
- カスタムフックでロジックを抽出
- 理由: テスト容易性、コンポーネントの再利用性

---
_React 19の機能を活用し、TypeScript strictモードで型安全性を確保_
