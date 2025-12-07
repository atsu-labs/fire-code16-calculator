/**
 * CalculationEngine - 共用部案分計算エンジン
 * Requirements 7, 8, 9, 10, 11: 階の共用部、建物全体の共用部、特定用途間の共用部の案分計算、総面積算出、建物全体集計
 */

import type {
  Usage,
  UsageGroup,
  UsageAreaBreakdown,
  BuildingUsageTotal,
  BuildingTotalResult,
  CalculationError,
  Result,
} from "../types";

export class CalculationEngine {
  /**
   * 小数点以下2桁に丸める
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Task 3.1: 階の共用部案分計算
   * Requirement 7: 階の共用部面積の案分計算
   *
   * 階内の各用途の専用部分面積の比率に応じて共用部面積を案分
   *
   * @param floorUsages - 階内の用途リスト
   * @param floorCommonArea - 階の共用部面積
   * @returns 各用途IDに対する案分面積のMap
   */
  calculateFloorCommonArea(
    floorUsages: Usage[],
    floorCommonArea: number
  ): Result<Map<string, number>, CalculationError> {
    // 共用部面積が0の場合は全用途に0を割り当て
    if (floorCommonArea === 0) {
      const result = new Map<string, number>();
      floorUsages.forEach((usage) => {
        result.set(usage.id, 0);
      });
      return { success: true, value: result };
    }

    // 専用部分面積の合計を算出
    const totalExclusiveArea = floorUsages.reduce(
      (sum, usage) => sum + usage.exclusiveArea,
      0
    );

    // 専用部分面積の合計が0の場合はエラー
    if (totalExclusiveArea === 0) {
      return {
        success: false,
        error: {
          type: "ZERO_EXCLUSIVE_AREA_SUM",
        },
      };
    }

    // 各用途に案分
    const result = new Map<string, number>();
    floorUsages.forEach((usage) => {
      const ratio = usage.exclusiveArea / totalExclusiveArea;
      const distributedArea = this.round(ratio * floorCommonArea);
      result.set(usage.id, distributedArea);
    });

    return { success: true, value: result };
  }

  /**
   * Task 3.2: 建物全体の共用部案分計算
   * Requirement 8: 建物全体の共用部面積の案分計算
   *
   * 全階・全用途の専用部分面積の比率に応じて共用部面積を案分
   *
   * @param allUsages - 全階の全用途リスト
   * @param buildingCommonArea - 建物全体の共用部面積
   * @returns 各用途IDに対する案分面積のMap
   */
  calculateBuildingCommonArea(
    allUsages: Usage[],
    buildingCommonArea: number
  ): Result<Map<string, number>, CalculationError> {
    // 共用部面積が0の場合は全用途に0を割り当て
    if (buildingCommonArea === 0) {
      const result = new Map<string, number>();
      allUsages.forEach((usage) => {
        result.set(usage.id, 0);
      });
      return { success: true, value: result };
    }

    // 専用部分面積の総合計を算出
    const totalExclusiveArea = allUsages.reduce(
      (sum, usage) => sum + usage.exclusiveArea,
      0
    );

    // 専用部分面積の総合計が0の場合はエラー
    if (totalExclusiveArea === 0) {
      return {
        success: false,
        error: {
          type: "ZERO_EXCLUSIVE_AREA_SUM",
        },
      };
    }

    // 各用途に案分
    const result = new Map<string, number>();
    allUsages.forEach((usage) => {
      const ratio = usage.exclusiveArea / totalExclusiveArea;
      const distributedArea = this.round(ratio * buildingCommonArea);
      result.set(usage.id, distributedArea);
    });

    return { success: true, value: result };
  }

  /**
   * Task 3.3: 特定用途間の共用部案分計算
   * Requirement 9: 特定用途間の共用部面積の案分計算
   *
   * 用途グループ内の各用途の専用部分面積の比率に応じて共用部面積を案分
   *
   * @param allUsages - 全用途リスト（グループの用途を含む階の全用途）
   * @param usageGroup - 用途グループ
   * @returns グループ内の各用途IDに対する案分面積のMap
   */
  calculateUsageGroupCommonArea(
    allUsages: Usage[],
    usageGroup: UsageGroup
  ): Result<Map<string, number>, CalculationError> {
    // 用途グループの共用部面積が0の場合は全用途に0を割り当て
    if (usageGroup.commonArea === 0) {
      const result = new Map<string, number>();
      usageGroup.usageIds.forEach((usageId) => {
        result.set(usageId, 0);
      });
      return { success: true, value: result };
    }

    // グループ内の用途を取得
    const usageMap = new Map(allUsages.map((u) => [u.id, u]));
    const groupUsages: Usage[] = [];

    for (const usageId of usageGroup.usageIds) {
      const usage = usageMap.get(usageId);
      if (!usage) {
        return {
          success: false,
          error: {
            type: "INVALID_USAGE_GROUP",
            groupId: usageGroup.id,
          },
        };
      }
      groupUsages.push(usage);
    }

    // グループ内の専用部分面積の合計を算出
    const totalExclusiveArea = groupUsages.reduce(
      (sum, usage) => sum + usage.exclusiveArea,
      0
    );

    // グループ内の専用部分面積の合計が0の場合はエラー
    if (totalExclusiveArea === 0) {
      return {
        success: false,
        error: {
          type: "ZERO_EXCLUSIVE_AREA_SUM",
          groupId: usageGroup.id,
        },
      };
    }

    // グループ内の各用途に案分
    const result = new Map<string, number>();
    groupUsages.forEach((usage) => {
      const ratio = usage.exclusiveArea / totalExclusiveArea;
      const distributedArea = this.round(ratio * usageGroup.commonArea);
      result.set(usage.id, distributedArea);
    });

    return { success: true, value: result };
  }

