/**
 * CalculationActions の用途判定機能の統合テスト
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider } from './AppStateContext';
import { useAppState } from './useAppState';
import { useCalculationActions } from './CalculationActions';
import { useFloorActions } from './FloorActions';
import { useUsageActions } from './UsageActions';

// テスト用のラッパー
function wrapper({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

describe('CalculationActions - 用途判定機能の統合テスト', () => {
  it('単一用途の場合、15項と判定される', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState(),
        floorActions: useFloorActions(),
        usageActions: useUsageActions(),
        calcActions: useCalculationActions(),
      }),
      { wrapper }
    );

    // デフォルトで1階が存在する
    const floorId = result.current.state.state.building.floors[0].id;

    // 4項を追加（1000㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex04',
        annexedName: '４項',
        exclusiveArea: 1000,
      });
    });

    // 計算実行
    await act(async () => {
      await result.current.calcActions.executeCalculation();
    });

    // 用途判定を確認
    const classification = result.current.state.state.calculationResults?.usageClassification;
    expect(classification).toBeDefined();
    expect(classification?.classification).toBe('annex15');
    expect(classification?.displayName).toBe('１５項');
    expect(classification?.details[0]).toContain('単一用途: ４項');
  });

  it('1項イと5項ロの複合用途は16項イと判定される', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState(),
        floorActions: useFloorActions(),
        usageActions: useUsageActions(),
        calcActions: useCalculationActions(),
      }),
      { wrapper }
    );

    // デフォルトで1階が存在する
    const floorId = result.current.state.state.building.floors[0].id;

    // 1項イを追加（500㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex01_i',
        annexedName: '１項イ',
        exclusiveArea: 500,
      });
    });

    // 5項ロを追加（500㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex05_ro',
        annexedName: '５項ロ',
        exclusiveArea: 500,
      });
    });

    // 計算実行
    await act(async () => {
      await result.current.calcActions.executeCalculation();
    });

    // 用途判定を確認
    const classification = result.current.state.state.calculationResults?.usageClassification;
    expect(classification).toBeDefined();
    expect(classification?.classification).toBe('annex16_i');
    expect(classification?.displayName).toBe('１６項イ');
    expect(classification?.details[0]).toContain('構成用途');
  });

  it('7項と8項の複合用途は16項ロと判定される', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState(),
        floorActions: useFloorActions(),
        usageActions: useUsageActions(),
        calcActions: useCalculationActions(),
      }),
      { wrapper }
    );

    // デフォルトで1階が存在する
    const floorId = result.current.state.state.building.floors[0].id;

    // 7項を追加（500㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex07',
        annexedName: '７項',
        exclusiveArea: 500,
      });
    });

    // 8項を追加（500㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex08',
        annexedName: '８項',
        exclusiveArea: 500,
      });
    });

    // 計算実行
    await act(async () => {
      await result.current.calcActions.executeCalculation();
    });

    // 用途判定を確認
    const classification = result.current.state.state.calculationResults?.usageClassification;
    expect(classification).toBeDefined();
    expect(classification?.classification).toBe('annex16_ro');
    expect(classification?.displayName).toBe('１６項ロ');
    expect(classification?.details[0]).toContain('構成用途');
  });

  it('6項イ(1)と6項イ(3)は集約されて単一用途（15項）と判定される', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState(),
        floorActions: useFloorActions(),
        usageActions: useUsageActions(),
        calcActions: useCalculationActions(),
      }),
      { wrapper }
    );

    // デフォルトで1階が存在する
    const floorId = result.current.state.state.building.floors[0].id;

    // 6項イ(1)を追加（300㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex06_i_1',
        annexedName: '６項イ(1)',
        exclusiveArea: 300,
      });
    });

    // 6項イ(3)を追加（200㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex06_i_3',
        annexedName: '６項イ(3)',
        exclusiveArea: 200,
      });
    });

    // 計算実行
    await act(async () => {
      await result.current.calcActions.executeCalculation();
    });

    // 用途判定を確認
    const classification = result.current.state.state.calculationResults?.usageClassification;
    expect(classification).toBeDefined();
    expect(classification?.classification).toBe('annex15');
    expect(classification?.displayName).toBe('１５項');
    expect(classification?.details[0]).toContain('単一用途: ６項イ');
  });

  it('主たる用途90%以上かつ他の用途300㎡未満の場合、従属とみなす', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState(),
        floorActions: useFloorActions(),
        usageActions: useUsageActions(),
        calcActions: useCalculationActions(),
      }),
      { wrapper }
    );

    // デフォルトで1階が存在する
    const floorId = result.current.state.state.building.floors[0].id;

    // 4項を追加（950㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex04',
        annexedName: '４項',
        exclusiveArea: 950,
      });
    });

    // 7項を追加（50㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex07',
        annexedName: '７項',
        exclusiveArea: 50,
      });
    });

    // 計算実行
    await act(async () => {
      await result.current.calcActions.executeCalculation();
    });

    // 用途判定を確認
    const classification = result.current.state.state.calculationResults?.usageClassification;
    expect(classification).toBeDefined();
    expect(classification?.classification).toBe('annex15');
    expect(classification?.displayName).toBe('１５項');
    expect(classification?.details[0]).toContain('みなし従属');
    expect(classification?.subordinateUsages).toHaveLength(1);
    expect(classification?.subordinateUsages![0].annexedCode).toBe('annex07');
  });

  it('6項ハを含む複合用途の場合、代替判定を提供する', async () => {
    const { result } = renderHook(
      () => ({
        state: useAppState(),
        floorActions: useFloorActions(),
        usageActions: useUsageActions(),
        calcActions: useCalculationActions(),
      }),
      { wrapper }
    );

    // デフォルトで1階が存在する
    const floorId = result.current.state.state.building.floors[0].id;

    // 6項ハ(2)を追加（500㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex06_ha_2',
        annexedName: '６項ハ(2)',
        exclusiveArea: 500,
      });
    });

    // 4項を追加（500㎡）
    await act(async () => {
      await result.current.usageActions.addUsage(floorId, {
        annexedCode: 'annex04',
        annexedName: '４項',
        exclusiveArea: 500,
      });
    });

    // 計算実行
    await act(async () => {
      await result.current.calcActions.executeCalculation();
    });

    // 用途判定を確認
    const classification = result.current.state.state.calculationResults?.usageClassification;
    expect(classification).toBeDefined();
    expect(classification?.classification).toBe('annex16_i');
    expect(classification?.displayName).toBe('１６項イ');
    
    // 代替判定が存在することを確認
    expect(classification?.alternativeClassification).toBeDefined();
    expect(classification?.alternativeClassification?.classification).toBe('annex15');
    expect(classification?.alternativeClassification?.note).toBe('６項ハに入居・宿泊がない場合');
  });
});
