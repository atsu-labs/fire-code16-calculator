# Research & Design Decisions

## Summary
- **Feature**: `floor-count-input`
- **Discovery Scope**: Extension (既存システムへの機能拡張)
- **Key Findings**:
  - React 19.2 + TypeScript 5.9 + Vite環境、Context + useReducer パターンを採用
  - 既存の階管理アーキテクチャは個別追加/削除方式、一括操作への拡張が必要
  - グループ共用部の跨階参照により、カスケード削除ロジックが複雑化
  - Floor型への`floorType`フィールド追加により、地上階・地階の明示的識別が可能

## Research Log

### React Context + useReducer パターンの分析
- **Context**: 既存の状態管理アーキテクチャを理解し、新機能との統合方法を決定
- **Sources Consulted**:
  - `src/contexts/AppStateContext.tsx` - グローバル状態管理
  - `src/contexts/FloorActions.tsx` - 階操作アクション
  - `src/contexts/*.tsx` - 既存のアクションフックパターン
- **Findings**:
  - `AppStateContext`で単一の状態ツリーを管理（Building, CalculationResults, UIState）
  - `useXxxActions`パターンでドメイン別にアクションを分離
  - Reducerは不変更新により既存データを自動保持
  - アクション型は`UPPER_SNAKE_CASE`命名規則
- **Implications**:
  - 新規アクション`SET_FLOOR_COUNTS`をAppActionユニオンに追加
  - `useFloorActions`フックに`setFloorCounts`関数を追加
  - Reducer内で差分検出と一括更新を実装

### 階タイプ識別の必要性
- **Context**: 地上階と地階を区別し、正しい順序でソート・表示する必要がある
- **Sources Consulted**:
  - `src/types/types.ts` - Floor型定義
  - Gap analysis recommendations
- **Findings**:
  - 現在のFloor型には階タイプを識別するフィールドが存在しない
  - 階名パターンマッチング（"地下"の有無）では型安全性が低い
  - 既存の階データとの互換性を維持する必要がある
- **Implications**:
  - Floor型に`floorType: 'above-ground' | 'basement'`フィールドを追加
  - 既存データの移行ロジック（階名から階タイプを推測）を実装
  - ソートロジックで階タイプを活用

### カスケード削除の複雑性
- **Context**: 階削除時にグループ共用部の整合性を維持する必要がある
- **Sources Consulted**:
  - `src/types/types.ts` - UsageGroup型定義
  - `src/contexts/AppStateContext.tsx` - 既存の削除ロジック
- **Findings**:
  - UsageGroupは`floorId`（所属階）と`usageIds`（参照用途）を持つ
  - `usageIds`は他階の用途も参照可能（跨階参照）
  - 現在のDELETE_FLOORアクションにはカスケード削除が未実装
  - グループ共用部の用途数が2未満になった場合の二次的削除が必要
- **Implications**:
  - ユーティリティ関数`cleanupUsageGroups`を実装
  - 削除階に属するグループ共用部を削除
  - 他階のグループ共用部から削除階の用途IDを除外
  - 除外後の用途数検証と二次削除を実行

### バリデーションとエラーハンドリング
- **Context**: 階数入力と階削除時のユーザーフィードバックを設計
- **Sources Consulted**:
  - `src/services/ValidationService.ts` - 既存バリデーション
  - `src/types/types.ts` - ValidationError型
- **Findings**:
  - ValidationErrorは判別可能なユニオン型（type: 'REQUIRED_FIELD' | 'INVALID_NUMBER' | ...）
  - ValidationServiceには整数バリデーションが未実装
  - エラーメッセージは日本語で記述
- **Implications**:
  - ValidationServiceに`validateInteger`メソッドを追加
  - 確認ダイアログは`window.confirm`を使用（シンプル実装優先）
  - データ削除判定基準: 用途データ、共用部面積（>0）、グループ共用部のいずれかが存在する場合

### テスト戦略
- **Context**: 既存のテストパターンを踏襲し、包括的なカバレッジを確保
- **Sources Consulted**:
  - `src/components/FloorManager.test.tsx`
  - `src/contexts/FloorActions.test.tsx`
  - `vitest.config.ts`
- **Findings**:
  - Vitest + React Testing Library + jsdom環境
  - `@testing-library/user-event`でユーザー操作をシミュレート
  - AppStateProviderでラップしてコンポーネントをテスト
  - 非同期処理は`waitFor`で完了を待機
- **Implications**:
  - FloorCountInputコンポーネントの単体テスト
  - floorGeneratorユーティリティの単体テスト（純粋関数）
  - cascadeDeleteHelperの包括的なテスト（エッジケース重視）
  - FloorManagerの統合テスト（階数入力からUI更新まで）

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Option A: 既存コンポーネント拡張 | FloorManagerに階数入力UIを直接追加、Reducer内で差分検出実装 | 最小限のファイル変更、既存パターン活用 | FloorManagerとReducerの肥大化、カスケード削除ロジックのテスト困難 | Gap analysisで評価済み |
| Option B: 新規コンポーネント + ユーティリティ分離 | FloorCountInput作成、階生成・差分検出・カスケード削除を純粋関数化 | 責務分離、テスト容易、再利用可能 | ファイル数増加、インターフェース設計必要 | **推奨アプローチ** |
| Option C: ハイブリッド（段階的移行） | MVP実装 → リファクタリング → 最適化の3フェーズ | 初期段階で素早くフィードバック | 総工数増加、フェーズ間の一貫性維持課題 | リスク分散が必要な場合 |