  /**
   * Task 3.4 - 各用途の総面積を計算
   *
   * Requirement 10: 用途ごとの総面積 = 専用面積 + 階共用部按分 + 建物共用部按分 + 用途グループ共用部按分
   *
   * @param usages - 全用途の配列
   * @param floorCommonResults - 階共用部按分結果(用途IDをキーとするMap)
   * @param buildingCommonResults - 建物共用部按分結果(用途IDをキーとするMap)
   * @param usageGroupResults - 用途グループ共用部按分結果(用途IDをキーとするMap)
   * @returns 用途別の面積内訳(UsageAreaBreakdown)の配列
   */
  calculateTotalAreas(
    usages: Usage[],
    floorCommonResults: Map<string, number>,
    buildingCommonResults: Map<string, number>,
    usageGroupResults: Map<string, number>
  ): Result<UsageAreaBreakdown[], never> {
    const breakdowns = usages.map((usage) => {
      const floorCommon = floorCommonResults.get(usage.id) ?? 0;
      const buildingCommon = buildingCommonResults.get(usage.id) ?? 0;
      const usageGroupCommon = usageGroupResults.get(usage.id) ?? 0;

      const total = this.round(
        usage.exclusiveArea + floorCommon + buildingCommon + usageGroupCommon
      );

      const breakdown: UsageAreaBreakdown = {
        usageId: usage.id,
        annexedCode: usage.annexedCode,
        annexedName: usage.annexedName,
        exclusiveArea: this.round(usage.exclusiveArea),
        floorCommonArea: this.round(floorCommon),
        buildingCommonArea: this.round(buildingCommon),
        usageGroupCommonArea: this.round(usageGroupCommon),
        totalArea: total,
      };

      return breakdown;
    });

    return { success: true, value: breakdowns };
  }

  /**
   * Task 3.4 - 建物全体の用途別集計を計算
   *
   * Requirement 11: 同一用途コードの用途を跨いで各面積項目を集計
   *
   * @param floorBreakdowns - 階ごとの面積内訳配列の配列
   * @returns 建物全体の用途別集計結果
   */
  aggregateBuildingTotals(
    floorBreakdowns: UsageAreaBreakdown[][]
  ): Result<BuildingTotalResult, never> {
    // 全フロアの内訳を平坦化
    const allBreakdowns = floorBreakdowns.flat();

    // 用途コード(annexedCode)でグループ化して集計
    const aggregationMap = new Map<string, BuildingUsageTotal>();

    for (const breakdown of allBreakdowns) {
      const key = breakdown.annexedCode;

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          annexedCode: breakdown.annexedCode,
          annexedName: breakdown.annexedName,
          exclusiveArea: 0,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usageGroupCommonArea: 0,
          totalArea: 0,
        });
      }

      const current = aggregationMap.get(key)!;
      current.exclusiveArea = this.round(
        current.exclusiveArea + breakdown.exclusiveArea
      );
      current.floorCommonArea = this.round(
        current.floorCommonArea + breakdown.floorCommonArea
      );
      current.buildingCommonArea = this.round(
        current.buildingCommonArea + breakdown.buildingCommonArea
      );
      current.usageGroupCommonArea = this.round(
        current.usageGroupCommonArea + breakdown.usageGroupCommonArea
      );
      current.totalArea = this.round(current.totalArea + breakdown.totalArea);
    }

    // 用途コードでソート
    const usageTotals = Array.from(aggregationMap.values()).sort((a, b) =>
      a.annexedCode.localeCompare(b.annexedCode)
    );

    // 総計を計算
    const grandTotal = this.round(
      usageTotals.reduce((sum, usage) => sum + usage.totalArea, 0)
    );

    return {
      success: true,
      value: {
        usageTotals,
        grandTotal,
      },
    };
  }
}
