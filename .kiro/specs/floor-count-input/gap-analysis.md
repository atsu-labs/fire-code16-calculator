# 実装ギャップ分析: floor-count-input

## 1. 現状調査

### 既存の階管理アーキテクチャ

#### ファイル構造
- **UI層**: `src/components/FloorManager.tsx` - 階追加/削除/編集UI
- **ロジック層**: `src/contexts/FloorActions.tsx` - 階操作アクション（addFloor, updateFloor, deleteFloor）
- **状態管理層**: `src/contexts/AppStateContext.tsx` - Reducerベースの状態管理
- **バリデーション層**: `src/services/ValidationService.ts` - 階名検証ロジック
- **型定義**: `src/types/types.ts` - Floor, Building型定義
- **テスト**: `src/components/FloorManager.test.tsx` - UIコンポーネントテスト

#### 現在の実装パターン

**状態管理パターン**:
- React Context + useReducer アーキテクチャ
- アクション型: `ADD_FLOOR`, `UPDATE_FLOOR`, `DELETE_FLOOR`
- 不変更新による状態変更
- カスタムフック経由でのアクション提供

**階管理の現在の動作**:
```tsx
// FloorManager.tsx - 順次追加方式
handleAddFloor = async () => {
  const result = await addFloor(`${state.building.floors.length + 1}階`);
}
```
- ユーザーが「階を追加」ボタンをクリック
- 1階ずつ順次追加される（自動採番: "1階", "2階", ...）
- 削除ボタンで個別に階を削除（最低1階の制約あり）

**制約と依存関係**:
- 最低1階の維持制約（`deleteFloor`内で検証）
- UsageGroup（グループ共用部）がfloorIdを参照
  - 階削除時のカスケード削除は**未実装**（要件4に関連）
  - 他階のグループ共用部から削除階の用途IDを除外する処理も**未実装**

**命名規則**:
- コンポーネント: PascalCase（FloorManager）
- フック: useXxxActions パターン
- アクション型: UPPER_SNAKE_CASE
- CSS: kebab-case（floor-manager, floor-item）

**テストパターン**:
- Vitest + React Testing Library
- AppStateProvider でラップしてテスト
- UI操作のシミュレーション（fireEvent, waitFor）

### 統合ポイント

**データモデル**:
```typescript
interface Floor {
  id: string;
  name: string; // 階名称（現在は手動/自動採番）
  floorCommonArea: number;
  buildingCommonArea: number;
  usages: Usage[];
  usageGroups: UsageGroup[]; // この階に存在するグループ共用部
}

interface UsageGroup {
  id: string;
  floorId: string; // 階削除時に影響
  usageIds: string[]; // 削除階の用途IDを参照可能（跨階参照）
  commonArea: number;
}
```

**API/サービス**:
- ValidationService: `validateFloorName()` - 空文字チェックのみ（数値検証は未対応）
- CalculationEngine: 階データから面積計算（階削除の影響を受ける）

## 2. 要件実現性分析

### 技術要件の抽出

| 要件領域 | 技術要件 | 現状のギャップ |
|---------|---------|--------------|
| **Req 1: 階数入力UI** | - 地上階数・地階数の数値入力フィールド<br>- 整数バリデーション<br>- エラー表示UI | **Missing**: 数値入力UI全体<br>**Missing**: 整数バリデーションロジック |
| **Req 2: 階データ自動生成** | - 階数から階配列を生成<br>- 差分検出（増減判定）<br>- 階の一括追加/削除 | **Missing**: 一括生成ロジック<br>**Missing**: 差分検出アルゴリズム<br>**Existing**: 個別追加/削除は利用可能 |
| **Req 3: 階命名規則** | - "1階", "2階"...<br>- "地下1階", "地下2階"... | **Partial**: 地上階は既存パターンで対応可能<br>**Missing**: 地階命名ロジック |
| **Req 4: 既存データ保持** | - 階増加時の既存データ保持<br>- 階減少時のグループ共用部カスケード削除<br>- 用途ID除外処理 | **Existing**: 既存データは自動保持（不変更新）<br>**Missing**: カスケード削除ロジック<br>**Missing**: 用途ID除外ロジック |
| **Req 5: 階順序管理** | - 地上階降順ソート<br>- 地階降順ソート<br>- リスト結合 | **Missing**: ソートロジック全体 |
| **Req 6: 状態同期** | - 階数と実データの一致保証<br>- 初期化時の逆算表示 | **Missing**: 逆算ロジック<br>**Missing**: 同期検証 |
| **Req 7: 既存機能互換** | - 階名編集<br>- 共用部面積入力<br>- 用途管理 | **Existing**: 全て既存機能で対応済み |
| **Req 8: エラーハンドリング** | - 確認ダイアログ<br>- エラーメッセージ | **Partial**: ValidationError型は存在<br>**Missing**: 確認ダイアログUI<br>**Missing**: データ削除警告ロジック |
| **Req 9: アクセシビリティ** | - aria-label<br>- type="number"<br>- キーボード操作 | **Existing**: 既存UIはaria-label対応済み<br>**Missing**: 新規入力フィールドへの適用 |
| **Req 10: UI変更** | - 追加/削除ボタンの削除 | **Simple**: JSX削除のみ |

