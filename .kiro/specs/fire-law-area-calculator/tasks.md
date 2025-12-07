# 実装タスク

## タスク概要
本ドキュメントは、消防法複合用途防火対象物の面積計算Webアプリケーションの実装タスクを定義します。全14の要件を実装可能な作業単位に分解し、各タスクに1-3時間の作業量を想定しています。

## タスクリスト

### 1. プロジェクトセットアップ

- [x] 1.1 (P) Vite + React + TypeScript プロジェクトの初期化
  - Vite 5+でReact 18+とTypeScript 5+のプロジェクトを作成
  - TypeScript strict modeを有効化
  - 基本的なディレクトリ構造（src/components, src/services, src/types, src/hooks）を作成
  - 開発サーバーが起動し、Hello World相当の画面が表示されることを確認
  - _Requirements: 13_

- [x] 1.2 (P) 型定義とデータモデルの実装
  - Building, Floor, Usage, UsageGroupの型定義を作成
  - Usage型に用途コード（annexedCode）と用途名称（annexedName）を含める
  - 消防法施行令別表第一の項番号に基づく用途コードの定数配列（buildingUses）を作成
  - ValidationError, CalculationError, StorageErrorの型定義を作成
  - Result型およびエラーハンドリング用のユーティリティ型を定義
  - UUID生成のヘルパー関数を実装
  - _Requirements: 1, 2, 3, 4, 5_

### 2. バリデーションサービスの実装

- [x] 2.1 (P) ValidationServiceの実装
  - 面積値の検証（正の数、小数許容）を実装
  - 階名と用途コード選択の必須検証を実装
  - 用途グループの制約検証（2以上、建物全体の全用途未満）を実装
  - エラーメッセージ生成機能を実装
  - 各検証関数のユニットテストを作成
  - _Requirements: 6_

### 3. 計算エンジンの実装

- [x] 3.1 (P) 階の共用部案分計算の実装
  - 階内の各用途の専用部分面積の合計を算出する関数を実装
  - 各用途の専用部分面積が階全体に占める割合を計算する関数を実装
  - 階の共用部面積を割合に応じて各用途に配分する関数を実装
  - 小数点以下2桁の丸め処理を実装
  - 専用部分面積合計が0の場合のエラーハンドリングを実装
  - ユニットテスト（正常系、境界値、エラーケース）を作成
  - _Requirements: 7_

- [x] 3.2 (P) 建物全体の共用部案分計算の実装
  - 全階の建物全体の共用部面積の合計を算出する関数を実装
  - 全階・全用途の専用部分面積の総合計を算出する関数を実装
  - 各用途の専用部分面積が建物全体に占める割合を計算する関数を実装
  - 建物全体の共用部面積の合計を割合に応じて各用途に配分する関数を実装
  - 小数点以下2桁の丸め処理を実装
  - 専用部分面積総合計が0の場合のエラーハンドリングを実装
  - ユニットテスト（正常系、境界値、エラーケース）を作成
  - _Requirements: 8_

- [x] 3.3 (P) 特定用途間の共用部案分計算の実装
  - 用途グループ内の各用途の専用部分面積の合計を算出する関数を実装
  - 各用途の専用部分面積がグループ内の合計に占める割合を計算する関数を実装
  - 特定用途間の共用部面積を割合に応じてグループ内の各用途に配分する関数を実装
  - 小数点以下2桁の丸め処理を実装
  - 用途グループ内の専用部分面積合計が0の場合のエラーハンドリングを実装
  - 同一用途が複数グループに含まれる場合の加算処理を実装
  - ユニットテスト（正常系、境界値、エラーケース、複数グループ）を作成
  - _Requirements: 9_
  - **Status: Completed** (98 tests passing - 17 type tests, 40 validation tests, 41 calculation engine tests)

- [x] 3.4 総面積算出と建物全体集計の実装
  - 各用途の総面積（専用部分 + 3種類の案分共用部）を算出する関数を実装
  - 階ごとの各用途の面積内訳（UsageAreaBreakdown）を生成する関数を実装
  - 建物全体の用途別集計（同一用途名称の面積を全階で合計）を実装
  - 建物全体の総面積を算出する関数を実装
  - ユニットテスト（複数階、複数用途、用途名が階で異なる場合）を作成
  - _Requirements: 10, 11_
  - _Note: タスク3.1-3.3の完了後に実装_
  - **Status: Completed** (13 tests for calculateTotalAreas and aggregateBuildingTotals)

