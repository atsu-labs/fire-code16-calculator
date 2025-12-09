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

      // 全専有面積の合計を計算（個別の用途ごと）
      const totalExclusiveArea = allBuildingUsages.reduce(
        (sum, usage) => sum + usage.exclusiveArea,
        0
      );

      // 建物共用部の案分を計算（階ごとに按分し、用途ごと×階ごとに記録）
      // buildingCommonByUsageByFloor[usageId][sourceFloorId] = 按分面積
      const buildingCommonByUsageByFloor = new Map<string, Map<string, number>>();
      
      for (const floor of building.floors) {
        if (floor.buildingCommonArea > 0 && totalExclusiveArea > 0) {
          // この階の建物共用部を、全建物の全用途に専有面積比で按分
          allBuildingUsages.forEach((usage) => {
            const ratio = usage.exclusiveArea / totalExclusiveArea;
            const distributed = ratio * floor.buildingCommonArea;
            
            // 用途ごとの階別按分マップを取得または作成
            if (!buildingCommonByUsageByFloor.has(usage.id)) {
              buildingCommonByUsageByFloor.set(usage.id, new Map<string, number>());
            }
            const byFloor = buildingCommonByUsageByFloor.get(usage.id)!;
            byFloor.set(floor.id, distributed);
          });
        }
      }
      
      // 用途ごとの建物共用部按分の合計を計算
      const buildingCommonResults = new Map<string, number>();
      buildingCommonByUsageByFloor.forEach((byFloor, usageId) => {
        const total = Array.from(byFloor.values()).reduce((sum, val) => sum + val, 0);
        buildingCommonResults.set(usageId, total);
      });

      // 全階の全グループ共用部の案分計算（グループ内の用途の建物全体の専有面積比で按分）
      // usageGroupByUsageByGroup[usageId][groupId] = 按分面積
      const usageGroupByUsageByGroup = new Map<string, Map<string, number>>();
      
      for (const floor of building.floors) {
        for (const group of floor.usageGroups) {
          if (group.commonArea === 0) {
            continue;
          }

          // グループ内の用途IDセット
          const groupUsageIds = new Set(group.usageIds);
          
          // グループ内の用途IDが有効か確認
          for (const usageId of groupUsageIds) {
            if (!allBuildingUsages.some(u => u.id === usageId)) {
              dispatch({ type: 'SET_CALCULATING', payload: false });
              return {
                success: false,
                error: {
                  type: 'INVALID_USAGE_GROUP',
                  groupId: group.id,
                },
              };
            }
          }

          // グループ内の用途の建物全体の専有面積合計を計算
          const totalGroupExclusive = allBuildingUsages
            .filter(u => groupUsageIds.has(u.id))
            .reduce((sum, usage) => sum + usage.exclusiveArea, 0);

          if (totalGroupExclusive === 0) {
            dispatch({ type: 'SET_CALCULATING', payload: false });
            return {
              success: false,
              error: {
                type: 'ZERO_EXCLUSIVE_AREA_SUM',
                groupId: group.id,
              },
            };
          }

          // グループ内の各用途に、建物全体の専有面積比で按分
          allBuildingUsages.forEach((usage) => {
            if (!groupUsageIds.has(usage.id)) {
              return; // このグループに含まれない用途はスキップ
            }
            
            const ratio = usage.exclusiveArea / totalGroupExclusive;
            const distributed = ratio * group.commonArea;
            
            // 用途ごとのグループ別按分マップを取得または作成
            if (!usageGroupByUsageByGroup.has(usage.id)) {
              usageGroupByUsageByGroup.set(usage.id, new Map<string, number>());
            }
            const byGroup = usageGroupByUsageByGroup.get(usage.id)!;
            byGroup.set(group.id, distributed);
          });
        }
      }
      
      // 用途ごとのグループ共用部按分の合計を計算
      const usageGroupResults = new Map<string, number>();
      usageGroupByUsageByGroup.forEach((byGroup, usageId) => {
        const total = Array.from(byGroup.values()).reduce((sum, val) => sum + val, 0);
        usageGroupResults.set(usageId, total);
      });

      // 各階の計算を実行
      const floorResultsMap = new Map<string, any[]>();
      
      for (const floor of building.floors) {
        // 階に用途がないが階共用部面積がある場合はエラー
        // （建物全体共用部面積のみの場合は許可）
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

        // 階に用途が1つしかない場合で階共用部面積がある場合はエラー
        // （按分する必要がないため）
        if (floor.usages.length === 1 && floor.floorCommonArea > 0) {
          dispatch({ type: 'SET_CALCULATING', payload: false });
          return {
            success: false,
            error: {
              type: 'INVALID_FLOOR_COMMON_AREA',
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
          buildingCommonResults,
          buildingCommonByUsageByFloor,
          usageGroupResults,
          usageGroupByUsageByGroup
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
      const floorResults = building.floors.map((floor) => {
        const usageBreakdowns = floorResultsMap.get(floor.id) || [];
        
        // 案分前のデータを計算
        const floorTotalExclusiveArea = floor.usages.reduce(
          (sum, usage) => sum + usage.exclusiveArea,
          0
        );
        const usageGroupCommonArea = floor.usageGroups.reduce(
          (sum, group) => sum + group.commonArea,
          0
        );
        
        // この階に入力された建物共用部の按分結果を収集
        const buildingCommonDistribution: {
          usageId: string;
          annexedCode: string;
          annexedName: string;
          floorName: string;
          distributedArea: number;
        }[] = [];

        if (floor.buildingCommonArea > 0 && totalExclusiveArea > 0) {
          // この階の建物共用部を全用途に按分した結果を収集
          allBuildingUsages.forEach((usage) => {
            const ratio = usage.exclusiveArea / totalExclusiveArea;
            const distributed = ratio * floor.buildingCommonArea;
            
            if (distributed > 0) {
              // その用途が存在する階を特定
              const usageFloor = building.floors.find((f) =>
                f.usages.some((u) => u.id === usage.id)
              );
              buildingCommonDistribution.push({
                usageId: usage.id,
                annexedCode: usage.annexedCode,
                annexedName: usage.annexedName,
                floorName: usageFloor?.name || '',
                distributedArea: distributed,
              });
            }
          });
        }
        
        return {
          floorId: floor.id,
          floorName: floor.name,
          usageBreakdowns,
          originalData: {
            totalExclusiveArea: floorTotalExclusiveArea,
            floorCommonArea: floor.floorCommonArea,
            buildingCommonArea: floor.buildingCommonArea,
            usageGroupCommonArea,
          },
          buildingCommonDistribution,
        };
      });

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
