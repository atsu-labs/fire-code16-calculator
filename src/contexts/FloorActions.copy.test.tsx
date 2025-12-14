/**
 * FloorActions.copyFloorData のテスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider } from './AppStateContext';
import { useFloorActions } from './FloorActions';
import { useAppState } from './useAppState';
import type { ReactNode } from 'react';

// テスト用のWrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('FloorActions - copyFloorData', () => {
  it('階の用途・共用部情報を正常にコピーできる', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState().state,
        actions: useFloorActions(),
      }),
      { wrapper }
    );

    // 2つの階を追加
    let floor1Id: string;
    let floor2Id: string;

    await act(async () => {
      const floor1Result = await result.current.actions.addFloor('1階');
      const floor2Result = await result.current.actions.addFloor('2階');
      
      expect(floor1Result.success).toBe(true);
      expect(floor2Result.success).toBe(true);
      
      if (floor1Result.success && floor2Result.success) {
        floor1Id = floor1Result.value.id;
        floor2Id = floor2Result.value.id;
      }
    });

    // 1階にデータを設定
    await act(async () => {
      // 共用部面積を設定
      await result.current.actions.updateFloor(floor1Id, {
        floorCommonArea: 100,
        buildingCommonArea: 50,
      });
    });

    // 1階の状態を確認
    const floor1Before = result.current.state.building.floors.find((f) => f.id === floor1Id);
    expect(floor1Before).toBeDefined();
    expect(floor1Before!.floorCommonArea).toBe(100);
    expect(floor1Before!.buildingCommonArea).toBe(50);

    // 1階から2階にコピー
    await act(async () => {
      const copyResult = await result.current.actions.copyFloorData(floor1Id, floor2Id);
      expect(copyResult.success).toBe(true);
    });

    // 2階にデータがコピーされたことを確認
    const floor2After = result.current.state.building.floors.find((f) => f.id === floor2Id);
    expect(floor2After).toBeDefined();
    expect(floor2After!.floorCommonArea).toBe(100);
    expect(floor2After!.buildingCommonArea).toBe(50);

    // 1階のデータは変わっていないことを確認
    const floor1After = result.current.state.building.floors.find((f) => f.id === floor1Id);
    expect(floor1After!.floorCommonArea).toBe(100);
    expect(floor1After!.buildingCommonArea).toBe(50);
  });

  it('存在しないコピー元を指定するとエラーを返す', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState().state,
        actions: useFloorActions(),
      }),
      { wrapper }
    );

    // 1つの階を追加
    let floorId: string;

    await act(async () => {
      const floorResult = await result.current.actions.addFloor('1階');
      expect(floorResult.success).toBe(true);
      
      if (floorResult.success) {
        floorId = floorResult.value.id;
      }
    });

    // 存在しないIDからコピーを試みる
    await act(async () => {
      const copyResult = await result.current.actions.copyFloorData('invalid-id', floorId);
      expect(copyResult.success).toBe(false);
      if (!copyResult.success) {
        expect(copyResult.error.message).toContain('コピー元の階が見つかりません');
      }
    });
  });

  it('存在しないコピー先を指定するとエラーを返す', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState().state,
        actions: useFloorActions(),
      }),
      { wrapper }
    );

    // 1つの階を追加
    let floorId: string;

    await act(async () => {
      const floorResult = await result.current.actions.addFloor('1階');
      expect(floorResult.success).toBe(true);
      
      if (floorResult.success) {
        floorId = floorResult.value.id;
      }
    });

    // 存在しないIDへコピーを試みる
    await act(async () => {
      const copyResult = await result.current.actions.copyFloorData(floorId, 'invalid-id');
      expect(copyResult.success).toBe(false);
      if (!copyResult.success) {
        expect(copyResult.error.message).toContain('コピー先の階が見つかりません');
      }
    });
  });

  it('コピー先の既存データを上書きする', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState().state,
        actions: useFloorActions(),
      }),
      { wrapper }
    );

    // 2つの階を追加
    let floor1Id: string;
    let floor2Id: string;

    await act(async () => {
      const floor1Result = await result.current.actions.addFloor('1階');
      const floor2Result = await result.current.actions.addFloor('2階');
      
      expect(floor1Result.success).toBe(true);
      expect(floor2Result.success).toBe(true);
      
      if (floor1Result.success && floor2Result.success) {
        floor1Id = floor1Result.value.id;
        floor2Id = floor2Result.value.id;
      }
    });

    // 両方の階にデータを設定
    await act(async () => {
      await result.current.actions.updateFloor(floor1Id, {
        floorCommonArea: 100,
        buildingCommonArea: 50,
      });
      
      await result.current.actions.updateFloor(floor2Id, {
        floorCommonArea: 200,
        buildingCommonArea: 150,
      });
    });

    // 2階の初期データを確認
    const floor2Before = result.current.state.building.floors.find((f) => f.id === floor2Id);
    expect(floor2Before!.floorCommonArea).toBe(200);
    expect(floor2Before!.buildingCommonArea).toBe(150);

    // 1階から2階にコピー（上書き）
    await act(async () => {
      const copyResult = await result.current.actions.copyFloorData(floor1Id, floor2Id);
      expect(copyResult.success).toBe(true);
    });

    // 2階のデータが1階のデータで上書きされたことを確認
    const floor2After = result.current.state.building.floors.find((f) => f.id === floor2Id);
    expect(floor2After!.floorCommonArea).toBe(100);
    expect(floor2After!.buildingCommonArea).toBe(50);
  });
});
