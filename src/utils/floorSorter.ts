/**
 * floorSorter.ts - 階のソートユーティリティ
 * 非階 → 地上階（降順） → 地階（降順）の順序でソート
 */

import type { Floor } from "../types";

/**
 * extractFloorNumber - 階名から数値を抽出
 *
 * @param floorName - 階名（例: "5階", "地下2階"）
 * @returns 抽出した数値、抽出できない場合は0
 */
function extractFloorNumber(floorName: string): number {
  const match = floorName.match(/(\d+)階/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * extractBasementNumber - 地階名から数値を抽出
 *
 * @param floorName - 地階名（例: "地下2階"）
 * @returns 抽出した数値、抽出できない場合は0
 */
function extractBasementNumber(floorName: string): number {
  const match = floorName.match(/地下(\d+)階/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * sortFloors - 階配列を表示順序に並び替え
 *
 * @param floors - 階配列
 * @returns ソートされた階配列（非階 → 地上階降順 → 地階降順）
 *
 * ソート順序:
 * 1. 非階 (floorType: 'non-floor') - 配列内の順序を維持
 * 2. 地上階 (floorType: 'above-ground') - 階数の降順（5階 → 1階）
 * 3. 地階 (floorType: 'basement') - 地階数の昇順（地下1階 → 地下5階）
 */
export function sortFloors(floors: Floor[]): Floor[] {
  // 1. 非階を抽出（順序を維持）
  const nonFloors = floors.filter((f) => f.floorType === "non-floor");

  // 2. 地上階を抽出して降順ソート
  const aboveGroundFloors = floors
    .filter((f) => f.floorType === "above-ground" || f.floorType === undefined)
    .sort((a, b) => extractFloorNumber(b.name) - extractFloorNumber(a.name));

  // 3. 地階を抽出して昇順ソート（地下1階が先）
  const basementFloors = floors
    .filter((f) => f.floorType === "basement")
    .sort(
      (a, b) => extractBasementNumber(a.name) - extractBasementNumber(b.name)
    );

  // 結合して返す
  return [...nonFloors, ...aboveGroundFloors, ...basementFloors];
}
