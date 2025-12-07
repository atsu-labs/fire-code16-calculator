/**
 * floorGenerator.ts - 階生成ユーティリティ
 */

import { type Floor, generateUUID } from "../types";

/**
 * generateFloors - 地上階数と地階数から階配列を生成する
 *
 * @param aboveGroundCount - 地上階数（0以上の整数）
 * @param basementCount - 地階数（0以上の整数）
 * @returns 生成された階の配列（地上階降順 → 地階降順）
 *
 * 生成規則:
 * - 地上階: "1階", "2階", ... (floorType: 'above-ground')
 * - 地階: "地下1階", "地下2階", ... (floorType: 'basement')
 * - 各階に一意のUUIDを割り当て
 * - 初期値: 共用部面積=0, usages=[], usageGroups=[]
 * - 表示順: 地上階の降順（上階→下階）、その後地階の降順（地下1階→下層）
 */
export function generateFloors(
  aboveGroundCount: number,
  basementCount: number
): Floor[] {
  const floors: Floor[] = [];

  // 地上階を生成（降順: N階 → 1階）
  for (let i = aboveGroundCount; i >= 1; i--) {
    floors.push({
      id: generateUUID(),
      name: `${i}階`,
      floorType: "above-ground",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    });
  }

  // 地階を生成（降順: 地下1階 → 地下N階）
  for (let i = 1; i <= basementCount; i++) {
    floors.push({
      id: generateUUID(),
      name: `地下${i}階`,
      floorType: "basement",
      floorCommonArea: 0,
      buildingCommonArea: 0,
      usages: [],
      usageGroups: [],
    });
  }

  return floors;
}