### 不足機能と制約

**Missing (実装必須)**:
1. **地上階数・地階数の入力UI** - 新規コンポーネント/ロジックが必要
2. **階数から階配列を生成するロジック** - 地上階/地階の命名規則を含む
3. **差分検出アルゴリズム** - 現在の階配列と目標階数を比較し、追加/削除対象を特定
4. **カスケード削除ロジック** - 階削除時のグループ共用部整合性維持
   - 削除階に属するグループ共用部の削除
   - 他階のグループ共用部から削除階の用途IDを除外
   - 用途ID除外後、グループの用途数が2未満になった場合の削除
5. **階ソートロジック** - 地上階・地階の論理的順序での表示
6. **確認ダイアログUI** - データ削除時の警告

**Unknown (要調査)**:
- **Research Needed**: 階削除時のデータ損失の具体的な判定基準（用途データ、共用部面積、グループ共用部のうち、どれが存在する場合に警告するか）
- **Research Needed**: 地上階0階・地階0階の両方が0の場合の挙動（最低1階制約をどう適用するか）

**Constraint (既存制約)**:
- 最低1階の維持制約（現在は`deleteFloor`内で実施、新方式でも維持必要）
- UsageGroupの跨階参照（floorIdとusageIdsの整合性維持）
- 不変更新パターン（React状態管理の原則）

### 複雑性シグナル

**シンプルな領域**:
- UI変更（追加/削除ボタン削除） - JSX修正のみ
- 階名編集の保持 - 既存機能をそのまま維持

**中程度の複雑性**:
- 数値入力UIとバリデーション - 標準的なフォーム実装
- 地上階の自動命名 - 既存パターンの応用
- 階ソートロジック - 配列操作

**高い複雝性**:
- **差分検出と一括更新** - 既存階データの保持とID管理が必要
- **カスケード削除** - グループ共用部の複雑な依存関係の解決
  - 削除階に属するグループ共用部の特定
  - 他階のグループ共用部の用途IDリストからの除外
  - 除外後の用途数検証と二次的な削除
- **状態同期と逆算** - 初期化時の階数計算（地上/地階の判別）

## 3. 実装アプローチオプション

### Option A: FloorManagerコンポーネントの拡張

**対象ファイル**:
- `src/components/FloorManager.tsx` - UI大幅改修
- `src/contexts/FloorActions.tsx` - 新規アクション追加（setFloorCounts）
- `src/contexts/AppStateContext.tsx` - 新規アクションタイプ追加（SET_FLOOR_COUNTS）

**実装戦略**:
1. FloorManagerに地上階数・地階数の入力フィールドを追加
2. FloorActionsに`setFloorCounts(aboveGround: number, basement: number)`を追加
3. Reducer内で差分検出 → 階の一括追加/削除を実行
4. カスケード削除ロジックをReducer内に実装

**互換性評価**:
- ✅ 既存のaddFloor/deleteFloor関数は内部的に維持（他コンポーネントからの利用を考慮）
- ✅ FloorManagerの責務拡大は妥当な範囲（階管理はこのコンポーネントの本来の役割）
- ⚠️ Reducerの`DELETE_FLOOR`ケースにカスケード削除を追加 → 既存の動作が変わる可能性

**複雑性と保守性**:
- ⚠️ FloorManager.tsxが肥大化（現在80行 → 推定150行以上）
- ⚠️ Reducerの複雑性増加（カスケード削除ロジック）
- ✅ ファイル数は増えない（学習コスト低）

**トレードオフ**:
- ✅ 最小限のファイル変更で実装可能
- ✅ 既存パターンを活用できる
- ❌ コンポーネントとReducerの肥大化
- ❌ カスケード削除ロジックがReducer内に埋め込まれ、テストしづらい

### Option B: 新規コンポーネントとユーティリティの作成

**新規ファイル**:
- `src/components/FloorCountInput.tsx` - 階数入力UI（地上階・地階）
- `src/utils/floorGenerator.ts` - 階配列生成ロジック
- `src/utils/floorDiffCalculator.ts` - 差分検出ロジック
- `src/utils/cascadeDeleteHelper.ts` - カスケード削除ロジック
- `src/components/FloorCountInput.test.tsx` - テスト

