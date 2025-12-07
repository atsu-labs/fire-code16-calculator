/**
 * 階管理アクションのテスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppStateContext';
import { useFloorActions } from './FloorActions';

describe('FloorActions', () => {
  describe('addFloor', () => {
    it('新しい階を追加できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const initialCount = result.current.state.state.building.floors.length;

      await act(async () => {
        const response = await result.current.actions.addFloor('2階');
        expect(response.success).toBe(true);
      });

      expect(result.current.state.state.building.floors.length).toBe(initialCount + 1);
      expect(result.current.state.state.building.floors[1].name).toBe('2階');
    });

    it('階名が空の場合はバリデーションエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      await act(async () => {
        const response = await result.current.actions.addFloor('');
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('REQUIRED_FIELD');
        }
      });
    });
  });

  describe('updateFloor', () => {
    it('階の共用部面積を更新できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      await act(async () => {
        const response = await result.current.actions.updateFloor(floorId, {
          floorCommonArea: 100,
        });
        expect(response.success).toBe(true);
      });

      expect(result.current.state.state.building.floors[0].floorCommonArea).toBe(100);
    });

    it('負の共用部面積はバリデーションエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      await act(async () => {
        const response = await result.current.actions.updateFloor(floorId, {
          floorCommonArea: -10,
        });
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('NEGATIVE_VALUE');
        }
      });
    });
  });

  describe('deleteFloor', () => {
    it('階を削除できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 2階を追加
      await act(async () => {
        await result.current.actions.addFloor('2階');
      });

      const floorId = result.current.state.state.building.floors[1].id;

      await act(async () => {
        const response = await result.current.actions.deleteFloor(floorId);
        expect(response.success).toBe(true);
      });

      expect(result.current.state.state.building.floors.length).toBe(1);
    });

    it('最後の1階は削除できない', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      await act(async () => {
        const response = await result.current.actions.deleteFloor(floorId);
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('MINIMUM_CONSTRAINT');
        }
      });

      expect(result.current.state.state.building.floors.length).toBe(1);
    });

    it('階削除時に用途と用途グループもカスケード削除される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 階を追加
      await act(async () => {
        await result.current.actions.addFloor('2階');
      });

      const floorId = result.current.state.state.building.floors[1].id;

      // 用途を追加（手動で状態を更新）
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: {
            floorId,
            updates: {
              usages: [
                {
                  id: 'usage-1',
                  annexedCode: 'annex01_i',
                  annexedName: '１項イ',
                  exclusiveArea: 100,
                },
              ],
            },
          },
        });
      });

      // 階を削除
      await act(async () => {
        const response = await result.current.actions.deleteFloor(floorId);
        expect(response.success).toBe(true);
      });

      // 削除されていることを確認
      expect(result.current.state.state.building.floors.length).toBe(1);
      expect(result.current.state.state.building.floors.find((f) => f.id === floorId)).toBeUndefined();
    });
  });

  describe('setFloorCounts', () => {
    it('階数増加時に不足階のみが追加される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 初期状態: 1階のみ（デフォルト、階名は空）
      expect(result.current.state.state.building.floors.length).toBe(1);

      // 地上3階、地下1階に変更
      await act(async () => {
        const response = await result.current.actions.setFloorCounts(3, 1);
        expect(response.success).toBe(true);
      });

      // 4階になっているはず（地上3階 + 地下1階）
      expect(result.current.state.state.building.floors.length).toBe(4);
      
      // 階名を確認（降順: 3階、2階、1階、地下1階）
      const floorNames = result.current.state.state.building.floors.map(f => f.name);
      expect(floorNames).toEqual(['3階', '2階', '1階', '地下1階']);
    });

    it('階数減少時に余剰階のみが削除される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 地上5階、地下2階を作成
      await act(async () => {
        await result.current.actions.setFloorCounts(5, 2);
      });

      expect(result.current.state.state.building.floors.length).toBe(7);

      // 地上3階、地下1階に減らす
      await act(async () => {
        const response = await result.current.actions.setFloorCounts(3, 1);
        expect(response.success).toBe(true);
      });

      // 4階になっているはず
      expect(result.current.state.state.building.floors.length).toBe(4);
      
      // 階名を確認（4階、5階、地下2階が削除されているはず）
      const floorNames = result.current.state.state.building.floors.map(f => f.name);
      expect(floorNames).toEqual(['3階', '2階', '1階', '地下1階']);
    });

    it('既存階のデータが保持される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 地上2階を作成
      await act(async () => {
        await result.current.actions.setFloorCounts(2, 0);
      });

      const floor1Id = result.current.state.state.building.floors.find(f => f.name === '1階')?.id;

      // 1階にデータを追加
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: {
            floorId: floor1Id!,
            updates: {
              floorCommonArea: 50,
              usages: [
                {
                  id: 'usage-1',
                  annexedCode: 'annex01_i',
                  annexedName: '１項イ',
                  exclusiveArea: 100,
                },
              ],
            },
          },
        });
      });

      // 地上5階に増やす
      await act(async () => {
        await result.current.actions.setFloorCounts(5, 0);
      });

      // 1階のデータが保持されていることを確認
      const updatedFloor1 = result.current.state.state.building.floors.find(f => f.name === '1階');
      expect(updatedFloor1?.id).toBe(floor1Id);
      expect(updatedFloor1?.floorCommonArea).toBe(50);
      expect(updatedFloor1?.usages).toHaveLength(1);
      expect(updatedFloor1?.usages[0].exclusiveArea).toBe(100);
    });

    it('最低1階制約が維持される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 地上0階、地下0階を設定しようとする
      await act(async () => {
        const response = await result.current.actions.setFloorCounts(0, 0);
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('MINIMUM_CONSTRAINT');
        }
      });

      // 初期状態が維持されていることを確認
      expect(result.current.state.state.building.floors.length).toBe(1);
    });

    it('データ損失時に確認ダイアログが表示され、キャンセルで変更が中止される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 地上3階を作成
      await act(async () => {
        await result.current.actions.setFloorCounts(3, 0);
      });

      const floor3Id = result.current.state.state.building.floors.find(f => f.name === '3階')?.id;

      // 3階にデータを追加
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: {
            floorId: floor3Id!,
            updates: {
              usages: [
                {
                  id: 'usage-3',
                  annexedCode: 'annex01_i',
                  annexedName: '１項イ',
                  exclusiveArea: 200,
                },
              ],
            },
          },
        });
      });

      // window.confirmをモック（falseを返す = キャンセル）
      const originalConfirm = window.confirm;
      window.confirm = () => false;

      // 地上2階に減らそうとする
      await act(async () => {
        const response = await result.current.actions.setFloorCounts(2, 0);
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('USER_CANCELLED');
        }
      });

      // 階数が変更されていないことを確認
      expect(result.current.state.state.building.floors.length).toBe(3);

      // モックを元に戻す
      window.confirm = originalConfirm;
    });

    it('データ損失時に確認ダイアログでOKを選択すると階が削除される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          actions: useFloorActions(),
        }),
        { wrapper: AppStateProvider }
      );

      // 地上3階を作成
      await act(async () => {
        await result.current.actions.setFloorCounts(3, 0);
      });

      const floor3Id = result.current.state.state.building.floors.find(f => f.name === '3階')?.id;

      // 3階にデータを追加
      await act(async () => {
        result.current.state.dispatch({
          type: 'UPDATE_FLOOR',
          payload: {
            floorId: floor3Id!,
            updates: {
              usages: [
                {
                  id: 'usage-3',
                  annexedCode: 'annex01_i',
                  annexedName: '１項イ',
                  exclusiveArea: 200,
                },
              ],
            },
          },
        });
      });

      // window.confirmをモック（trueを返す = OK）
      const originalConfirm = window.confirm;
      window.confirm = () => true;

      // 地上2階に減らす
      await act(async () => {
        const response = await result.current.actions.setFloorCounts(2, 0);
        expect(response.success).toBe(true);
      });

      // 3階が削除されていることを確認
      expect(result.current.state.state.building.floors.length).toBe(2);
      const floorNames = result.current.state.state.building.floors.map(f => f.name);
      expect(floorNames).toEqual(['2階', '1階']);

      // モックを元に戻す
      window.confirm = originalConfirm;
    });
  });
});
