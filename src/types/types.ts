/**
 * Type definitions and data models for Fire Law Area Calculator
 * 消防法複合用途防火対象物の面積計算アプリケーションの型定義
 */

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Usage - 用途（消防法施行令別表第一の項番号）
 */
export interface Usage {
  id: string;
  annexedCode: string; // 用途コード（例: 'annex01_i', 'annex06_ro_2'）
  annexedName: string; // 用途名称（例: '１項イ', '６項ロ(2)'）
  exclusiveArea: number; // 専用部分面積
}

/**
 * UsageGroup - グループ共用部（特定用途間の共用部）
 * 各階に存在し、建物全体の任意の2用途以上（ただし全用途未満）を自由に組み合わせ可能。
 * その階に存在しない用途も含めて選択でき、グループ内の用途の専用部分面積比で案分される。
 */
export interface UsageGroup {
  id: string;
  floorId: string; // このグループ共用部が存在する階のID
  usageIds: string[]; // 2以上、建物全体の全用途未満。異なる階の用途IDを含むことが可能
  commonArea: number; // グループ共用部面積
}

/**
 * Floor - 階
 *
 * @property id - 階の一意識別子（UUID）
 * @property name - 階名称（例: "1階", "地下1階", "非階1"）
 * @property floorType - 階種別（'above-ground': 地上階, 'basement': 地階, 'non-floor': 非階）
 *                        オプショナル、デフォルト値は 'above-ground'
 *                        階の論理的な順序決定と階数入力機能で使用される
 *                        非階はPH（ペントハウス）、M（機械室）、R（屋上）などの階として扱わない層
 * @property floorCommonArea - 階の共用部面積
 * @property buildingCommonArea - 各階に存在する建物全体の共用部面積
 * @property usages - この階に存在する用途（消防法別表第一）の配列
 * @property usageGroups - この階に存在するグループ共用部の配列
 */
export interface Floor {
  id: string;
  name: string;
  floorType?: "above-ground" | "basement" | "non-floor";
  floorCommonArea: number;
  buildingCommonArea: number;
  usages: Usage[];
  usageGroups: UsageGroup[];
}

/**
 * Building - 建物
 */
export interface Building {
  id: string;
  floors: Floor[];
}

// ============================================================================
// Calculation Result Types
// ============================================================================

/**
 * DistributionDetail - 按分の詳細情報
 */
export interface DistributionDetail {
  sourceId: string; // 按分元のID（階IDまたはグループID）
  sourceName: string; // 按分元の名称
  sourceType: "floor" | "building" | "group"; // 按分元の種類
  distributedArea: number; // 按分された面積
  ratio: number; // 按分比率（0-1）
}

/**
 * UsageAreaBreakdown - 用途別面積内訳
 */
export interface UsageAreaBreakdown {
  usageId: string;
  annexedCode: string;
  annexedName: string;
  exclusiveArea: number;
  floorCommonArea: number; // 階の共用部の案分面積
  buildingCommonArea: number; // 建物全体の共用部の案分面積（全階からの合計）
  buildingCommonDetails?: DistributionDetail[]; // 階ごとの建物共用部按分の詳細
  // 各用途ごとの、階ごとの建物共用部按分（テストや詳細表示で使用）
  buildingCommonByFloor?: Map<string, number> | undefined;
  usageGroupCommonArea: number; // 特定用途間の共用部の案分面積（全グループからの合計）
  usageGroupDetails?: DistributionDetail[]; // グループごとの按分の詳細
  // グループ共用部ごとの按分詳細（グループID->用途ID->面積 のような構造を格納する目的）
  usageGroupCommonByGroup?: Map<string, number> | undefined;
  totalArea: number; // 総面積
}

/**
 * FloorResult - 階ごとの計算結果
 */
