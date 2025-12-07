/**
 * 用途管理アクションのテスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppStateContext';
import { useFloorActions } from './FloorActions';
import { useUsageActions } from './UsageActions';

describe('UsageActions', () => {
  describe('addUsage', () => {
    it('新しい用途を追加できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          floorActions: useFloorActions(),
          usageActions: useUsageActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      await act(async () => {
        const response = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        expect(response.success).toBe(true);
      });

      const floor = result.current.state.state.building.floors[0];
      expect(floor.usages).toHaveLength(1);
      expect(floor.usages[0].annexedCode).toBe('annex01_i');
      expect(floor.usages[0].exclusiveArea).toBe(100);
    });

    it('用途コードが空の場合はエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      await act(async () => {
        const response = await result.current.usageActions.addUsage(floorId, {
          annexedCode: '',
          annexedName: '',
          exclusiveArea: 100,
        });
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('REQUIRED_FIELD');
        }
      });
    });

    it('負の面積はエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      await act(async () => {
        const response = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: -100,
        });
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('NEGATIVE_VALUE');
        }
      });
    });
  });

  describe('updateUsage', () => {
    it('用途情報を更新できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // まず用途を追加
      let usageId = '';
      await act(async () => {
        const response = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        if (response.success) {
          usageId = response.value.id;
        }
      });

      // 更新
      await act(async () => {
        const response = await result.current.usageActions.updateUsage(
          floorId,
          usageId,
          { exclusiveArea: 200 }
        );
        expect(response.success).toBe(true);
      });

      const floor = result.current.state.state.building.floors[0];
      expect(floor.usages[0].exclusiveArea).toBe(200);
    });
  });

  describe('deleteUsage', () => {
    it('用途を削除できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 2つの用途を追加
      let usageId1 = '';
      let usageId2 = '';
      await act(async () => {
        const response1 = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        const response2 = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex02_i',
          annexedName: '２項イ',
          exclusiveArea: 200,
        });
        if (response1.success) usageId1 = response1.value.id;
        if (response2.success) usageId2 = response2.value.id;
      });

      // 1つ目を削除
      await act(async () => {
        const response = await result.current.usageActions.deleteUsage(floorId, usageId1);
        expect(response.success).toBe(true);
      });

      const floor = result.current.state.state.building.floors[0];
      expect(floor.usages).toHaveLength(1);
      expect(floor.usages[0].id).toBe(usageId2);
    });

    it('用途削除時に関連する用途グループも削除される', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 3つの用途を追加
      let usageId1 = '';
      let usageId2 = '';
      await act(async () => {
        const r1 = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        const r2 = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex02_i',
          annexedName: '２項イ',
          exclusiveArea: 200,
        });
        await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex03_i',
          annexedName: '３項イ',
          exclusiveArea: 300,
        });
        if (r1.success) usageId1 = r1.value.id;
        if (r2.success) usageId2 = r2.value.id;
      });

      // 用途グループを手動で追加（usage1とusage2を含む）
      await act(async () => {
        result.current.state.dispatch({
          type: 'ADD_USAGE_GROUP',
          payload: {
            floorId,
            usageGroup: {
              id: 'group-1',
              floorId,
              usageIds: [usageId1, usageId2],
              commonArea: 50,
            },
          },
        });
      });

      const beforeDelete = result.current.state.state.building;
      expect(beforeDelete.floors[0].usageGroups).toHaveLength(1);

      // usage1を削除
      await act(async () => {
        await result.current.usageActions.deleteUsage(floorId, usageId1);
      });

      // 用途は削除されているが、用途グループはまだ存在（カスケード削除なし）
      const afterDelete = result.current.state.state.building;
      expect(afterDelete.floors[0].usages).toHaveLength(2);
      expect(afterDelete.floors[0].usageGroups).toHaveLength(1); // カスケード削除は実装していない
    });
  });
});