### 4. 状態管理サービスの実装

- [x] 4.1 AppStateの定義とContext APIセットアップ
  - AppState型（building, calculationResults, uiState）を定義
  - React ContextとProviderコンポーネントを作成
  - useReducerで状態管理の基礎を実装
  - 不変更新パターンのヘルパー関数を実装（またはImmerの導入を検討）
  - _Requirements: 1, 2, 3, 4, 5, 12_
  - _Note: タスク1.2（型定義）の完了後に実装_
  - **Status: Completed** (23 tests passing - 10 context tests, 13 helper function tests)

- [x] 4.2 階管理アクションの実装
  - addFloor, updateFloor, deleteFloorのアクションとreducerケースを実装
  - ValidationServiceを使った検証を各アクション前に実行
  - 階削除時のカスケード削除（用途、用途グループ）を実装
  - 最低1階の維持制約を実装
  - 統合テスト（状態更新と検証）を作成
  - _Requirements: 1_
  - _Note: タスク2.1（ValidationService）と4.1（Context API）の完了後に実装_
  - **Status: Completed** (8 tests passing)

- [x] 4.3 用途管理アクションの実装
  - addUsage, updateUsage, deleteUsageのアクションとreducerケースを実装
  - ValidationServiceを使った検証を各アクション前に実行
  - 用途削除時のカスケード削除（該当用途を含む用途グループ）を実装
  - 階ごとに最低1用途の維持制約を実装
  - 統合テスト（状態更新と検証）を作成
  - _Requirements: 2_
  - _Note: タスク2.1（ValidationService）と4.1（Context API）の完了後に実装_
  - **Status: Completed** (6 tests passing)

- [x] 4.4 用途グループ管理アクションの実装
  - addUsageGroup, updateUsageGroup, deleteUsageGroupのアクションとreducerケースを実装
  - すべてのアクションにfloorIdパラメータを含める
  - ValidationServiceを使った用途グループ制約検証（2以上、建物全体の全用途未満）を実装
  - 用途グループの一意識別にUUIDを使用
  - 各階に独立したusageGroups配列を管理
  - その階に存在しない用途も含められることを許可
  - 統合テスト（状態更新と検証）を作成
  - _Requirements: 5_
  - _Note: タスク2.1（ValidationService）と4.1（Context API）の完了後に実装_
  - **Status: Completed** (6 tests passing)

- [x] 4.5 計算実行とクリア機能の実装
  - executeCalculationアクション（CalculationEngineを呼び出し）を実装
  - 各階のusageGroupsを独立して処理し、階ごとの結果を集約
  - 計算結果をcalculationResultsに保存するreducerケースを実装
  - clearAllアクション（全データをリセット、最低1階1用途を維持）を実装
  - clearFloorアクション（特定階のみクリア）を実装
  - 入力値変更時の計算結果クリアまたは再計算ロジックを実装
  - 統合テスト（計算フロー全体）を作成
  - _Requirements: 12_
  - _Note: タスク3.4（計算エンジン完成）と4.1（Context API）の完了後に実装_
  - **Status: Completed** (3 tests passing)

### 5. UIコンポーネントの実装

- [x] 5.1 (P) FloorManagerコンポーネントの実装
  - 階追加ボタンと階削除ボタンのUIを実装
  - 階名編集フィールドのUIを実装
  - StateManagementServiceのaddFloor, updateFloor, deleteFloorを呼び出す
  - 階削除時の確認ダイアログを実装
  - 階を追加順または階数順に表示する機能を実装
  - レスポンシブデザインを適用
  - _Requirements: 1, 13_
  - _Contracts: StateManagementService API_
  - **Status: Completed** (5 tests passing)

- [x] 5.2 (P) UsageManagerコンポーネントの実装
  - 用途追加ボタンと用途削除ボタンのUIを実装
  - 用途コード選択ドロップダウン（buildingUsesから選択）と専用部分面積の入力フィールドのUIを実装
  - 用途コード選択時に用途名称（annexedName）を自動表示
  - StateManagementServiceのaddUsage, updateUsage, deleteUsageを呼び出す
  - 階ごとに独立した用途リストを表示
  - レスポンシブデザインを適用
  - _Requirements: 2, 13_
  - _Contracts: StateManagementService API_
  - **Status: Completed** (統合テストでカバー)

