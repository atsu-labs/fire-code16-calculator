/**
 * 計算実行とクリア機能のテスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppStateContext';
import { useUsageActions } from './UsageActions';
import { useFloorActions } from './FloorActions';
import { useCalculationActions } from './CalculationActions';

describe('CalculationActions', () => {
  describe('executeCalculation', () => {
    it('面積計算を実行し結果を保存する', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          calcActions: useCalculationActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 階名を設定
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId, updates: { name: '1階' } },
        });
      });

      // 用途を追加
      await act(async () => {
        await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex02_i',
          annexedName: '２項イ',
          exclusiveArea: 200,
        });
      });

      // 階の共用部面積を設定
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId, updates: { floorCommonArea: 30 } },
        });
      });

      // 計算実行
      await act(async () => {
        const response = await result.current.calcActions.executeCalculation();
        expect(response.success).toBe(true);
      });

      // 計算結果が保存されていることを確認
      expect(result.current.state.state.calculationResults).not.toBeNull();
      expect(result.current.state.state.calculationResults?.floorResults).toHaveLength(1);
    });

    it('複数階で各階の建物全体の共用部を正しく集計して案分する', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          floorActions: useFloorActions(),
          calcActions: useCalculationActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floor1Id = result.current.state.state.building.floors[0].id;

      // 1階に用途を追加
      await act(async () => {
        await result.current.usageActions.addUsage(floor1Id, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId: floor1Id, updates: { name: '1階', buildingCommonArea: 30 } },
        });
      });

      // 2階を追加
      let floor2Id: string = '';
      await act(async () => {
        const floor2Result = await result.current.floorActions.addFloor('2階');
        if (floor2Result.success) {
          floor2Id = floor2Result.value.id;
        }
      });

      // 2階に用途を追加
      await act(async () => {
        await result.current.usageActions.addUsage(floor2Id, {
          annexedCode: 'annex02_i',
          annexedName: '２項イ',
          exclusiveArea: 200,
        });
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId: floor2Id, updates: { buildingCommonArea: 70 } },
        });
      });

      // 計算実行
      await act(async () => {
        const response = await result.current.calcActions.executeCalculation();
        if (!response.success) {
          console.error('Calculation failed:', response.error);
        }
        expect(response.success).toBe(true);
      });

      // 計算結果を確認
      const results = result.current.state.state.calculationResults;
      expect(results).not.toBeNull();
      expect(results?.floorResults).toHaveLength(2);

      // 建物全体の共用部は30 + 70 = 100が、専用部分面積比（100:200 = 1:2）で案分される
      // 1階の１項イ: 100 / 300 * 100 = 33.33
      // 2階の２項イ: 200 / 300 * 100 = 66.67
      const floor1Result = results?.floorResults[0];
      const floor2Result = results?.floorResults[1];

      expect(floor1Result?.usageBreakdowns[0].buildingCommonArea).toBeCloseTo(33.33, 2);
      expect(floor2Result?.usageBreakdowns[0].buildingCommonArea).toBeCloseTo(66.67, 2);
    });

    it('1階のみに建物全体共用部がある場合も正しく案分する', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          floorActions: useFloorActions(),
          calcActions: useCalculationActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floor1Id = result.current.state.state.building.floors[0].id;

      // 1階に用途を追加し、建物全体共用部を設定
      await act(async () => {
        await result.current.usageActions.addUsage(floor1Id, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId: floor1Id, updates: { name: '1階', buildingCommonArea: 100 } },
        });
      });

      // 2階を追加（建物全体共用部は0）
      let floor2Id: string = '';
      await act(async () => {
        const floor2Result = await result.current.floorActions.addFloor('2階');
        if (floor2Result.success) {
          floor2Id = floor2Result.value.id;
        }
      });

      // 2階に用途を追加（建物全体共用部は入力しない = 0）
      await act(async () => {
        await result.current.usageActions.addUsage(floor2Id, {
          annexedCode: 'annex02_i',
          annexedName: '２項イ',
          exclusiveArea: 200,
        });
        // buildingCommonAreaは明示的に設定しない（デフォルト0）
      });

      // 計算実行
      await act(async () => {
        const response = await result.current.calcActions.executeCalculation();
        if (!response.success) {
          console.error('Calculation failed:', response.error);
        }
        expect(response.success).toBe(true);
      });

      // 計算結果を確認
      const results = result.current.state.state.calculationResults;
      expect(results).not.toBeNull();
      expect(results?.floorResults).toHaveLength(2);

      // 建物全体の共用部は100（1階のみ）が、専用部分面積比（100:200 = 1:2）で案分される
      // 1階の１項イ: 100 / 300 * 100 = 33.33
      // 2階の２項イ: 200 / 300 * 100 = 66.67
      const floor1Result = results?.floorResults[0];
      const floor2Result = results?.floorResults[1];

      expect(floor1Result?.usageBreakdowns[0].buildingCommonArea).toBeCloseTo(33.33, 2);
      expect(floor2Result?.usageBreakdowns[0].buildingCommonArea).toBeCloseTo(66.67, 2);
    });

    it('専用部分面積の合計が0の場合はエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          calcActions: useCalculationActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 階の共用部面積のみ設定（用途なし）
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId, updates: { floorCommonArea: 30 } },
        });
      });

      // 計算実行
      await act(async () => {
        const response = await result.current.calcActions.executeCalculation();
        expect(response.success).toBe(false);
      });
    });
  });

  describe('clearAll', () => {
    it('全データをクリアし初期状態に戻す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          calcActions: useCalculationActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // データを追加
      await act(async () => {
        await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { 
            floorId, 
            updates: { buildingCommonArea: 50 } 
          },
        });
      });

      // クリア実行
      await act(async () => {
        result.current.calcActions.clearAll();
      });

      // 初期状態に戻っていることを確認
      expect(result.current.state.state.building.floors).toHaveLength(1);
      expect(result.current.state.state.building.floors[0].usages).toHaveLength(0);
      expect(result.current.state.state.building.floors[0].buildingCommonArea).toBe(0);
      expect(result.current.state.state.calculationResults).toBeNull();
    });
  });
});
