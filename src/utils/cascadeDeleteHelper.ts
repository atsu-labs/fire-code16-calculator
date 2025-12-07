/**
 * cascadeDeleteHelper.ts - カスケード削除ヘルパー
 */

import { type Floor } from "../types";

/**
 * cleanupUsageGroupsAfterFloorDeletion - 階削除時のグループ共用部のクリーンアップ
 *
 * @param floors - 階配列
 * @param deleteFloorIds - 削除する階のID配列
 * @returns 整合性維持後の階配列
 *
 * クリーンアップルール:
 * 1. 削除階に所属するグループ共用部を削除する
 * 2. 削除階の用途IDを収集し、他階のグループ共用部から該当用途IDを除外する
 * 3. 除外後の用途数が2未満になったグループ共用部を削除する（二次削除）
 * 4. 整合性維持後の階配列を返却する（イミュータブル）
 */
export function cleanupUsageGroupsAfterFloorDeletion(
  floors: Floor[],
  deleteFloorIds: string[]
): Floor[] {
  // 削除階IDをSetに変換（高速検索用）
  const deleteFloorIdSet = new Set(deleteFloorIds);

  // 削除階の用途IDを収集
  const deleteUsageIds = new Set<string>();
  for (const floor of floors) {
    if (deleteFloorIdSet.has(floor.id)) {
      for (const usage of floor.usages) {
        deleteUsageIds.add(usage.id);
      }
    }
  }

  // 各階のグループ共用部をクリーンアップ
  return floors.map((floor) => {
    // 削除階の場合、グループ共用部を空配列にする
    if (deleteFloorIdSet.has(floor.id)) {
      return {
        ...floor,
        usageGroups: [],
      };
    }

    // 他階の場合、削除階の用途IDを除外し、用途数2未満のグループを削除
    const cleanedUsageGroups = floor.usageGroups
      .map((group) => ({
        ...group,
        usageIds: group.usageIds.filter((id) => !deleteUsageIds.has(id)),
      }))
      .filter((group) => group.usageIds.length >= 2); // 用途数2未満を削除

    return {
      ...floor,
      usageGroups: cleanedUsageGroups,
    };
  });
}
