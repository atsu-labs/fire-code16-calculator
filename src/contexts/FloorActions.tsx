/**
 * FloorActions - 階管理アクション
 */

import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { type Floor, type ValidationError, type Result, generateUUID } from '../types';
import { ValidationService } from '../services/ValidationService';
import { generateFloors, generateNonFloors } from '../utils/floorGenerator';
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
   * copyFloorData - 階の用途・面積・共用面積情報を他の階にコピー
   */
  const copyFloorData = useCallback(
    async (
      sourceFloorId: string,
      targetFloorId: string
    ): Promise<Result<Floor, ValidationError>> => {
      const sourceFloor = state.building.floors.find((f) => f.id === sourceFloorId);
      const targetFloor = state.building.floors.find((f) => f.id === targetFloorId);

      if (!sourceFloor) {
        return {
          success: false,
          error: {
            type: 'REQUIRED_FIELD',
            field: 'floor',
            message: 'コピー元の階が見つかりません',
          },
        };
      }

      if (!targetFloor) {
        return {
          success: false,
          error: {
            type: 'REQUIRED_FIELD',
            field: 'floor',
            message: 'コピー先の階が見つかりません',
          },
        };
      }

      // 用途をコピー（新しいIDを生成）
      const copiedUsages = sourceFloor.usages.map((usage) => ({
        ...usage,
        id: generateUUID(),
      }));

      // グループ共用部をコピー（新しいIDを生成し、floorIdを更新）
      const copiedUsageGroups = sourceFloor.usageGroups.map((group) => ({
        ...group,
        id: generateUUID(),
        floorId: targetFloorId,
      }));

      // ターゲット階を更新
      dispatch({
        type: 'UPDATE_FLOOR',
        payload: {
          floorId: targetFloorId,
          updates: {
            floorCommonArea: sourceFloor.floorCommonArea,
            buildingCommonArea: sourceFloor.buildingCommonArea,
            usages: copiedUsages,
            usageGroups: copiedUsageGroups,
          },
        },
      });

      // 更新後の階を取得
      const updatedFloor = state.building.floors.find((f) => f.id === targetFloorId);
      if (!updatedFloor) {
        return {
          success: false,
          error: {
            type: 'REQUIRED_FIELD',
            field: 'floor',
            message: '階の更新に失敗しました',
          },
        };
      }

      return { success: true, value: updatedFloor };
    },
    [state.building.floors, dispatch]
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
   * setFloorCounts - 地上階数・地階数・非階数を設定し、階データを自動生成・更新
   * 
   * @param aboveGroundCount - 地上階数（0以上の整数）
   * @param basementCount - 地階数（0以上の整数）
   * @param nonFloorCount - 非階数（0以上の整数、オプショナル）
   * @returns 処理結果
   */
  const setFloorCounts = useCallback(
    async (
      aboveGroundCount: number,
      basementCount: number,
      nonFloorCount: number = 0
    ): Promise<Result<void, ValidationError>> => {
      // 最低1階制約のバリデーション（非階は含めない）
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

      // 目標階配列を生成（非階 + 地上階 + 地階）
      const targetFloors = [
        ...generateFloors(aboveGroundCount, basementCount),
        ...generateNonFloors(nonFloorCount),
      ];

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

  /**
   * updateFloorName - 階の名前を更新
   * 
   * @param floorId - 階ID
   * @param newName - 新しい階名
   * @returns 処理結果
   */
  const updateFloorName = useCallback(
    async (floorId: string, newName: string): Promise<Result<Floor, ValidationError>> => {
      // バリデーション
      const nameValidation = validationService.validateFloorName(newName);
      if (!nameValidation.success) {
        return nameValidation;
      }

      // 重複チェック
      const isDuplicate = state.building.floors.some(
        f => f.id !== floorId && f.name === newName
      );
      if (isDuplicate) {
        return {
          success: false,
          error: {
            type: 'DUPLICATE',
            field: 'name',
            message: '同じ名前の階が既に存在します',
          },
        };
      }

      // 更新
      dispatch({
        type: 'UPDATE_FLOOR',
        payload: { floorId, updates: { name: newName } },
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

      return { success: true, value: { ...updatedFloor, name: newName } };
    },
    [state.building.floors, dispatch]
  );

  return {
    addFloor,
    updateFloor,
    deleteFloor,
    setFloorCounts,
    copyFloorData,
    updateFloorName,
  };
}
