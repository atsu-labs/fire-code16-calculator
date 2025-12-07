/**
 * floorDiffCalculator.ts - 階差分検出ユーティリティ
 */

import { type Floor } from "../types";

/**
 * FloorDiffResult - 階差分検出結果
 *
 * @property mergedFloors - マージ後の階配列（目標階の順序を保持）
 *                          既存階のデータ（id, usages, 共用部面積, usageGroups）は保持される
 * @property deletedFloorIds - 削除対象の階ID配列
 *                              目標階配列に存在しない既存階のIDのみが含まれる
 */
export interface FloorDiffResult {
  mergedFloors: Floor[];
  deletedFloorIds: string[];
}

/**
 * calculateFloorDiff - 現在の階配列と目標階配列を比較し、差分を検出する
 *
 * @param currentFloors - 現在の階配列
 * @param targetFloors - 目標階配列
 * @returns 差分検出結果
 *
 * 差分検出ルール:
 * - 階名とfloorTypeの組み合わせで一致判定を行う
 * - 既存階が目標階に存在する場合、既存階のデータ（id, usages, 共用部面積, usageGroups）を保持する
 * - 目標階に存在しない既存階は削除対象とする
 * - 既存階に存在しない目標階は新規追加とする
 * - マージ後の階配列は目標階の順序を保つ
 */
export function calculateFloorDiff(
  currentFloors: Floor[],
  targetFloors: Floor[]
): FloorDiffResult {
  const deletedFloorIds: string[] = [];
  const mergedFloors: Floor[] = [];

  // 目標階の順序でマージ処理
  for (const targetFloor of targetFloors) {
    // 階名とfloorTypeで一致する既存階を探す
    const existingFloor = currentFloors.find(
      (cf) =>
        cf.name === targetFloor.name &&
        (cf.floorType ?? "above-ground") ===
          (targetFloor.floorType ?? "above-ground")
    );

    if (existingFloor) {
      // 既存階が見つかった場合、既存データを保持
      mergedFloors.push(existingFloor);
    } else {
      // 新規階の場合、目標階をそのまま追加
      mergedFloors.push(targetFloor);
    }
  }

  // 削除対象の階IDを特定（目標階に存在しない既存階）
  for (const currentFloor of currentFloors) {
    const existsInTarget = targetFloors.some(
      (tf) =>
        tf.name === currentFloor.name &&
        (tf.floorType ?? "above-ground") ===
          (currentFloor.floorType ?? "above-ground")
    );

    if (!existsInTarget) {
      deletedFloorIds.push(currentFloor.id);
    }
  }

  return {
    mergedFloors,
    deletedFloorIds,
  };
}
