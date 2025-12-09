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
 * @property name - 階名称（例: "1階", "地下1階"）
 * @property floorType - 階種別（'above-ground': 地上階, 'basement': 地階）
 *                        オプショナル、デフォルト値は 'above-ground'
 *                        階の論理的な順序決定と階数入力機能で使用される
 * @property floorCommonArea - 階の共用部面積
 * @property buildingCommonArea - 各階に存在する建物全体の共用部面積
 * @property usages - この階に存在する用途（消防法別表第一）の配列
 * @property usageGroups - この階に存在するグループ共用部の配列
 */
export interface Floor {
  id: string;
  name: string;
  floorType?: "above-ground" | "basement";
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
 * UsageAreaBreakdown - 用途別面積内訳
 */
export interface UsageAreaBreakdown {
  usageId: string;
  annexedCode: string;
  annexedName: string;
  exclusiveArea: number;
  floorCommonArea: number; // 階の共用部の案分面積
  buildingCommonArea: number; // 建物全体の共用部の案分面積（全階からの合計）
  buildingCommonByFloor?: Map<string, number>; // 階ごとの建物共用部按分（floorId → 按分面積）
  usageGroupCommonArea: number; // 特定用途間の共用部の案分面積（全グループからの合計）
  usageGroupCommonByGroup?: Map<string, number>; // グループごとの按分（groupId → 按分面積）
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
  // この階に入力された建物共用部の按分結果（全用途への按分を含む）
  buildingCommonDistribution?: {
    usageId: string;
    annexedCode: string;
    annexedName: string;
    floorName: string; // その用途が存在する階名
    distributedArea: number;
  }[];
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
 * CalculationResults - 計算結果全体
 */
export interface CalculationResults {
  floorResults: FloorResult[];
  buildingTotal: BuildingTotalResult;
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
  | { type: "USER_CANCELLED"; field: string; message: string };

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

  // 6項ロ
  { code: "annex06_ro_1", name: "６項ロ(1)" },
  { code: "annex06_ro_2", name: "６項ロ(2)" },
  { code: "annex06_ro_3", name: "６項ロ(3)" },
  { code: "annex06_ro_4", name: "６項ロ(4)" },
  { code: "annex06_ro_5", name: "６項ロ(5)" },

  // 6項ハ
  { code: "annex06_ha_1", name: "６項ハ(1)" },
  { code: "annex06_ha_2", name: "６項ハ(2)" },
  { code: "annex06_ha_3", name: "６項ハ(3)" },
  { code: "annex06_ha_4", name: "６項ハ(4)" },
  { code: "annex06_ha_5", name: "６項ハ(5)" },

  // 6項ニ
  { code: "annex06_ni", name: "６項ニ" },

  // 7項〜20項
  { code: "annex07", name: "７項" },
  { code: "annex08", name: "８項" },
  { code: "annex09", name: "９項" },
  { code: "annex10", name: "１０項" },
  { code: "annex11", name: "１１項" },
  { code: "annex12", name: "１２項" },
  { code: "annex13", name: "１３項" },
  { code: "annex14", name: "１４項" },
  { code: "annex15", name: "１５項" },
  { code: "annex16", name: "１６項" },
  { code: "annex16_2", name: "１６項の２" },
  { code: "annex16_3", name: "１６項の３" },
  { code: "annex17", name: "１７項" },
  { code: "annex18", name: "１８項" },
  { code: "annex19", name: "１９項" },
  { code: "annex20", name: "２０項" },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * generateUUID - UUID v4を生成する
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
