/**
 * FloorManager コンポーネント
 * 階の階数入力を管理する
 * 
 * Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 6.3, 6.4, 7.1, 7.2, 7.3, 10.1, 10.2, 10.3
 */

import { useMemo, useCallback } from 'react';
import { useAppState } from '../contexts/useAppState';
import { useFloorActions } from '../contexts/FloorActions';
import { FloorCountInput } from './FloorCountInput';
import type { Floor } from '../types';
import '../styles/FloorManager.css';

/**
 * deriveFloorCounts - 既存の階データから地上階数と地階数を逆算
 * 
 * @param floors - 階配列
 * @returns 地上階数と地階数のオブジェクト
 * 
 * @example
 * const counts = deriveFloorCounts([
 *   { id: '1', name: '1階', floorType: 'above-ground', ... },
 *   { id: '2', name: '地下1階', floorType: 'basement', ... }
 * ]);
 * // returns { aboveGround: 1, basement: 1 }
 */
function deriveFloorCounts(floors: Floor[]): { aboveGround: number; basement: number } {
  const aboveGround = floors.filter(f => f.floorType !== 'basement').length;
  const basement = floors.filter(f => f.floorType === 'basement').length;
  return { aboveGround, basement };
}

/**
 * FloorManager - 階管理コンポーネント
 * 
 * 階数入力UIを表示し、階の追加・削除を管理する。
 * 階数入力による一括管理方式を採用。
 */
export function FloorManager() {
  const { state } = useAppState();
  const { setFloorCounts } = useFloorActions();

  // 既存階データから地上階数と地階数を逆算（メモ化）
  const { aboveGround, basement } = useMemo(
    () => deriveFloorCounts(state.building.floors),
    [state.building.floors]
  );

  /**
   * 階数変更ハンドラ
   * FloorCountInputから通知された階数変更をsetFloorCountsアクションに伝達
   */
  const handleFloorCountsChange = useCallback(
    async (aboveGroundCount: number, basementCount: number) => {
      const result = await setFloorCounts(aboveGroundCount, basementCount);
      if (!result.success) {
        console.error('階数変更に失敗:', result.error);
      }
    },
    [setFloorCounts]
  );

  return (
    <div className="floor-manager">
      <h2>階の管理</h2>
      
      {/* 階数入力UI */}
      <FloorCountInput
        aboveGroundCount={aboveGround}
        basementCount={basement}
        onChange={handleFloorCountsChange}
      />
    </div>
  );
}
