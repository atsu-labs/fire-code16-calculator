/**
 * CalculationActions - 計算実行とクリア機能
 */

import { useCallback } from 'react';
import { useAppState } from './AppStateContext';
import { type CalculationError, type Result } from '../types';
import { CalculationEngine } from '../services/CalculationEngine';

const calculationEngine = new CalculationEngine();

/**
 * useCalculationActions - 計算実行アクションを提供するカスタムフック
 */
export function useCalculationActions() {
  const { state, dispatch } = useAppState();

  /**
   * executeCalculation - 面積計算を実行
   */
  const executeCalculation = useCallback(async (): Promise<
    Result<void, CalculationError>
  > => {
    // 計算中フラグを設定
    dispatch({ type: 'SET_CALCULATING', payload: true });

    try {
      const building = state.building;
      const allFloorResults: any[] = [];

      // 建物全体の全用途を取得
      const allBuildingUsages = building.floors.flatMap((f) => f.usages);

      // 全階の建物全体の共用部面積の合計を算出
      const totalBuildingCommonArea = building.floors.reduce(
        (sum, floor) => sum + floor.buildingCommonArea,
        0
      );

      // 建物全体の共用部案分計算（1回だけ実行）
      const buildingCommonResults =
        totalBuildingCommonArea > 0
          ? calculationEngine.calculateBuildingCommonArea(
              allBuildingUsages,
              totalBuildingCommonArea
            )
          : { success: true as const, value: new Map<string, number>() };

      if (!buildingCommonResults.success) {
        dispatch({ type: 'SET_CALCULATING', payload: false });
        return buildingCommonResults;
      }

      // 全階の全グループ共用部の案分計算
      const usageGroupResults = new Map<string, number>();
      for (const floor of building.floors) {
        for (const group of floor.usageGroups) {
          const groupResult = calculationEngine.calculateUsageGroupCommonArea(
            allBuildingUsages,
            group
          );

          if (!groupResult.success) {
            dispatch({ type: 'SET_CALCULATING', payload: false });
            return groupResult;
          }

          // 結果をマージ（複数グループに属する用途は加算）
          groupResult.value.forEach((value, usageId) => {
            const current = usageGroupResults.get(usageId) ?? 0;
            usageGroupResults.set(usageId, current + value);
          });
        }
      }

      // 各階の計算を実行
      const floorResultsMap = new Map<string, any[]>();
      
      for (const floor of building.floors) {
        // 階に用途がないが共用部面積がある場合はエラー
        if (floor.usages.length === 0 && floor.floorCommonArea > 0) {
          dispatch({ type: 'SET_CALCULATING', payload: false });
          return {
            success: false,
            error: {
              type: 'ZERO_EXCLUSIVE_AREA_SUM',
              floorId: floor.id,
            },
          };
        }

        if (floor.usages.length === 0) {
          floorResultsMap.set(floor.id, []); // 空の結果を設定
          continue;
        }

        // 階の共用部案分計算
        const floorCommonResults =
          floor.floorCommonArea > 0
            ? calculationEngine.calculateFloorCommonArea(floor.usages, floor.floorCommonArea)
            : { success: true as const, value: new Map<string, number>() };

        if (!floorCommonResults.success) {
          dispatch({ type: 'SET_CALCULATING', payload: false });
          return floorCommonResults;
        }

        // この階の用途の総面積を計算
        const totalAreasResult = calculationEngine.calculateTotalAreas(
          floor.usages,
          floorCommonResults.value,
          buildingCommonResults.value,
          usageGroupResults
        );

        if (!totalAreasResult.success) {
          dispatch({ type: 'SET_CALCULATING', payload: false });
          return totalAreasResult as any;
        }

        floorResultsMap.set(floor.id, totalAreasResult.value);
        allFloorResults.push(totalAreasResult.value);
      }

      // 建物全体の集計を実行
      const aggregationResult =
        calculationEngine.aggregateBuildingTotals(allFloorResults);

      if (!aggregationResult.success) {
        dispatch({ type: 'SET_CALCULATING', payload: false });
        return aggregationResult as any;
      }

      // FloorResult形式に変換
      const floorResults = building.floors.map((floor) => ({
        floorId: floor.id,
        floorName: floor.name,
        usageBreakdowns: floorResultsMap.get(floor.id) || [],
      }));

      // 計算結果を保存
      dispatch({
        type: 'SET_CALCULATION_RESULTS',
        payload: {
          floorResults,
          buildingTotal: aggregationResult.value,
        },
      });

      // 計算中フラグをクリア
      dispatch({ type: 'SET_CALCULATING', payload: false });

      return { success: true, value: undefined };
    } catch (error) {
      // 予期しないエラー
      dispatch({ type: 'SET_CALCULATING', payload: false });
      return {
        success: false,
        error: {
          type: 'ZERO_EXCLUSIVE_AREA_SUM',
        },
      };
    }
  }, [state.building, dispatch]);

  /**
   * clearAll - 全データをクリア
   */
  const clearAll = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, [dispatch]);

  return {
    executeCalculation,
    clearAll,
  };
}