- [x] 5.3 (P) 共用部面積入力コンポーネントの実装
  - 階の共用部面積入力フィールド（各階に配置）のUIを実装（CommonAreaInputs）
  - 建物全体の共用部面積入力フィールド（各階に配置）のUIを実装（BuildingCommonAreaInput）
  - 数値入力の検証とエラー表示を実装
  - 各共用部の種類について説明やヒントを表示
  - 階の共用部と建物全体の共用部を視覚的に区別して表示
  - レスポンシブデザインを適用
  - _Requirements: 3, 4, 13_
  - _Contracts: StateManagementService API_
  - **Status: Completed** (統合テストでカバー)

- [x] 5.4 UsageGroupSelectorコンポーネントの実装
  - 各階に配置され、floorIdをpropsとして受け取る
  - 建物全体の全用途から複数用途を選択できるチェックボックスリストUIを実装
  - その階に存在しない用途も選択可能であることを明示
  - 階ごとにグループ化して全用途を表示し、現在の階を視覚的に識別
  - 特定用途間の共用部面積入力フィールドのUIを実装
  - 選択された用途グループを視覚的に明示する表示を実装（階名、用途コード、用途名称を表示）
  - 全用途選択の禁止（警告メッセージ表示）を実装
  - 2用途以上の制約チェックを実装
  - 各階の既存グループリストを表示・管理
  - ツールチップと説明テキストで複雑なUIを補完
  - レスポンシブデザインを適用
  - _Requirements: 5, 13_
  - _Contracts: StateManagementService API_
  - _Note: タスク4.4（用途グループ管理）の完了後に実装_
  - **Status: Completed** (統合テストでカバー)

- [x] 5.5 ResultsDisplayコンポーネントの実装
  - 階ごとの計算結果をテーブル形式で表示（用途コード、用途名称、専用部分、3種類の案分共用部、総面積）
  - 建物全体の集計結果をテーブル形式で表示（用途コード、用途名称、内訳、総面積）
  - 建物全体集計は同一用途コード（annexedCode）で集計し、用途コード順（別表第一の項番号順）で表示
  - 面積の数値を小数点以下2桁まで表示
  - 階ごとの詳細と建物全体の集計を区別して表示
  - 視覚的に理解しやすい形式でデータを整理
  - レスポンシブデザインを適用
  - _Requirements: 10, 11, 13_
  - _Contracts: CalculationEngine output_
  - _Note: タスク4.5（計算実行）の完了後に実装_
  - **Status: Completed** (統合テストでカバー)

- [x] 5.6 AppControlsとメインレイアウトの実装
  - 計算実行ボタンのUIを実装
  - クリアボタン（全データクリア、特定階クリア）のUIを実装
  - 必須項目未入力時の計算ボタン無効化を実装
  - 計算中のローディング状態表示を実装
  - エラーメッセージ表示（フィールドレベル、フォームレベル、システムレベル）を実装
  - 全コンポーネントを統合したメインレイアウトを実装
  - 各階のループ内にUsageGroupSelectorを配置し、floorIdを渡す
  - レスポンシブデザインを適用
  - _Requirements: 12, 13_
  - _Note: タスク5.1-5.5の完了後に実装_
  - **Status: Completed** (統合テストでカバー、BuildingCommonAreaInputコンポーネントも追加実装)

### 6. 統合とテスト

- [x] 6.1 E2Eテストの実装
  - 階・用途の追加/削除/編集フローのE2Eテストを作成
  - 計算実行と結果表示のE2Eテストを作成
  - 各種エラーケースのE2Eテストを作成
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13_
  - _Note: タスク5.6（メインレイアウト）の完了後に実装_
  - **Status: Completed** (21 E2Eテスト実装 - アプリケーション全体のフロー検証)