**変更ファイル**:
- `src/components/FloorManager.tsx` - FloorCountInputコンポーネントを組み込み、追加/削除ボタン削除
- `src/contexts/FloorActions.tsx` - setFloorCounts追加
- `src/contexts/AppStateContext.tsx` - SET_FLOOR_COUNTSアクション追加

**実装戦略**:
1. FloorCountInputで階数入力UIを独立実装
2. ユーティリティ関数でビジネスロジックを分離
   - `generateFloors(aboveGround, basement)` → Floor[]
   - `calculateFloorDiff(current, target)` → {toAdd, toDelete}
   - `cascadeDeleteFloors(floors, deleteIds)` → 整合性維持後のFloor[]
3. FloorActionsでユーティリティを呼び出し、Reducerはシンプルに保つ

**統合ポイント**:
- FloorCountInputはFloorManagerの子コンポーネントとして配置
- ユーティリティ関数は純粋関数として実装 → 単体テストが容易
- Reducerは最終的な状態更新のみを担当

**責務の境界**:
- **FloorCountInput**: 数値入力とバリデーション表示
- **floorGenerator**: 階配列の生成と命名
- **floorDiffCalculator**: 現在と目標の差分計算
- **cascadeDeleteHelper**: グループ共用部の整合性維持
- **FloorActions**: 上記を統合し、状態更新をディスパッチ

**トレードオフ**:
- ✅ 責務分離によりテストが容易
- ✅ 各ユーティリティが再利用可能
- ✅ Reducerがシンプルに保たれる
- ✅ 段階的な実装が可能（ユーティリティから順次実装）
- ❌ ファイル数の増加（ナビゲーションコスト）
- ❌ インターフェース設計が必要

### Option C: ハイブリッドアプローチ（段階的移行）

**フェーズ1: MVP実装**
- FloorManagerに階数入力UIを直接追加（Option A）
- カスケード削除は未実装（警告のみ）
- 地上階のみ対応（地階は後回し）

**フェーズ2: リファクタリング**
- ビジネスロジックをユーティリティに抽出（Option B）
- カスケード削除を実装
- 地階対応を追加

**フェーズ3: 最適化**
- ソートロジックの最適化
- エラーハンドリングの強化

**実装戦略**:
- 初期段階で最小限の変更で動作確認
- フィードバックを得てから本格実装
- リファクタリングにより技術的負債を解消

**リスク軽減**:
- ✅ 段階的リリースによりリスク分散
- ✅ 各段階で動作確認可能
- ⚠️ フェーズ1の技術的負債が残るリスク
- ⚠️ フェーズ移行時の追加工数

**トレードオフ**:
- ✅ 初期段階で素早くフィードバック取得
- ✅ 複雑性を段階的に導入
- ❌ 総工数が増加する可能性
- ❌ フェーズ間の一貫性維持が課題

## 4. 要件外（設計フェーズへ持ち越し）

以下の項目は設計フェーズで詳細調査を実施:
- 階削除時のデータ損失判定基準の詳細仕様
- 地上階0・地階0の同時0入力時の挙動
- 確認ダイアログのUXデザイン（モーダル or インライン）
- パフォーマンス最適化（大規模建物での階数変更時）

## 5. 実装複雑性とリスク

### 工数見積もり

**Option A（拡張アプローチ）**: **M (3-7日)**
- UI実装: 1-2日
- ロジック実装（差分検出・カスケード削除）: 2-3日
- テスト追加: 1-2日
- リスク: 既存コードへの影響範囲が広い

**Option B（新規作成アプローチ）**: **M-L (5-10日)**
- コンポーネント設計: 1日
- ユーティリティ実装: 2-3日
- 統合実装: 1-2日
- テスト実装: 2-3日
- ドキュメント: 1日
- リスク: インターフェース設計の複雑性

**Option C（ハイブリッド）**: **L (7-14日)**
- フェーズ1: 3-5日
- フェーズ2: 3-5日
- フェーズ3: 1-4日
- リスク: 段階間の調整コスト

### リスク評価

**全体リスク: Medium**

**High リスク要素**:
- **カスケード削除の複雑性**: グループ共用部の跨階参照により、削除ロジックが複雑
  - 軽減策: ユーティリティ関数に分離し、包括的なテストを実施
- **状態同期の保証**: 階数入力と実データの一致を常に保つ必要がある
  - 軽減策: 単一の真実の情報源（階配列のみ）を維持し、階数は派生値として扱う

**Medium リスク要素**:
- **階ソートロジック**: 地上階・地階の判別と順序付けが必要
  - 軽減策: 階名パターンマッチングまたは明示的な階タイプフィールド追加
