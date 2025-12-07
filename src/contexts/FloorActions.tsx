/**
 * FloorActions - 階管理アクション
 */

import { useCallback } from 'react';
import { useAppState } from './AppStateContext';
import { type Floor, type ValidationError, type Result, generateUUID } from '../types';
import { ValidationService } from '../services/ValidationService';
import { generateFloors } from '../utils/floorGenerator';
import { calculateFloorDiff } from '../utils/floorDiffCalculator';
import { cleanupUsageGroupsAfterFloorDeletion } from '../utils/cascadeDeleteHelper';

// ValidationServiceのインスタンスを作成
const validationService = new ValidationService();

/**
 * checkDataLossInFloors - 削除される階にデータが存在するかチェック
 * 
 * @param floors - 全階配列
 * @param deletedFloorIds - 削除される階のID配列
 * @returns データ損失がある場合はtrue
 */
function checkDataLossInFloors(floors: Floor[], deletedFloorIds: string[]): boolean {
  return floors.some((floor) => {
    if (!deletedFloorIds.includes(floor.id)) return false;
    
    // 用途データ、共用部面積、グループ共用部のいずれかが存在する場合はデータ損失とみなす
    return (
      floor.usages.length > 0 ||
      floor.floorCommonArea > 0 ||
      floor.buildingCommonArea > 0 ||
      floor.usageGroups.length > 0
    );
  });
}

/**
 * useFloorActions - 階管理アクションを提供するカスタムフック
 */
export function useFloorActions() {
  const { state, dispatch } = useAppState();

  /**
   * addFloor - 新しい階を追加
   */
  const addFloor = useCallback(
    async (floorName: string): Promise<Result<Floor, ValidationError>> => {
      // バリデーション
      const nameValidation = validationService.validateFloorName(floorName);
      if (!nameValidation.success) {
        return nameValidation;
      }

      // 新しい階を作成
      const newFloor: Floor = {
        id: generateUUID(),
        name: floorName,
        floorCommonArea: 0,
        buildingCommonArea: 0,
        usages: [],
        usageGroups: [],
      };

      // 状態を更新
      dispatch({
        type: 'ADD_FLOOR',
        payload: newFloor,
      });

      return { success: true, value: newFloor };
    },
    [dispatch]
  );

  /**
   * updateFloor - 階情報を更新
   */
  const updateFloor = useCallback(
    async (
      floorId: string,
      updates: Partial<Floor>
    ): Promise<Result<Floor, ValidationError>> => {
      // 共用部面積のバリデーション
      if (updates.floorCommonArea !== undefined) {
        const areaValidation = validationService.validateArea(
          updates.floorCommonArea,
          'floorCommonArea'
        );
        if (!areaValidation.success) {
          return areaValidation;
        }
      }

      // 状態を更新
      dispatch({
        type: 'UPDATE_FLOOR',
        payload: { floorId, updates },
      });

      // 更新後の階を取得
      const updatedFloor = state.building.floors.find((f) => f.id === floorId);
      if (!updatedFloor) {
        return {
          success: false,
          error: {
            type: 'REQUIRED_FIELD',
            field: 'floorId',
            message: '階が見つかりません',
          },
        };
      }

      return { success: true, value: { ...updatedFloor, ...updates } };
    },
    [dispatch, state.building.floors]
  );

  /**
   * deleteFloor - 階を削除
   */
  const deleteFloor = useCallback(
    async (floorId: string): Promise<Result<void, ValidationError>> => {
      // 最低1階の維持制約
      if (state.building.floors.length <= 1) {
        return {
          success: false,
          error: {
            type: 'MINIMUM_CONSTRAINT',
            field: 'floors',
            message: '最低1つの階が必要です',
          },
        };
      }

      // 状態を更新（カスケード削除は自動的に行われる）
      dispatch({
        type: 'DELETE_FLOOR',
        payload: floorId,
      });

      return { success: true, value: undefined };
    },
    [dispatch, state.building.floors.length]
  );

  /**
   * setFloorCounts - 地上階数と地階数を設定し、階データを自動生成・更新
   * 
   * @param aboveGroundCount - 地上階数（0以上の整数）
   * @param basementCount - 地階数（0以上の整数）
   * @returns 処理結果
   */
  const setFloorCounts = useCallback(
    async (
      aboveGroundCount: number,
      basementCount: number
    ): Promise<Result<void, ValidationError>> => {
      // 最低1階制約のバリデーション
      if (aboveGroundCount + basementCount < 1) {
        return {
          success: false,
          error: {
            type: 'MINIMUM_CONSTRAINT',
            field: 'floors',
            message: '最低1つの階が必要です（地上階数 + 地階数 >= 1）',
          },
        };
      }

      // 目標階配列を生成
      const targetFloors = generateFloors(aboveGroundCount, basementCount);

      // 現在階と目標階の差分を検出
      const { mergedFloors, deletedFloorIds } = calculateFloorDiff(
        state.building.floors,
        targetFloors
      );

      // 階削除時のデータ損失を検出
      if (deletedFloorIds.length > 0) {
        const hasDataLoss = checkDataLossInFloors(state.building.floors, deletedFloorIds);

        // データ損失がある場合は確認ダイアログを表示
        if (hasDataLoss) {
          const confirmed = window.confirm(
            '削除される階にデータが存在します。削除してよろしいですか？\n' +
            '削除される階に関連するグループ共用部も自動的に削除されます。'
          );

          if (!confirmed) {
            // ユーザーがキャンセルした場合
            return {
              success: false,
              error: {
                type: 'USER_CANCELLED',
                field: 'floors',
                message: 'ユーザーが操作をキャンセルしました',
              },
            };
          }
        }
      }

      // カスケード削除ユーティリティを実行
      const cleanedFloors = cleanupUsageGroupsAfterFloorDeletion(
        mergedFloors,
        deletedFloorIds
      );

      // SET_FLOOR_COUNTSアクションをディスパッチ
      dispatch({
        type: 'SET_FLOOR_COUNTS',
        payload: {
          floors: cleanedFloors,
          deletedFloorIds,
        },
      });

      return { success: true, value: undefined };
    },
    [dispatch, state.building.floors]
  );

  return {
    addFloor,
    updateFloor,
    deleteFloor,
    setFloorCounts,
  };
}
