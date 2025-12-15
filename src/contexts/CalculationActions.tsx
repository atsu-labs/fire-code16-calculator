/**
 * CalculationActions - 計算実行とクリア機能
 * 
 * ## 共用部按分の基本仕様
 * 
 * ### 1. 階共用部
 * - その階の用途のみに按分
 * - 用途の専有面積比で按分
 * 
 * ### 2. 建物共用部（重要）
 * - **全建物の全用途コードに按分**（用途コードの専有面積合計比で按分）
 * - **按分された面積は、建物共用部が存在する階にのみ加算**
 * - 例：2階に建物共用部100㎡がある場合
 *   - 全建物の用途コード（四項、五項ロ）の専有面積比で按分
 *   - 按分された面積は**2階にのみ**加算される
 *   - その用途コードが2階に存在しない場合は、仮想用途として2階に作成して加算
 * 
 * ### 3. グループ共用部（重要）
 * - **グループ内の用途コードに按分**（用途コードの専有面積合計比で按分）
 * - **按分された面積は、グループが存在する階にのみ加算**
 * - 例：1階にグループ共用部100㎡がある場合
 *   - グループ内の用途コード（二項ロ、四項）の専有面積比で按分
 *   - 按分された面積は**1階にのみ**加算される
 *   - その用途コードが1階に存在しない場合は、仮想用途として1階に作成して加算
 * 
 * ### 仮想用途の作成
 * 共用部按分により、その階に実際には存在しない用途コードに按分が発生した場合：
 * - 専有面積0の仮想用途エントリを作成
 * - 按分された共用部面積のみを持つ
 * - 結果表示では実際の用途と同様に表示される
 */

import { useCallback } from 'react';
import { useAppState } from './useAppState';
import {
  type CalculationError,
  type Result,
  type UsageAreaBreakdown,
  type DistributionTrace,
  type DistributionDetail,
} from '../types';
import { CalculationEngine } from '../services/CalculationEngine';

const calculationEngine = new CalculationEngine();

/**
 * useCalculationActions - 計算実行アクションを提供するカスタムフック
 */
