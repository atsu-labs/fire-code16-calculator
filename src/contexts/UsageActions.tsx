/**
 * UsageActions - 用途管理アクション
 */

import { useCallback } from 'react';
import { useAppState } from './AppStateContext';
import { type Usage, type ValidationError, type Result, generateUUID } from '../types';
import { ValidationService } from '../services/ValidationService';

const validationService = new ValidationService();

/**
 * useUsageActions - 用途管理アクションを提供するカスタムフック
 */
export function useUsageActions() {
  const { state, dispatch } = useAppState();

  /**
   * addUsage - 新しい用途を追加
   */
  const addUsage = useCallback(
    async (
      floorId: string,
      usageData: Omit<Usage, 'id'>
    ): Promise<Result<Usage, ValidationError>> => {
      // バリデーション
      const validation = validationService.validateUsage(usageData);
      if (!validation.success) {
        return validation;
      }

      // 新しい用途を作成
      const newUsage: Usage = {
        id: generateUUID(),
        ...usageData,
      };

      // 状態を更新
      dispatch({
        type: 'ADD_USAGE',
        payload: { floorId, usage: newUsage },
      });

      return { success: true, value: newUsage };
    },
    [dispatch]
  );

  /**
   * updateUsage - 用途情報を更新
   */
  const updateUsage = useCallback(
    async (
      floorId: string,
      usageId: string,
      updates: Partial<Usage>
    ): Promise<Result<Usage, ValidationError>> => {
      // 専用部分面積のバリデーション（更新される場合のみ）
      if (updates.exclusiveArea !== undefined) {
        const areaValidation = validationService.validateArea(
          updates.exclusiveArea,
          'exclusiveArea'
        );
        if (!areaValidation.success) {
          return areaValidation;
        }
      }

      // 用途コードのバリデーション（更新される場合のみ）
      if (updates.annexedCode !== undefined) {
        const codeValidation = validationService.validateUsageCode(updates.annexedCode);
        if (!codeValidation.success) {
          return codeValidation;
        }
      }

      // 状態を更新
      dispatch({
        type: 'UPDATE_USAGE',
        payload: { floorId, usageId, updates },
      });

      // 更新後の用途を取得
      const floor = state.building.floors.find((f) => f.id === floorId);
      const updatedUsage = floor?.usages.find((u) => u.id === usageId);

      if (!updatedUsage) {
        return {
          success: false,
          error: {
            type: 'REQUIRED_FIELD',
            field: 'usageId',
            message: '用途が見つかりません',
          },
        };
      }

      return { success: true, value: { ...updatedUsage, ...updates } };
    },
    [dispatch, state.building.floors]
  );

  /**
   * deleteUsage - 用途を削除
   */
  const deleteUsage = useCallback(
    async (floorId: string, usageId: string): Promise<Result<void, ValidationError>> => {
      // 状態を更新（カスケード削除は reducer で自動的に行われる）
      dispatch({
        type: 'DELETE_USAGE',
        payload: { floorId, usageId },
      });

      return { success: true, value: undefined };
    },
    [dispatch]
  );

  return {
    addUsage,
    updateUsage,
    deleteUsage,
  };
}
