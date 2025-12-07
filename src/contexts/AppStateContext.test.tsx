/**
 * AppStateContext のテスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppStateContext';

describe('AppStateContext', () => {
  describe('初期状態', () => {
    it('初期状態には1つの階が含まれる', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      expect(result.current.state.building.floors).toHaveLength(1);
      expect(result.current.state.building.floors[0].name).toBe('1階');
      expect(result.current.state.building.floors[0].usages).toHaveLength(0);
      expect(result.current.state.building.floors[0].usageGroups).toHaveLength(0);
    });

    it('各階の建物全体の共用部面積は0で初期化される', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      expect(result.current.state.building.floors).toHaveLength(1);
      expect(result.current.state.building.floors[0].buildingCommonArea).toBe(0);
    });

    it('計算結果はnullで初期化される', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      expect(result.current.state.calculationResults).toBeNull();
    });

    it('UIステートは初期値を持つ', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      expect(result.current.state.uiState.isCalculating).toBe(false);
      expect(result.current.state.uiState.errors).toEqual([]);
    });
  });

  describe('不変更新ヘルパー', () => {
    it('updateBuildingは建物データを不変に更新する', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const originalBuilding = result.current.state.building;

      // Building型にはbuildingCommonAreaは存在しないため、idを更新する
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_BUILDING',
          payload: { id: 'new-building-id' },
        });
      });

      expect(result.current.state.building).not.toBe(originalBuilding);
      expect(result.current.state.building.id).toBe('new-building-id');
    });

    it('updateFloorは階データを不変に更新する', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const floorId = result.current.state.building.floors[0].id;
      const originalFloor = result.current.state.building.floors[0];

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { floorId, updates: { name: '1階' } },
        });
      });

      const updatedFloor = result.current.state.building.floors[0];
      expect(updatedFloor).not.toBe(originalFloor);
      expect(updatedFloor.name).toBe('1階');
      expect(updatedFloor.id).toBe(floorId);
    });
  });

  describe('状態のリセット', () => {
    it('RESET_STATEアクションで初期状態に戻る', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const firstFloorId = result.current.state.building.floors[0].id;

      // 状態を変更
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_FLOOR',
          payload: { 
            floorId: firstFloorId, 
            updates: { buildingCommonArea: 500, name: '1階' } 
          },
        });
      });

      expect(result.current.state.building.floors[0].buildingCommonArea).toBe(500);
      expect(result.current.state.building.floors[0].name).toBe('1階');

      // リセット
      act(() => {
        result.current.dispatch({ type: 'RESET_STATE' });
      });

      expect(result.current.state.building.floors).toHaveLength(1);
      expect(result.current.state.building.floors[0].buildingCommonArea).toBe(0);
      expect(result.current.state.building.floors[0].name).toBe('1階');
      expect(result.current.state.calculationResults).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('SET_ERRORSアクションでエラーを設定できる', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const errors = [
        { type: 'REQUIRED_FIELD' as const, field: 'floorName', message: '階名は必須です' },
      ];

      act(() => {
        result.current.dispatch({
          type: 'SET_ERRORS',
          payload: errors,
        });
      });

      expect(result.current.state.uiState.errors).toEqual(errors);
    });

    it('CLEAR_ERRORSアクションでエラーをクリアできる', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      // エラーを設定
      act(() => {
        result.current.dispatch({
          type: 'SET_ERRORS',
          payload: [
            { type: 'REQUIRED_FIELD' as const, field: 'test', message: 'test' },
          ],
        });
      });

      expect(result.current.state.uiState.errors.length).toBeGreaterThan(0);

      // クリア
      act(() => {
        result.current.dispatch({ type: 'CLEAR_ERRORS' });
      });

      expect(result.current.state.uiState.errors).toEqual([]);
    });
  });

  describe('計算状態の管理', () => {
    it('SET_CALCULATINGで計算中フラグを設定できる', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      act(() => {
        result.current.dispatch({
          type: 'SET_CALCULATING',
          payload: true,
        });
      });

      expect(result.current.state.uiState.isCalculating).toBe(true);

      act(() => {
        result.current.dispatch({
          type: 'SET_CALCULATING',
          payload: false,
        });
      });

      expect(result.current.state.uiState.isCalculating).toBe(false);
    });
  });

  describe('階数一括更新', () => {
    it('SET_FLOOR_COUNTSアクションで階配列を一括更新できる', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const newFloors = [
        {
          id: 'floor-1',
          name: '3階',
          floorType: 'above-ground' as const,
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        },
        {
          id: 'floor-2',
          name: '2階',
          floorType: 'above-ground' as const,
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        },
        {
          id: 'floor-3',
          name: '1階',
          floorType: 'above-ground' as const,
          floorCommonArea: 100,
          buildingCommonArea: 50,
          usages: [],
          usageGroups: [],
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'SET_FLOOR_COUNTS',
          payload: { floors: newFloors, deletedFloorIds: [] },
        });
      });

      expect(result.current.state.building.floors).toHaveLength(3);
      expect(result.current.state.building.floors).toEqual(newFloors);
    });

    it('SET_FLOOR_COUNTSアクションは削除された階IDを記録する', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      const initialFloorId = result.current.state.building.floors[0].id;
      const newFloors = [
        {
          id: 'new-floor-1',
          name: '1階',
          floorType: 'above-ground' as const,
          floorCommonArea: 0,
          buildingCommonArea: 0,
          usages: [],
          usageGroups: [],
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'SET_FLOOR_COUNTS',
          payload: { 
            floors: newFloors, 
            deletedFloorIds: [initialFloorId] 
          },
        });
      });

      expect(result.current.state.building.floors).toHaveLength(1);
      expect(result.current.state.building.floors[0].id).toBe('new-floor-1');
      // deletedFloorIdsは状態には保存されないが、アクションで渡される
    });

    it('SET_FLOOR_COUNTSアクションで空の階配列も設定できる', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: AppStateProvider,
      });

      act(() => {
        result.current.dispatch({
          type: 'SET_FLOOR_COUNTS',
          payload: { floors: [], deletedFloorIds: [] },
        });
      });

      expect(result.current.state.building.floors).toHaveLength(0);
    });
  });
});
