# Requirements Document

## Project Description (Input)
階数管理の方法を変更する。順次追加ではなく、地上階、地階の階数を入力するとその分の階情報が表示されるようにしたい

## Introduction
現在の階管理機能は、ユーザーが「階を追加」ボタンをクリックして順次階を追加する方式となっている。この要件では、地上階数と地階数を数値入力することで、自動的に対応する階情報を生成・表示する方式へ変更する。これにより、大規模建物での階データ入力の効率化と、階構成の一括設定を可能にする。

## Requirements

### Requirement 1: 階数入力UI
**Objective:** 建物管理者として、地上階数と地階数を数値で入力できるようにしたい。これにより、建物の階構成を効率的に定義できる。

#### Acceptance Criteria
1. The FloorManager shall 地上階数入力フィールドを表示する
2. The FloorManager shall 地階数入力フィールドを表示する
3. When 地上階数入力フィールドに数値を入力した場合, the FloorManager shall 0以上の整数のみを受け付ける
4. When 地階数入力フィールドに数値を入力した場合, the FloorManager shall 0以上の整数のみを受け付ける
5. If 無効な値（負の数、小数、非数値）が入力された場合, then the FloorManager shall バリデーションエラーを表示する
6. The FloorManager shall 各入力フィールドに適切なラベルとaria-label属性を設定する

### Requirement 2: 階データの自動生成
**Objective:** システム管理者として、入力された階数に基づいて階データを自動生成したい。これにより、手動での階追加作業を削減できる。

#### Acceptance Criteria
1. When 地上階数が入力された場合, the Building State shall 地上1階から指定階数までの階データを生成する
2. When 地階数が入力された場合, the Building State shall 地下1階から指定階数までの階データを生成する
3. When 地上階数が0の場合, the Building State shall 地上階のデータを生成しない
4. When 地階数が0の場合, the Building State shall 地階のデータを生成しない
5. When 階数が変更された場合, the Building State shall 既存の階データと新しい階数を比較する
6. When 階数が増加した場合, the Building State shall 不足する階のみを追加生成する
7. When 階数が減少した場合, the Building State shall 余剰な階データを削除する

### Requirement 3: 階命名規則
**Objective:** ユーザーとして、自動生成される階に適切な名称が設定されることを期待する。これにより、階の識別が容易になる。

#### Acceptance Criteria
1. When 地上階が生成される場合, the Building State shall "1階", "2階", "3階"...の形式で階名を設定する
2. When 地階が生成される場合, the Building State shall "地下1階", "地下2階", "地下3階"...の形式で階名を設定する
3. When 階データが生成される場合, the Building State shall 各階に一意のIDを割り当てる
4. The Building State shall 生成された階名をユーザーが後から編集可能にする

### Requirement 4: 既存データの保持
**Objective:** データ管理者として、階数変更時に既存の階に入力済みのデータを保持したい。これにより、データの再入力作業を回避できる。

#### Acceptance Criteria
1. When 階数が増加した場合, the Building State shall 既存階の用途データ（usages）を保持する
2. When 階数が増加した場合, the Building State shall 既存階の共用部面積データを保持する
3. When 階数が増加した場合, the Building State shall 既存階のグループ共用部データ（usageGroups）を保持する
4. When 階数が減少した場合, the Building State shall 削除対象階に関連するグループ共用部（usageGroups）を削除する
5. When 階数が減少した場合, the Building State shall 削除対象階の用途IDを参照する他階のグループ共用部から該当用途IDを除外する
6. If 削除対象階の用途ID除外後にグループ共用部の用途数が2未満になった場合, then the Building State shall 該当グループ共用部を削除する

### Requirement 5: 階順序の管理
**Objective:** ユーザーとして、階が論理的な順序で表示されることを期待する。これにより、直感的な階構成の把握が可能になる。

#### Acceptance Criteria
1. The FloorManager shall 階リストを地上階の降順（上階から下階）で表示する
2. The FloorManager shall 地上階リストの後に地階リストを配置する
3. The FloorManager shall 地階リストを降順（地下1階から下層へ）で表示する
4. When 階数が変更された場合, the FloorManager shall 階リストの表示順序を自動的に更新する

### Requirement 6: 状態管理の整合性
**Objective:** システム管理者として、階数入力と階データの状態が常に同期していることを保証したい。これにより、データ不整合を防止できる。

#### Acceptance Criteria
1. The Building State shall 地上階数と実際の地上階データの数が一致することを保証する
2. The Building State shall 地階数と実際の地階データの数が一致することを保証する
3. When コンポーネントが初期化される場合, the FloorManager shall 既存の階データから地上階数と地階数を逆算して表示する
4. When 階データが外部から変更された場合, the FloorManager shall 入力フィールドの値を自動的に更新する

### Requirement 7: 従来機能との互換性
**Objective:** 開発者として、新しい階数入力方式を導入しても、既存の階編集機能が引き続き動作することを保証したい。これにより、段階的な移行が可能になる。

#### Acceptance Criteria
1. The FloorManager shall 既存の階名編集機能を保持する
2. When ユーザーが階名を手動編集した場合, the Building State shall 変更を反映する
3. The FloorManager shall 各階の共用部面積入力機能を保持する
4. The FloorManager shall 各階の用途管理機能を保持する
5. The FloorManager shall 各階のグループ共用部管理機能を保持する

### Requirement 8: バリデーションとエラーハンドリング
**Objective:** ユーザーとして、無効な入力や操作時に適切なフィードバックを受け取りたい。これにより、エラーの原因を理解し修正できる。

#### Acceptance Criteria
1. If 階数入力が数値型の範囲を超える場合, then the FloorManager shall 最大値制限エラーを表示する
2. If 階数減少により削除される階にデータが存在する場合, then the FloorManager shall 確認ダイアログを表示する
3. When 確認ダイアログで「キャンセル」が選択された場合, the Building State shall 階数変更を中止する
4. When 確認ダイアログで「OK」が選択された場合, the Building State shall 階データを削除し階数を変更する
5. The FloorManager shall エラーメッセージにエラー内容と修正方法を含める

### Requirement 9: アクセシビリティ
**Objective:** 支援技術を使用するユーザーとして、階数入力機能を問題なく利用したい。これにより、全てのユーザーが機能にアクセスできる。

#### Acceptance Criteria
1. The FloorManager shall 全ての入力フィールドにlabel要素を関連付ける
2. The FloorManager shall 数値入力フィールドに適切なtype="number"属性を設定する
3. The FloorManager shall バリデーションエラーをaria-live領域で通知する
4. The FloorManager shall キーボードのみで全ての操作が可能であることを保証する
5. The FloorManager shall フォーカス順序が論理的であることを保証する

### Requirement 10: UIからの従来の追加・削除ボタンの削除
**Objective:** ユーザーとして、新しい階数入力方式に統一されたインターフェースを使用したい。これにより、操作の混乱を防止できる。

#### Acceptance Criteria
1. The FloorManager shall 「階を追加」ボタンを削除する
2. The FloorManager shall 各階の「削除」ボタンを削除する
3. The FloorManager shall 階数入力による一括管理方式のみを提供する
4. When 既存のaddFloor、deleteFloor関数が呼び出された場合, the Building State shall 内部的には引き続き処理を実行する（他のコンポーネントからの利用を考慮）
