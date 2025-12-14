/**
 * UsageGroupActions - 用途グループ管理アクション
 */

import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { type UsageGroup, type ValidationError, type Result, generateUUID } from '../types';
import { ValidationService } from '../services/ValidationService';

const validationService = new ValidationService();

/**
 * useUsageGroupActions - 用途グループ管理アクションを提供するカスタムフック
 */
export function useUsageGroupActions() {
  const { state, dispatch } = useAppState();

  /**
   * addUsageGroup - 新しい用途グループを追加（特定の階に、建物全体の用途から選択）
   */
  const addUsageGroup = useCallback(
    async (
      floorId: string,
      usageIds: string[],
      commonArea: number
    ): Promise<Result<UsageGroup, ValidationError>> => {
      // 建物全体の全用途を取得
      const allUsages = state.building.floors.flatMap((floor) => floor.usages);

      // バリデーション（建物全体の用途に対して）
      const validation = validationService.validateUsageGroup(allUsages, {
        usageIds,
        commonArea,
      });
      if (!validation.success) {
        return validation;
      }

      // 新しい用途グループを作成
      const newUsageGroup: UsageGroup = {
        id: generateUUID(),
        floorId,
        usageIds,
        commonArea,
      };

      // 状態を更新
      dispatch({
        type: 'ADD_USAGE_GROUP',
        payload: { floorId, usageGroup: newUsageGroup },
      });

      return { success: true, value: newUsageGroup };
    },
    [dispatch, state.building]
  );

  /**
   * updateUsageGroup - 用途グループ情報を更新
   */
  const updateUsageGroup = useCallback(
    async (
      floorId: string,
      groupId: string,
      updates: Partial<UsageGroup>
    ): Promise<Result<UsageGroup, ValidationError>> => {
      // 建物全体の全用途を取得
      const allUsages = state.building.floors.flatMap((floor) => floor.usages);

      // 共用部面積のバリデーション（更新される場合のみ）
      if (updates.commonArea !== undefined) {
        const areaValidation = validationService.validateArea(
          updates.commonArea,
          'commonArea'
        );
        if (!areaValidation.success) {
          return areaValidation;
        }
      }

      // 用途IDsのバリデーション（更新される場合のみ）
      if (updates.usageIds !== undefined) {
        const groupValidation = validationService.validateUsageGroup(allUsages, {
          usageIds: updates.usageIds,
          commonArea: updates.commonArea ?? 0,
        });
        if (!groupValidation.success) {
          return groupValidation;
        }
      }

      // 状態を更新
      dispatch({
        type: 'UPDATE_USAGE_GROUP',
        payload: { floorId, groupId, updates },
      });

      // 更新後の用途グループを取得
      const floor = state.building.floors.find((f) => f.id === floorId);
      const updatedGroup = floor?.usageGroups.find((g) => g.id === groupId);
      if (!updatedGroup) {
        return {
          success: false,
          error: {
            type: 'REQUIRED_FIELD',
            field: 'groupId',
            message: '用途グループが見つかりません',
          },
        };
      }

      return { success: true, value: { ...updatedGroup, ...updates } };
    },
    [dispatch, state.building]
  );

  /**
   * deleteUsageGroup - 用途グループを削除
   */
  const deleteUsageGroup = useCallback(
    async (floorId: string, groupId: string): Promise<Result<void, ValidationError>> => {
      // 状態を更新
      dispatch({
        type: 'DELETE_USAGE_GROUP',
        payload: { floorId, groupId },
      });

      return { success: true, value: undefined };
    },
    [dispatch]
  );

  return {
    addUsageGroup,
    updateUsageGroup,
    deleteUsageGroup,
  };
}
