/**
 * ValidationService - 入力データの検証サービス
 * Requirement 6: 入力値の検証
 */

import type {
  Floor,
  Usage,
  UsageGroup,
  ValidationError,
  Result,
} from "../types";

export class ValidationService {
  /**
   * 階数の最大値制限
   */
  private static readonly MAX_FLOOR_COUNT = 1000;

  /**
   * 整数値の検証
   * - 0以上の整数のみを許可
   * - 最大値制限: 1000階
   * - 負の数、小数、非数値を拒否
   *
   * @param value - 検証する数値
   * @param fieldName - フィールド名（エラーメッセージに使用）
   * @returns 検証結果
   */
  validateInteger(
    value: number,
    fieldName: string
  ): Result<void, ValidationError> {
    // NaNまたはInfinityのチェック
    if (!Number.isFinite(value)) {
      return {
        success: false,
        error: {
          type: "INVALID_NUMBER",
          field: fieldName,
          message: `${fieldName}は有効な数値である必要があります`,
        },
      };
    }

    // 負の数値のチェック
    if (value < 0) {
      return {
        success: false,
        error: {
          type: "NEGATIVE_VALUE",
          field: fieldName,
          message: `${fieldName}は0以上の整数である必要があります`,
        },
      };
    }

    // 整数チェック
    if (!Number.isInteger(value)) {
      return {
        success: false,
        error: {
          type: "INVALID_INTEGER",
          field: fieldName,
          message: `${fieldName}は整数である必要があります（小数は使用できません）`,
        },
      };
    }

    // 最大値制限チェック (1000階)
    if (value > ValidationService.MAX_FLOOR_COUNT) {
      return {
        success: false,
        error: {
          type: "MAX_VALUE_EXCEEDED",
          field: fieldName,
          message: `${fieldName}は最大値${ValidationService.MAX_FLOOR_COUNT}以下である必要があります（現在: ${value}）`,
        },
      };
    }

    return { success: true, value: undefined };
  }

  /**
   * 面積値の検証
   * - 正の数値であること（0を含む）
   * - 有限の数値であること
   * - 小数点以下を許容
   */
  validateArea(
    value: number,
    fieldName: string
  ): Result<void, ValidationError> {
    // NaNまたはInfinityのチェック
    if (!Number.isFinite(value)) {
      return {
        success: false,
        error: {
          type: "INVALID_NUMBER",
          field: fieldName,
          message: `${fieldName}は有効な数値である必要があります`,
        },
      };
    }

    // 負の数値のチェック
    if (value < 0) {
      return {
        success: false,
        error: {
          type: "NEGATIVE_VALUE",
          field: fieldName,
          message: `${fieldName}は0以上の値である必要があります（負の値は使用できません）`,
        },
      };
    }

    return { success: true, value: undefined };
  }

  /**
   * 階名称の検証
   * - 必須項目
   * - 空白文字のみは不可
   */
  validateFloorName(name: string | undefined): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "REQUIRED_FIELD",
          field: "floorName",
          message: "階名称は必須項目です",
        },
      };
    }

    return { success: true, value: undefined };
  }

  /**
   * 用途コードの検証
   * - 必須項目
   * - 空白文字のみは不可
   */
  validateUsageCode(code: string | undefined): Result<void, ValidationError> {
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "REQUIRED_FIELD",
          field: "annexedCode",
          message: "用途コードの選択は必須です",
        },
      };
    }

    return { success: true, value: undefined };
  }

  /**
   * 階データの検証
   * - 階名称が必須
   * - 階の共用部面積が有効な数値
   */
  validateFloor(floor: Partial<Floor>): Result<void, ValidationError> {
    // 階名称の検証
    const nameResult = this.validateFloorName(floor.name);
    if (!nameResult.success) {
      return nameResult;
    }

    // 階の共用部面積の検証（オプショナル、ただし指定された場合は有効な数値である必要がある）
    if (floor.floorCommonArea !== undefined) {
      const areaResult = this.validateArea(
        floor.floorCommonArea,
        "floorCommonArea"
      );
      if (!areaResult.success) {
        return areaResult;
      }
    }

    return { success: true, value: undefined };
  }

  /**
   * 用途データの検証
   * - 用途コードが必須
   * - 専用部分面積が有効な数値
   */
  validateUsage(usage: Partial<Usage>): Result<void, ValidationError> {
    // 用途コードの検証
    const codeResult = this.validateUsageCode(usage.annexedCode);
    if (!codeResult.success) {
      return codeResult;
    }

    // 専用部分面積の検証
    if (usage.exclusiveArea === undefined) {
      return {
        success: false,
        error: {
          type: "REQUIRED_FIELD",
          field: "exclusiveArea",
          message: "専用部分面積は必須項目です",
        },
      };
    }

    const areaResult = this.validateArea(usage.exclusiveArea, "exclusiveArea");
    if (!areaResult.success) {
      return areaResult;
    }

    return { success: true, value: undefined };
  }

  /**
   * 用途グループの検証（グループ共用部）
   * - 2用途以上が選択されていること
   * - 建物全体の全用途未満であること（全用途の場合は建物全体の共用部を使用）
   * - 選択された用途IDが実際に存在すること（建物全体の用途から検証）
   * - 共用部面積が有効な数値
   */
  validateUsageGroup(
    allBuildingUsages: Usage[],
    group: Partial<UsageGroup>
  ): Result<void, ValidationError> {
    // 用途IDリストの存在確認
    if (!group.usageIds || group.usageIds.length === 0) {
      return {
        success: false,
        error: {
          type: "INVALID_USAGE_GROUP",
          field: "usageIds",
          message:
            "用途グループには少なくとも2用途以上を選択する必要があります",
        },
      };
    }

    // 2用途以上のチェック
    if (group.usageIds.length < 2) {
      return {
        success: false,
        error: {
          type: "INVALID_USAGE_GROUP",
          field: "usageIds",
          message:
            "用途グループには少なくとも2用途以上を選択する必要があります",
        },
      };
    }

    // 建物全体の全用途未満のチェック
    if (group.usageIds.length >= allBuildingUsages.length) {
      return {
        success: false,
        error: {
          type: "INVALID_USAGE_GROUP",
          field: "usageIds",
          message:
            "用途グループには全用途を選択できません（全用途の場合は建物全体の共用部を使用してください）",
        },
      };
    }

    // 選択された用途IDが実際に存在するかチェック（建物全体の用途から）
    const buildingUsageIds = new Set(allBuildingUsages.map((u) => u.id));
    const invalidIds = group.usageIds.filter((id) => !buildingUsageIds.has(id));
    if (invalidIds.length > 0) {
      return {
        success: false,
        error: {
          type: "INVALID_USAGE_GROUP",
          field: "usageIds",
          message: `存在しない用途が選択されています: ${invalidIds.join(", ")}`,
        },
      };
    }

    // 共用部面積の検証
    if (group.commonArea === undefined) {
      return {
        success: false,
        error: {
          type: "REQUIRED_FIELD",
          field: "commonArea",
          message: "共用部面積は必須項目です",
        },
      };
    }

    const areaResult = this.validateArea(group.commonArea, "commonArea");
    if (!areaResult.success) {
      return areaResult;
    }

    return { success: true, value: undefined };
  }
}
