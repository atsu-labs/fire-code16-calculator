/**
 * 用途グループ管理アクションのテスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppStateContext';
import { useUsageActions } from './UsageActions';
import { useUsageGroupActions } from './UsageGroupActions';

describe('UsageGroupActions', () => {
  describe('addUsageGroup', () => {
    it('新しい用途グループを追加できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          groupActions: useUsageGroupActions(),
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

      // 用途グループを追加(2用途)
      await act(async () => {
        const response = await result.current.groupActions.addUsageGroup(
          floorId,
          [usageId1, usageId2],
          50
        );
        expect(response.success).toBe(true);
      });

      const building = result.current.state.state.building;
      const floor = building.floors.find((f) => f.id === floorId);
      expect(floor?.usageGroups).toHaveLength(1);
      expect(floor?.usageGroups[0].usageIds).toEqual([usageId1, usageId2]);
      expect(floor?.usageGroups[0].commonArea).toBe(50);
    });

    it('2用途未満の場合はエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          groupActions: useUsageGroupActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 1つの用途を追加
      let usageId1 = '';
      await act(async () => {
        const r1 = await result.current.usageActions.addUsage(floorId, {
          annexedCode: 'annex01_i',
          annexedName: '１項イ',
          exclusiveArea: 100,
        });
        if (r1.success) usageId1 = r1.value.id;
      });

      // 用途グループを追加(1用途のみ)
      await act(async () => {
        const response = await result.current.groupActions.addUsageGroup(
          floorId,
          [usageId1],
          50
        );
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('INVALID_USAGE_GROUP');
        }
      });
    });

    it('全用途を選択した場合はエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          groupActions: useUsageGroupActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 2つの用途を追加
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
        if (r1.success) usageId1 = r1.value.id;
        if (r2.success) usageId2 = r2.value.id;
      });

      // 用途グループを追加(全用途)
      await act(async () => {
        const response = await result.current.groupActions.addUsageGroup(
          floorId,
          [usageId1, usageId2],
          50
        );
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('INVALID_USAGE_GROUP');
        }
      });
    });

    it('負の共用部面積はエラーを返す', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          groupActions: useUsageGroupActions(),
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

      // 負の面積
      await act(async () => {
        const response = await result.current.groupActions.addUsageGroup(
          floorId,
          [usageId1, usageId2],
          -50
        );
        expect(response.success).toBe(false);
        if (!response.success) {
          expect(response.error.type).toBe('NEGATIVE_VALUE');
        }
      });
    });
  });

  describe('updateUsageGroup', () => {
    it('用途グループ情報を更新できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          groupActions: useUsageGroupActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 用途を追加
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

      // 用途グループを追加
      let groupId = '';
      await act(async () => {
        const response = await result.current.groupActions.addUsageGroup(
          floorId,
          [usageId1, usageId2],
          50
        );
        if (response.success) {
          groupId = response.value.id;
        }
      });

      // 更新
      await act(async () => {
        const response = await result.current.groupActions.updateUsageGroup(
          floorId,
          groupId,
          { commonArea: 100 }
        );
        expect(response.success).toBe(true);
      });

      const building = result.current.state.state.building;
      const floor = building.floors.find((f) => f.id === floorId);
      expect(floor?.usageGroups[0].commonArea).toBe(100);
    });
  });

  describe('deleteUsageGroup', () => {
    it('用途グループを削除できる', async () => {
      const { result } = renderHook(
        () => ({
          state: useAppState(),
          usageActions: useUsageActions(),
          groupActions: useUsageGroupActions(),
        }),
        { wrapper: AppStateProvider }
      );

      const floorId = result.current.state.state.building.floors[0].id;

      // 用途を追加
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

      // 用途グループを追加
      let groupId = '';
      await act(async () => {
        const response = await result.current.groupActions.addUsageGroup(
          floorId,
          [usageId1, usageId2],
          50
        );
        if (response.success) {
          groupId = response.value.id;
        }
      });

      // 削除
      await act(async () => {
        const response = await result.current.groupActions.deleteUsageGroup(
          floorId,
          groupId
        );
        expect(response.success).toBe(true);
      });

      const building = result.current.state.state.building;
      const floor = building.floors.find((f) => f.id === floorId);
      expect(floor?.usageGroups).toHaveLength(0);
    });
  });
});