- [x] 6.2 スタイリングとアクセシビリティの最終調整
  - CSS ModulesまたはTailwind CSSでスタイルを統一
  - モバイル端末でのタッチ操作とレスポンシブレイアウトを最終確認
  - キーボードナビゲーションとスクリーンリーダー対応を確認
  - フォーカス管理とARIAラベルを適切に設定
  - ブラウザ互換性（Chrome、Firefox、Safari、Edge）を確認
  - _Requirements: 13_
  - _Note: タスク5.6（メインレイアウト）の完了後に実装_
  - **Status: Completed** (29 アクセシビリティテスト実装・全テスト合格)
    - accessibility.test.tsx: WCAG 2.1準拠の包括的アクセシビリティテストスイート
      * ARIAラベルとロール検証 (5テスト)
      * キーボードナビゲーション検証 (3テスト)
      * フォーカス管理検証 (1テスト)
      * セマンティックHTML検証 (4テスト)
      * レスポンシブデザイン検証 (3テスト: モバイル375px、タブレット768px、デスクトップ1200px)
      * 色のコントラスト検証 (2テスト)
      * タッチ操作対応検証 (2テスト: 44x44px最小タップターゲット)
      * スタイリング一貫性検証 (9テスト)
    - CSS Modules改善（全8ファイル）:
      * FloorManager.css: min-height 44px、:focus-visible、モバイルレスポンシブ
      * UsageManager.css: min-height 44px、フォーカス状態強化、タブレット対応
      * AppControls.css: min-width 120px、高コントラストモード、ダークモード対応
      * CommonAreaInputs.css: min-height 44px、ホバー/無効化状態、モバイル/タブレット対応
      * ResultsDisplay.css: レスポンシブテーブル、モバイル横スクロール、タブレット最適化
      * UsageGroupSelector.css: タッチターゲット拡大、フォーカス強化、モバイル最適化
      * BuildingCommonAreaInput.css: アクセシビリティ強化、レスポンシブ対応
      * App.css: グローバルフォーカス管理、高コントラスト/ダークモード、プリント対応

- [ ]* 6.3 受入基準に基づくテストカバレッジの検証
  - 全13要件の受入基準（Acceptance Criteria）に対するテストケースを作成
  - 各要件の受入基準が満たされていることをテストで確認
  - テストカバレッジレポートを生成し、CalculationEngine（目標100%）、ValidationService（目標100%）、その他（目標80%以上）を確認
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13_
  - _Note: 全実装完了後の補完的なテスト作業。MVP機能が完成していれば後回し可能_

## 要件カバレッジマトリクス

| 要件 | タスク |
|-----|-------|
| 1 | 1.2, 4.1, 4.2, 5.1, 6.1, 6.3 |
| 2 | 1.2, 4.1, 4.3, 5.2, 6.1, 6.3 |
| 3 | 1.2, 4.1, 5.3, 6.1, 6.3 |
| 4 | 1.2, 4.1, 5.3, 6.1, 6.3 |
| 5 | 1.2, 4.1, 4.4, 5.4, 6.1, 6.3 |
| 6 | 2.1, 6.1, 6.3 |
| 7 | 3.1, 6.1, 6.3 |
| 8 | 3.2, 6.1, 6.3 |
| 9 | 3.3, 6.1, 6.3 |
| 10 | 3.4, 5.5, 6.1, 6.3 |
| 11 | 3.4, 5.5, 6.1, 6.3 |
| 12 | 4.1, 4.5, 5.6, 6.1, 6.3 |
| 13 | 1.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3 |

## タスク実行順序

### 並列実行可能 (P) タスク
以下のタスクは `(P)` マークが付いており、依存関係がないため並列実行可能です：
- 1.1（プロジェクト初期化）と 1.2（型定義）
- 2.1（ValidationService）
- 3.1（階の共用部計算）、3.2（建物全体計算）、3.3（特定用途間計算）
- 5.1（FloorManager）、5.2（UsageManager）、5.3（共用部入力）

### 順次実行が必要なタスク
以下のタスクは依存関係があるため、順次実行が必要です：
- 3.4は3.1, 3.2, 3.3の完了後
- 4.1は1.2の完了後
- 4.2, 4.3, 4.4は2.1と4.1の完了後
- 4.5は3.4と4.1の完了後
- 5.4は4.4の完了後
- 5.5は4.5の完了後
- 5.6は5.1-5.5の完了後
- 6.1は5.6の完了後
- 6.2は5.6の完了後
- 6.3は全実装完了後（オプション）

## タスク見積もり
- 総タスク数: 17タスク（メジャー6、サブ11）
- オプショナルタスク: 1タスク（6.3）
- 平均タスク時間: 1-3時間
- 総見積もり時間: 約25-50時間