export function useCalculationActions() {
  const { state, dispatch } = useAppState();

  /**
   * executeCalculation - 面積計算を実行
   * 
   * 計算の流れ：
   * 1. 全建物の用途コード別専有面積合計を計算
   * 2. 建物共用部を用途コード別に按分（階ごとに記録）
   * 3. グループ共用部を用途コード別に按分（階ごとに記録）
   * 4. 各階ごとに：
   *    a. 階共用部を按分
   *    b. その階に存在する用途コード（実用途+仮想用途）を収集
   *    c. 各用途コードの内訳を計算（専有+階共用+建物共用+グループ共用）
   */
  const executeCalculation = useCallback(async (): Promise<
    Result<void, CalculationError>
  > => {
    // 計算中フラグを設定
    dispatch({ type: 'SET_CALCULATING', payload: true });

    try {
      const building = state.building;
      const allFloorResults: UsageAreaBreakdown[][] = [];

      // 建物全体の全用途を取得
      const allBuildingUsages = building.floors.flatMap((f) => f.usages);

      // 用途コードごとの専有面積合計を計算
      const usageCodeTotals = new Map<string, number>();
      allBuildingUsages.forEach((usage) => {
        const current = usageCodeTotals.get(usage.annexedCode) || 0;
        usageCodeTotals.set(usage.annexedCode, current + usage.exclusiveArea);
      });

      // 全専有面積の合計を計算
      const totalExclusiveArea = Array.from(usageCodeTotals.values()).reduce(
        (sum, area) => sum + area,
        0
      );

      // 按分経過の追跡情報
  const buildingCommonTraces: DistributionTrace['buildingCommonTraces'] = [];
  const usageGroupTraces: DistributionTrace['usageGroupTraces'] = [];

      // ===================================================================
      // 建物共用部の按分計算（重要な仕様）
      // ===================================================================
      // 仕様：
      // - 各階の建物共用部を、全建物の全用途コードに按分
      // - 按分比率：各用途コードの専有面積合計 / 全建物の専有面積合計
      // - 按分結果は「その階」にのみ加算される（他の階には加算されない）
      // - 結果は buildingCommonByFloorAndCode[floorId][annexedCode] に格納
      // 
      // 例：2階に建物共用部100㎡がある場合
      //   全建物の専有面積：四項100㎡ + 五項ロ300㎡ = 400㎡
      //   四項への按分：100/400 * 100 = 25㎡ → 2階に加算
      //   五項ロへの按分：300/400 * 100 = 75㎡ → 2階に加算
      //   ※四項が2階に存在しない場合でも、2階に仮想用途として作成される
      // ===================================================================
      const buildingCommonByFloorAndCode = new Map<string, Map<string, number>>();
      
      // 用途コード→用途名のマップを作成
      const usageCodeToName = new Map<string, string>();
      allBuildingUsages.forEach(u => usageCodeToName.set(u.annexedCode, u.annexedName));
      
      for (const floor of building.floors) {
        if (floor.buildingCommonArea > 0) {
          const traceDistributions: DistributionTrace['buildingCommonTraces'][number]['distributions'] = [];
          const floorDistributions = new Map<string, number>();
          
          if (totalExclusiveArea > 0) {
            // この階の建物共用部を、全建物の全用途コードに按分
            usageCodeTotals.forEach((usageCodeTotal, annexedCode) => {
              const ratio = usageCodeTotal / totalExclusiveArea;
              const distributed = ratio * floor.buildingCommonArea;
              
              // この階の用途コード別按分を記録（この階にのみ加算される）
              floorDistributions.set(annexedCode, distributed);
              
              // 経過表用のデータを収集
              traceDistributions.push({
                usageId: '', // 用途コード単位なのでusageIdは不要
                annexedCode: annexedCode,
                annexedName: usageCodeToName.get(annexedCode) || '',
                floorId: floor.id,
                floorName: floor.name,
                distributedArea: distributed,
                ratio: ratio,
              });
            });
          } else if (usageCodeTotals.size > 0) {
            // 専有部分がない場合は等分配
            const equalRatio = 1 / usageCodeTotals.size;
            usageCodeTotals.forEach((_, annexedCode) => {
              const distributed = equalRatio * floor.buildingCommonArea;
              
              // この階の用途コード別按分を記録（この階にのみ加算される）
              floorDistributions.set(annexedCode, distributed);
              
              // 経過表用のデータを収集
              traceDistributions.push({
                usageId: '', // 用途コード単位なのでusageIdは不要
                annexedCode: annexedCode,
                annexedName: usageCodeToName.get(annexedCode) || '',
                floorId: floor.id,
                floorName: floor.name,
                distributedArea: distributed,
                ratio: equalRatio,
              });
            });
          }
          
          buildingCommonByFloorAndCode.set(floor.id, floorDistributions);
          
          buildingCommonTraces.push({
            sourceFloorId: floor.id,
            sourceFloorName: floor.name,
            totalArea: floor.buildingCommonArea,
            distributions: traceDistributions,
          });
        }
      }

      // ===================================================================
      // グループ共用部の按分計算（重要な仕様）
      // ===================================================================
      // 仕様：
      // - 各グループの共用部を、グループ内の用途コードに按分
      // - 按分比率：各用途コードの専有面積合計 / グループ内の専有面積合計
      // - 按分結果は「そのグループが存在する階」にのみ加算される
      // - 結果は usageGroupByFloorAndCode[floorId][annexedCode] に格納
      // 
      // 例：1階にグループ共用部100㎡がある場合（グループ：二項ロ、四項）
      //   グループ内の専有面積：二項ロ200㎡ + 四項100㎡ = 300㎡
      //   二項ロへの按分：200/300 * 100 = 66.67㎡ → 1階に加算
      //   四項への按分：100/300 * 100 = 33.33㎡ → 1階に加算
      //   ※四項が1階に存在しない場合でも、1階に仮想用途として作成される
      //   ※二項ロが2階に存在しても、1階のグループなので2階には加算されない
      // ===================================================================
      const usageGroupByFloorAndCode = new Map<
        string,
        Map<string, { total: number; details: DistributionDetail[] }>
      >();
      
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

          // グループ内の用途コードごとの専有面積合計を計算
          const groupUsageCodeTotals = new Map<string, number>();
          allBuildingUsages
            .filter(u => groupUsageIds.has(u.id))
            .forEach((usage) => {
              const current = groupUsageCodeTotals.get(usage.annexedCode) || 0;
              groupUsageCodeTotals.set(usage.annexedCode, current + usage.exclusiveArea);
            });

          const totalGroupExclusive = Array.from(groupUsageCodeTotals.values()).reduce(
            (sum, area) => sum + area,
            0
          );

          const traceDistributions: DistributionTrace['usageGroupTraces'][number]['distributions'] = [];
          
          // グループ内の用途コードに按分し、この階に記録
          if (!usageGroupByFloorAndCode.has(floor.id)) {
            usageGroupByFloorAndCode.set(floor.id, new Map());
          }
          const floorGroupDistributions = usageGroupByFloorAndCode.get(floor.id)!;
          
          // 専有部分がない場合は等分配
          if (totalGroupExclusive === 0) {
            const equalRatio = 1 / groupUsageCodeTotals.size;
            groupUsageCodeTotals.forEach((_, annexedCode) => {
              const distributed = equalRatio * group.commonArea;
              
              // この階の用途コード別按分を記録（複数グループある場合は加算）
              const current = floorGroupDistributions.get(annexedCode) || { 
                total: 0, 
                details: [] 
              };
              current.total += distributed;
              current.details.push({
                sourceId: group.id,
                sourceName: `${floor.name} グループ`,
                sourceType: 'group' as const,
                distributedArea: distributed,
                ratio: equalRatio,
              });
              floorGroupDistributions.set(annexedCode, current);
              
              // 経過表用のデータを収集
              traceDistributions.push({
                usageId: '', // 用途コード単位なのでusageIdは不要
                annexedCode: annexedCode,
                annexedName: usageCodeToName.get(annexedCode) || '',
                ratio: equalRatio,
                distributedArea: distributed,
              });
            });
          } else {
            // 専有部分面積比で按分
            groupUsageCodeTotals.forEach((usageCodeTotal, annexedCode) => {
              const ratio = usageCodeTotal / totalGroupExclusive;
              const distributed = ratio * group.commonArea;
              
              // この階の用途コード別按分を記録（複数グループある場合は加算）
              const current = floorGroupDistributions.get(annexedCode) || { 
                total: 0, 
                details: [] 
              };
              current.total += distributed;
              current.details.push({
                sourceId: group.id,
                sourceName: `${floor.name} グループ`,
                sourceType: 'group' as const,
                distributedArea: distributed,
                ratio: ratio,
              });
              floorGroupDistributions.set(annexedCode, current);
              
              // 経過表用のデータを収集
              traceDistributions.push({
                usageId: '', // 用途コード単位なのでusageIdは不要
                annexedCode: annexedCode,
                annexedName: usageCodeToName.get(annexedCode) || '',
                distributedArea: distributed,
                ratio: ratio,
              });
            });
          }
          
          usageGroupTraces.push({
            groupId: group.id,
            groupFloorId: floor.id,
            groupFloorName: floor.name,
            totalArea: group.commonArea,
            usageIds: Array.from(groupUsageIds),
            distributions: traceDistributions,
          });
        }
      }

      // ===================================================================
      // 各階の計算を実行
      // ===================================================================
      // 処理の流れ：
      // 1. 階共用部を按分（その階の用途のみ）
      // 2. この階に存在すべき全用途コードを収集：
      //    - 実際にこの階に存在する用途コード
      //    - この階の建物共用部から按分を受ける用途コード（仮想用途）
      //    - この階のグループ共用部から按分を受ける用途コード（仮想用途）
      // 3. 各用途コードについて内訳を計算
      // ===================================================================
  const floorResultsMap = new Map<string, UsageAreaBreakdown[]>();
      
      for (const floor of building.floors) {
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
          // 用途がなくても建物共用部やグループ共用部があれば内訳を作成
          const allUsageCodesInFloor = new Set<string>();
          
          // この階の建物共用部から按分を受ける用途コード
          const thisFloorDistributions = buildingCommonByFloorAndCode.get(floor.id);
          if (thisFloorDistributions) {
            thisFloorDistributions.forEach((_, code) => {
              allUsageCodesInFloor.add(code);
            });
          }
          
          // この階のグループ共用部から按分を受ける用途コード
          const thisFloorGroupDistributions = usageGroupByFloorAndCode.get(floor.id);
          if (thisFloorGroupDistributions) {
            thisFloorGroupDistributions.forEach((_, code) => {
              allUsageCodesInFloor.add(code);
            });
          }
          
          if (allUsageCodesInFloor.size > 0) {
            // 仮想用途の内訳を作成
            const breakdowns: UsageAreaBreakdown[] = [];
            allUsageCodesInFloor.forEach(annexedCode => {
              // 建物共用部按分
              let buildingCommon = 0;
              const buildingCommonDetails: DistributionDetail[] = [];
              if (thisFloorDistributions && thisFloorDistributions.has(annexedCode)) {
                const dist = thisFloorDistributions.get(annexedCode) || 0;
                buildingCommon = dist;
                buildingCommonDetails.push({
                  sourceId: floor.id,
                  sourceName: floor.name,
                  sourceType: 'building' as const,
                  distributedArea: dist,
                  ratio: dist / (floor.buildingCommonArea || 1),
                });
              }
              
              // グループ共用部按分
              let usageGroupCommon = 0;
              const usageGroupDetailsForUsage: DistributionDetail[] = [];
              if (thisFloorGroupDistributions && thisFloorGroupDistributions.has(annexedCode)) {
                const groupData = thisFloorGroupDistributions.get(annexedCode)!;
                usageGroupCommon = groupData.total;
                usageGroupDetailsForUsage.push(...groupData.details);
              }
              
              const total = Math.round((buildingCommon + usageGroupCommon) * 100) / 100;

              const breakdown: UsageAreaBreakdown = {
                usageId: `virtual-${floor.id}-${annexedCode}`,
                annexedCode: annexedCode,
                annexedName: usageCodeToName.get(annexedCode) || '',
                exclusiveArea: 0,
                floorCommonArea: 0,
                buildingCommonArea: Math.round(buildingCommon * 100) / 100,
                buildingCommonDetails: buildingCommonDetails,
                usageGroupCommonArea: Math.round(usageGroupCommon * 100) / 100,
                usageGroupDetails: usageGroupDetailsForUsage,
                totalArea: total,
              };

              breakdowns.push(breakdown);
            });
            
            floorResultsMap.set(floor.id, breakdowns);
            allFloorResults.push(breakdowns);
          } else {
            floorResultsMap.set(floor.id, []); // 空の結果を設定
          }
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

        // -------------------------------------------------------------------
        // この階に存在すべき全用途コードを収集（実用途 + 仮想用途）
        // -------------------------------------------------------------------
        const allUsageCodesInFloor = new Set<string>();
        
        // 1. 実際にこの階に存在する用途コード
        floor.usages.forEach(u => allUsageCodesInFloor.add(u.annexedCode));
        
        // 2. この階の建物共用部から按分を受ける用途コード（仮想用途として追加）
        //    重要：建物共用部は「その階」にのみ加算されるため、この階の分のみ取得
        const thisFloorDistributions = buildingCommonByFloorAndCode.get(floor.id);
        if (thisFloorDistributions) {
          thisFloorDistributions.forEach((_, code) => {
            allUsageCodesInFloor.add(code);
          });
        }
        
        // 3. この階のグループ共用部から按分を受ける用途コード（仮想用途として追加）
        //    重要：グループ共用部は「そのグループがある階」にのみ加算されるため、この階の分のみ取得
        const thisFloorGroupDistributions = usageGroupByFloorAndCode.get(floor.id);
        if (thisFloorGroupDistributions) {
          thisFloorGroupDistributions.forEach((_, code) => {
            allUsageCodesInFloor.add(code);
          });
        }
        
        // -------------------------------------------------------------------
        // 各用途コードについて面積内訳を計算
        // -------------------------------------------------------------------
  const breakdowns: UsageAreaBreakdown[] = [];
        allUsageCodesInFloor.forEach(annexedCode => {
          // この階の実際の用途を取得（存在しない場合は仮想用途）
          const existingUsage = floor.usages.find(u => u.annexedCode === annexedCode);
          const exclusiveArea = existingUsage ? existingUsage.exclusiveArea : 0;
          const usageId = existingUsage ? existingUsage.id : `virtual-${floor.id}-${annexedCode}`;
          
          // 階共用部按分（実際の用途のみ）
          const floorCommon = existingUsage ? (floorCommonResults.value.get(existingUsage.id) ?? 0) : 0;
          
          // 建物共用部按分（この階の建物共用部のみ）
          let buildingCommon = 0;
          const buildingCommonDetails: DistributionDetail[] = [];
          if (thisFloorDistributions && thisFloorDistributions.has(annexedCode)) {
            const dist = thisFloorDistributions.get(annexedCode) || 0;
            buildingCommon = dist;
            buildingCommonDetails.push({
              sourceId: floor.id,
              sourceName: floor.name,
              sourceType: 'building' as const,
              distributedArea: dist,
              ratio: dist / (floor.buildingCommonArea || 1),
            });
          }
          
          // グループ共用部按分（この階のグループ共用部のみ）
          let usageGroupCommon = 0;
          const usageGroupDetailsForUsage: DistributionDetail[] = [];
          const thisFloorGroupDistributions = usageGroupByFloorAndCode.get(floor.id);
          if (thisFloorGroupDistributions && thisFloorGroupDistributions.has(annexedCode)) {
              const groupData = thisFloorGroupDistributions.get(annexedCode)!;
              usageGroupCommon = groupData.total;
              usageGroupDetailsForUsage.push(...groupData.details);
          }
          
          const total = Math.round(
            (exclusiveArea + floorCommon + buildingCommon + usageGroupCommon) * 100
          ) / 100;

          const breakdown: UsageAreaBreakdown = {
            usageId: usageId,
            annexedCode: annexedCode,
            annexedName: usageCodeToName.get(annexedCode) || '',
            exclusiveArea: Math.round(exclusiveArea * 100) / 100,
            floorCommonArea: Math.round(floorCommon * 100) / 100,
            buildingCommonArea: Math.round(buildingCommon * 100) / 100,
            buildingCommonDetails: buildingCommonDetails,
            usageGroupCommonArea: Math.round(usageGroupCommon * 100) / 100,
            usageGroupDetails: usageGroupDetailsForUsage,
            totalArea: total,
          };

          breakdowns.push(breakdown);
        });

        floorResultsMap.set(floor.id, breakdowns);
        allFloorResults.push(breakdowns);
      }

      // 建物全体の集計を実行
      const aggregationResult =
        calculationEngine.aggregateBuildingTotals(allFloorResults);

      if (!aggregationResult.success) {
        dispatch({ type: 'SET_CALCULATING', payload: false });
        return {
          success: false,
          error: {
            type: 'ZERO_EXCLUSIVE_AREA_SUM',
          },
        };
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
        };
      });

      // 計算結果を保存
      dispatch({
        type: 'SET_CALCULATION_RESULTS',
        payload: {
          floorResults,
          buildingTotal: aggregationResult.value,
          distributionTrace: {
            buildingCommonTraces,
            usageGroupTraces,
          },
        },
      });

      // 計算中フラグをクリア
      dispatch({ type: 'SET_CALCULATING', payload: false });

      return { success: true, value: undefined };
    } catch {
      // 予期しないエラー（エラーオブジェクトは未使用のため捕捉変数を省略）
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