export interface FloorResult {
  floorId: string;
  floorName: string;
  usageBreakdowns: UsageAreaBreakdown[];
  // 案分前のデータ
  originalData?: {
    totalExclusiveArea: number; // 階の専有面積合計
    floorCommonArea: number; // 階共用部面積（案分前）
    buildingCommonArea: number; // 建物共用部面積（案分前）
    usageGroupCommonArea: number; // 用途グループ共用部面積の合計（案分前）
  };
}

/**
 * BuildingUsageTotal - 建物全体の用途別集計
 */
export interface BuildingUsageTotal {
  annexedCode: string;
  annexedName: string;
  exclusiveArea: number;
  floorCommonArea: number;
  buildingCommonArea: number;
  usageGroupCommonArea: number;
  totalArea: number;
}

/**
 * BuildingTotalResult - 建物全体の集計結果
 */
export interface BuildingTotalResult {
  usageTotals: BuildingUsageTotal[];
  grandTotal: number;
}

/**
 * DistributionTrace - 按分経過の追跡情報
 */
export interface DistributionTrace {
  // 建物共用部の按分経過
  buildingCommonTraces: {
    sourceFloorId: string;
    sourceFloorName: string;
    totalArea: number;
    distributions: {
      usageId: string;
      annexedCode: string;
      annexedName: string;
      floorId: string;
      floorName: string;
      distributedArea: number;
      ratio: number;
    }[];
  }[];
  // グループ共用部の按分経過
  usageGroupTraces: {
    groupId: string;
    groupFloorId: string;
    groupFloorName: string;
    totalArea: number;
    usageIds: string[];
    distributions: {
      usageId: string;
      annexedCode: string;
      annexedName: string;
      distributedArea: number;
      ratio: number;
    }[];
  }[];
}

/**
 * UsageClassification - 用途判定結果
 * 
 * 複合用途防火対象物の用途分類を表す
 */
export interface UsageClassification {
  /**
   * 判定結果
   * - 'annex16_i': 16項イ（危険性の高い用途を含む複合用途）
   * - 'annex16_ro': 16項ロ（その他の複合用途）
   * - 単一用途の場合: その用途コード（例: 'annex04', 'annex06_i'）
   */
  classification: string;

  /**
   * 判定結果の表示名
   */
  displayName: string;

  /**
   * 構成用途または「みなし従属」の詳細
   */
  details: string[];

  /**
   * 主たる用途（最大面積の用途）
   */
  mainUsage?: {
    annexedCode: string;
    annexedName: string;
    area: number;
  };

  /**
   * 従属的な部分とみなされた用途（存在する場合）
   */
  subordinateUsages?: {
    annexedCode: string;
    annexedName: string;
    area: number;
  }[];

  /**
   * 複数の判定がある場合（6項ハの入居・宿泊判定）
   */
  alternativeClassification?: {
    classification: string;
    displayName: string;
    details: string[];
    note: string;
  };
}

/**
 * CalculationResults - 計算結果全体
 */