- **データ損失の防止**: 確認ダイアログの実装タイミングとロジック
  - 軽減策: バリデーション段階で早期検出

**Low リスク要素**:
- **数値入力UI**: 標準的なHTML5フォーム機能で対応可能
- **階名編集の保持**: 既存機能をそのまま維持

## 6. 設計フェーズへの推奨事項

### 推奨アプローチ

**Option B（新規コンポーネントとユーティリティ作成）を推奨**

**理由**:
1. **テスト容易性**: ビジネスロジックが純粋関数として分離され、単体テスト可能
2. **保守性**: 各ユーティリティの責務が明確で、将来の変更に強い
3. **段階的実装**: ユーティリティから順次実装・テスト可能
4. **既存コードへの影響最小化**: FloorManagerとReducerの変更を最小限に抑制
5. **再利用性**: 階生成・差分検出ロジックは他機能でも利用可能

**主要な設計判断ポイント**:
1. **階タイプの識別方法**:
   - 選択肢A: 階名パターンマッチング（"地下"の有無）
   - 選択肢B: Floor型に`floorType: 'above' | 'basement'`フィールド追加
   - **推奨**: 選択肢B（明示的な型安全性）
   
2. **カスケード削除の実装場所**:
   - 選択肢A: Reducer内で実装
   - 選択肢B: 独立したユーティリティ関数
   - **推奨**: 選択肢B（テスト容易性優先）

3. **確認ダイアログの実装方法**:
   - 選択肢A: ブラウザ標準のwindow.confirm
   - 選択肢B: カスタムモーダルコンポーネント
   - **Research Needed**: UX要件に基づき設計フェーズで決定

4. **状態同期の戦略**:
   - 選択肢A: 階数を状態として保持し、階配列と同期
   - 選択肢B: 階配列のみを保持し、階数は派生値として計算
   - **推奨**: 選択肢B（単一の真実の情報源）

### 要調査事項（設計フェーズで詳細化）

1. **階削除警告の判定基準**:
   - 用途データの有無
   - 共用部面積の値（0でない場合）
   - グループ共用部への参照
   → いずれか1つでも該当する場合に警告するか、全て該当する場合のみか

2. **地上階0・地階0の同時入力時の挙動**:
   - エラーとして拒否（最低1階制約）
   - 警告後に許可
   - どちらか一方を自動的に1に設定

3. **大規模建物でのパフォーマンス**:
   - 階数が100階を超える場合のレンダリングパフォーマンス
   - 仮想スクロールの必要性

4. **階順序の永続化**:
   - ユーザーが階の表示順序をカスタマイズ可能にするか
   - デフォルトの論理順序を維持するか

### 実装優先度

**Phase 1（コア機能）**:
1. 地上階数入力UIとバリデーション
2. 階配列生成ロジック（地上階のみ）
3. 差分検出と一括追加/削除
4. カスケード削除ロジック

**Phase 2（拡張機能）**:
5. 地階対応
6. 階ソートロジック
7. 確認ダイアログ

**Phase 3（最適化）**:
8. エラーハンドリング強化
9. パフォーマンス最適化
10. アクセシビリティ改善

## 要件-資産マッピング

| 要件 | 既存資産 | ギャップ | 実装アプローチ |
|------|---------|---------|---------------|
| Req 1: 階数入力UI | FloorManager.tsx | **Missing**: 数値入力UI | 新規FloorCountInputコンポーネント |
| Req 2: 自動生成 | addFloor(), deleteFloor() | **Missing**: 一括処理 | floorGenerator.ts, floorDiffCalculator.ts |
| Req 3: 階命名 | addFloor内の命名ロジック | **Missing**: 地階命名 | floorGenerator.tsで地上/地階対応 |
| Req 4: データ保持 | Reducer不変更新 | **Missing**: カスケード削除 | cascadeDeleteHelper.ts |
| Req 5: 階順序 | - | **Missing**: ソート全体 | 階タイプフィールド追加 + ソート関数 |
| Req 6: 状態同期 | - | **Missing**: 逆算ロジック | 階配列から階数を計算するヘルパー |
| Req 7: 互換性 | updateFloor, UI全般 | **Existing**: 対応済み | 既存機能維持 |
| Req 8: エラー処理 | ValidationError型 | **Missing**: 確認ダイアログ | ダイアログコンポーネント追加 |
| Req 9: A11y | aria-label実装済み | **Partial**: 新規UIへ適用 | FloorCountInputにaria属性設定 |
| Req 10: UI変更 | FloorManager.tsx | **Simple**: ボタン削除 | JSX修正 |
