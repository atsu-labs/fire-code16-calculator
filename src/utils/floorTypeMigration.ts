/**
 * floorTypeMigration.ts - 既存階データのfloorType移行ヘルパー
 *
 * 既存の階データから階タイプ（地上階/地階）を推測し、floorTypeフィールドを設定する。
 */

import type { Floor } from "../types";

/**
 * 既存の階データにfloorTypeフィールドを設定する
 *
 * @param floor - 移行対象の階データ
 * @returns floorTypeが設定された新しい階データ
 *
 * @remarks
 * - 階名に"地下"が含まれる場合は'basement'、それ以外は'above-ground'を設定
 * - 既にfloorTypeが設定されている場合はそのまま保持
 * - デフォルト値として'above-ground'を使用
 * - 不変性を保持し、元のオブジェクトを変更しない
 *
 * @example
 * ```typescript
 * const floor = { id: '1', name: '地下1階', ... };
 * const migrated = migrateFloorType(floor);
 * // migrated.floorType === 'basement'
 * ```
 */
export function migrateFloorType(floor: Floor): Floor {
  // 既にfloorTypeが設定されている場合はスキップ
  if (floor.floorType !== undefined) {
    return { ...floor };
  }

  // 階名から階タイプを推測
  const floorType = floor.name.includes("地下") ? "basement" : "above-ground";

  // 新しいオブジェクトを返す（不変性を保持）
  return {
    ...floor,
    floorType,
  };
}