## Design Decisions

### Decision: Option Bを採用（新規コンポーネント + ユーティリティ分離）
- **Context**: 階数入力機能を既存システムに統合する最適な方法を決定
- **Alternatives Considered**:
  1. Option A（拡張） - FloorManagerとReducerに直接実装
  2. Option B（新規作成） - 責務分離とユーティリティ化
  3. Option C（ハイブリッド） - 段階的実装
- **Selected Approach**: Option B - FloorCountInputコンポーネント + ユーティリティ関数（floorGenerator, floorDiffCalculator, cascadeDeleteHelper）
- **Rationale**:
  - **テスト容易性**: 純粋関数は単体テストが容易（ビジネスロジックの品質保証）
  - **保守性**: 各ユーティリティの責務が明確で、将来の変更に強い
  - **既存コードへの影響最小化**: FloorManagerとReducerの変更を最小限に抑制
  - **段階的実装**: ユーティリティから順次実装・テスト可能
- **Trade-offs**:
  - ✅ 責務分離、テスト容易、再利用可能
  - ❌ ファイル数増加（+4ファイル）、インターフェース設計コスト
- **Follow-up**: ユーティリティ関数のパフォーマンステスト（大規模建物での階数変更）

### Decision: Floor型に`floorType`フィールドを追加
- **Context**: 地上階と地階を明示的に区別し、型安全なソートを実現
- **Alternatives Considered**:
  1. 階名パターンマッチング（"地下"の有無で判定）
  2. Floor型に`floorType: 'above-ground' | 'basement'`フィールド追加
- **Selected Approach**: Floor型拡張（floorTypeフィールド追加）
- **Rationale**:
  - **型安全性**: TypeScriptの判別可能ユニオンにより、コンパイル時エラー検出
  - **明示性**: 階タイプが明確で、階名変更の影響を受けない
  - **拡張性**: 将来的に中間階（メザニン階）などへの拡張が容易
- **Trade-offs**:
  - ✅ 型安全、明示的、拡張可能
  - ❌ 既存データの移行ロジックが必要、型定義の変更
- **Follow-up**: 既存の階データから階タイプを推測する移行ヘルパー関数を実装

### Decision: カスケード削除をユーティリティ関数で実装
- **Context**: 階削除時のグループ共用部整合性維持ロジックの配置
- **Alternatives Considered**:
  1. Reducer内で実装（DELETE_FLOORケース内）
  2. 独立したユーティリティ関数（cascadeDeleteHelper）
- **Selected Approach**: ユーティリティ関数`cleanupUsageGroupsAfterFloorDeletion`
- **Rationale**:
  - **テスト容易性**: 純粋関数として包括的なテストが可能
  - **Reducerのシンプル化**: Reducerは状態更新のみに集中
  - **再利用性**: 他の削除シナリオでも利用可能
- **Trade-offs**:
  - ✅ テスト容易、Reducerがシンプル、再利用可能
  - ❌ 関数呼び出しの追加、インターフェース設計必要
- **Follow-up**: エッジケース（全階削除、循環参照など）の包括的テスト

### Decision: 確認ダイアログは`window.confirm`を使用
- **Context**: 階削除時のデータ損失警告UI
- **Alternatives Considered**:
  1. ブラウザ標準の`window.confirm`
  2. カスタムモーダルコンポーネント
- **Selected Approach**: `window.confirm`（初期実装）
- **Rationale**:
  - **シンプル実装**: 追加のUIコンポーネント不要
  - **即座の動作確認**: 複雑なモーダル実装を待たずに機能検証可能
  - **後方互換**: 将来的にカスタムモーダルへの移行が容易
- **Trade-offs**:
  - ✅ 実装コスト低、即座に動作確認可能
  - ❌ スタイルのカスタマイズ不可、UX改善の余地あり
- **Follow-up**: ユーザーフィードバックに基づき、カスタムモーダルへの置き換えを検討

## Risks & Mitigations

- **高リスク: カスケード削除の複雑性** - グループ共用部の跨階参照により、削除ロジックが複雑
  - **軽減策**: ユーティリティ関数に分離し、包括的なエッジケーステストを実施
- **中リスク: 既存データの移行** - floorTypeフィールド追加による既存データとの互換性
  - **軽減策**: 階名から階タイプを推測する移行ヘルパー関数を実装、デフォルト値を設定
- **中リスク: 大規模建物でのパフォーマンス** - 100階以上の建物での階数変更時のレンダリング性能
  - **軽減策**: パフォーマンステストを実施、必要に応じて仮想スクロール導入を検討
- **低リスク: 数値入力バリデーション** - 整数検証ロジックの追加
  - **軽減策**: ValidationServiceに`validateInteger`メソッドを追加、包括的なテスト

## References

- [React Context API](https://react.dev/reference/react/useContext) - 状態管理パターンの公式ドキュメント
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) - 判別可能ユニオン型の型安全性
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - コンポーネントテストのベストプラクティス
- [Vitest](https://vitest.dev/) - ユニットテストフレームワーク