export interface CalculationResults {
  floorResults: FloorResult[];
  buildingTotal: BuildingTotalResult;
  distributionTrace: DistributionTrace; // 按分経過表
  usageClassification?: UsageClassification; // 用途判定結果
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * ValidationError - バリデーションエラー
 */
export type ValidationError =
  | { type: "REQUIRED_FIELD"; field: string; message: string }
  | { type: "INVALID_NUMBER"; field: string; message: string }
  | { type: "NEGATIVE_VALUE"; field: string; message: string }
  | { type: "INVALID_INTEGER"; field: string; message: string }
  | { type: "MAX_VALUE_EXCEEDED"; field: string; message: string }
  | { type: "INVALID_USAGE_GROUP"; field: string; message: string }
  | { type: "MINIMUM_CONSTRAINT"; field: string; message: string }
  | { type: "USER_CANCELLED"; field: string; message: string }
  | { type: "DUPLICATE"; field: string; message: string };

/**
 * CalculationError - 計算エラー
 */
export type CalculationError =
  | { type: "ZERO_EXCLUSIVE_AREA_SUM"; floorId?: string; groupId?: string }
  | { type: "INVALID_USAGE_GROUP"; groupId: string }
  | { type: "INVALID_FLOOR_COMMON_AREA"; floorId: string }
  | { type: "NEGATIVE_VALUE"; field: string };

/**
 * StorageError - ストレージエラー
 */
export type StorageError =
  | { type: "QUOTA_EXCEEDED"; message: string }
  | { type: "PARSE_ERROR"; message: string }
  | { type: "NOT_FOUND"; caseId: string };

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result - 成功または失敗を表す型
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

// ============================================================================
// Constants
// ============================================================================

/**
 * BuildingUse - 用途コードと用途名称の組み合わせ
 */
export interface BuildingUse {
  code: string;
  name: string;
}

/**
 * buildingUses - 消防法施行令別表第一の項番号リスト
 * 消防法施行令別表第一に基づく用途分類
 */
export const buildingUses: BuildingUse[] = [
  // 1項
  { code: "annex01_i", name: "１項イ" },
  { code: "annex01_ro", name: "１項ロ" },

  // 2項
  { code: "annex02_i", name: "２項イ" },
  { code: "annex02_ro", name: "２項ロ" },
  { code: "annex02_ha", name: "２項ハ" },
  { code: "annex02_ni", name: "２項ニ" },

  // 3項
  { code: "annex03_i", name: "３項イ" },
  { code: "annex03_ro", name: "３項ロ" },

  // 4項
  { code: "annex04", name: "４項" },

  // 5項
  { code: "annex05_i", name: "５項イ" },
  { code: "annex05_ro", name: "５項ロ" },

  // 6項イ
  { code: "annex06_i_1", name: "６項イ(1)" },
  { code: "annex06_i_2", name: "６項イ(2)" },
  { code: "annex06_i_3", name: "６項イ(3)" },
  { code: "annex06_i_4", name: "６項イ(4)" },
  { code: "annex06_i", name: "６項イ" }, // 集約後

  // 6項ロ
  { code: "annex06_ro_1", name: "６項ロ(1)" },
  { code: "annex06_ro_2", name: "６項ロ(2)" },
  { code: "annex06_ro_3", name: "６項ロ(3)" },
  { code: "annex06_ro_4", name: "６項ロ(4)" },
  { code: "annex06_ro_5", name: "６項ロ(5)" },
  { code: "annex06_ro", name: "６項ロ" }, // 集約後

  // 6項ハ
  { code: "annex06_ha_1", name: "６項ハ(1)" },
  { code: "annex06_ha_2", name: "６項ハ(2)" },
  { code: "annex06_ha_3", name: "６項ハ(3)" },
  { code: "annex06_ha_4", name: "６項ハ(4)" },
  { code: "annex06_ha_5", name: "６項ハ(5)" },
  { code: "annex06_ha", name: "６項ハ" }, // 集約後

  // 6項ニ
  { code: "annex06_ni", name: "６項ニ" },

  // 7項〜15項
  { code: "annex07", name: "７項" },
  { code: "annex08", name: "８項" },
  
  // 9項
  { code: "annex09_i", name: "９項イ" },
  { code: "annex09_ro", name: "９項ロ" },
  
  { code: "annex10", name: "１０項" },
  { code: "annex11", name: "１１項" },
  
  // 12項
  { code: "annex12_i", name: "１２項イ" },
  { code: "annex12_ro", name: "１２項ロ" },
  
  // 13項
  { code: "annex13_i", name: "１３項イ" },
  { code: "annex13_ro", name: "１３項ロ" },
  
  { code: "annex14", name: "１４項" },
  { code: "annex15", name: "１５項" },
];

/**
 * selectableBuildingUses - ユーザーが選択可能な用途のリスト
 * 集約後の用途コード（annex06_i, annex06_ro, annex06_ha）を除外
 */
export const selectableBuildingUses: BuildingUse[] = buildingUses.filter(
  use => !['annex06_i', 'annex06_ro', 'annex06_ha'].includes(use.code)
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * generateUUID - UUID v4を生成する
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
