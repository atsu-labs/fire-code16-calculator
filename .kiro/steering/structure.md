# Project Structure

## Organization Philosophy

**レイヤー型アーキテクチャ**: 技術的役割ごとにディレクトリを分割（components, contexts, services, types, utils）。各レイヤーは依存関係が明確で、上位レイヤーから下位レイヤーへの単方向依存を維持。

## Directory Patterns

### UI Components (`/src/components/`)
**Purpose**: 再利用可能なReactコンポーネント  
**Example**: `FloorManager.tsx`, `UsageGroupSelector.tsx`  
**Rules**:
- PascalCase命名
- 対応するCSSファイル（`/src/styles/`）
- テストファイルを併置（`*.test.tsx`, `*.e2e.test.tsx`, `*.accessibility.test.tsx`）

### State Management (`/src/contexts/`)
**Purpose**: グローバル状態管理とアクション定義  
**Example**: `AppStateContext.tsx`, `FloorActions.tsx`, `CalculationActions.tsx`  
**Rules**:
- Context定義とカスタムフック提供
- アクション種別ごとにファイル分割
- `index.ts`でエクスポート集約

### Business Logic (`/src/services/`)
**Purpose**: ドメインロジックとビジネスルール  
**Example**: `CalculationEngine.ts`, `ValidationService.ts`  
**Rules**:
- クラスベースで実装
- Reactから独立（純粋なTypeScript）
- Result型でエラーハンドリング

### Type Definitions (`/src/types/`)
**Purpose**: ドメインモデルとインターフェース定義  
**Example**: `types.ts`（Building, Floor, Usage, UsageGroup）  
**Rules**:
- exportされた型のみ
- JSDocコメントで説明
- `index.ts`でre-export

### Utilities (`/src/utils/`)
**Purpose**: 汎用ヘルパー関数  
**Example**: `floorGenerator.ts`, `cascadeDeleteHelper.ts`, `floorDiffCalculator.ts`  
**Rules**:
- 純粋関数（副作用なし）
- 単一責任の原則
- 型付き関数エクスポート

### Test Setup (`/src/test/`)
**Purpose**: テスト環境のセットアップ  
**Example**: `setup.ts`（Testing Library、jest-dom設定）

## Naming Conventions

- **Files**: PascalCase for components (`FloorManager.tsx`), camelCase for utilities (`floorGenerator.ts`)
- **Components**: PascalCase, 名詞（`UsageGroupSelector`）
- **Functions/Hooks**: camelCase, 動詞始まり（`useFloorActions`, `calculateArea`）
- **Types/Interfaces**: PascalCase（`Building`, `UsageAreaBreakdown`）
- **Test Files**: `*.test.tsx` (unit), `*.e2e.test.tsx` (e2e), `*.accessibility.test.tsx` (a11y), `*.integration.test.tsx` (integration), `*.performance.test.tsx` (performance)

## Import Organization

```typescript
// 1. External libraries
import { useState } from 'react';
import { describe, it, expect } from 'vitest';

// 2. Internal absolute imports (contexts, services, types, utils)
import { useAppState } from '../contexts/AppStateContext';
import { CalculationEngine } from '../services/CalculationEngine';
import type { Floor, Usage } from '../types';

// 3. Relative imports (same directory or subdirectories)
import { FloorManager } from './FloorManager';
import '../styles/App.css';
```

**Path Aliases**: なし（相対パスを使用）

## Code Organization Principles

### 単方向依存フロー
```
components → contexts → services → types
                    ↘ utils ↗
```

### コロケーション
- テストファイルは実装ファイルと同じディレクトリに配置
- CSSファイルは`/src/styles/`に集約（コンポーネント名と一致）

### バレルエクスポート
- `contexts/index.ts`, `types/index.ts`でエクスポート集約
- インポート元を簡潔化（`from '../contexts'`）

### 型ファイル分離
- 型定義ファイルには`types.ts`サフィックス
- ドメインモデルは`/src/types/types.ts`
- 型の型検証テストは`*.test.ts`として併置

---
_レイヤー分離により、ビジネスロジックとUIを独立してテスト可能_
