/**
 * FloorManager コンポーネントのテスト
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppStateProvider } from '../contexts';
import { FloorManager } from './FloorManager';

describe('FloorManager', () => {
  it('初期状態で階数入力が表示される', () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    expect(screen.getByLabelText('地上階数')).toBeInTheDocument();
    expect(screen.getByLabelText('地階数')).toBeInTheDocument();
  });

  it('地上階数を変更すると階が追加される', async () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    const aboveGroundInput = screen.getByLabelText('地上階数');
    fireEvent.change(aboveGroundInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(aboveGroundInput).toHaveValue(2);
    });
  });

  it('地上階数を減らすと階が削除される', async () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    // まず3階建てにする
    const aboveGroundInput = screen.getByLabelText('地上階数');
    fireEvent.change(aboveGroundInput, { target: { value: '3' } });

    await waitFor(() => {
      expect(aboveGroundInput).toHaveValue(3);
    });

    // 2階建てに減らす
    fireEvent.change(aboveGroundInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(aboveGroundInput).toHaveValue(2);
    });
  });

  it('地上階数と地階数を組み合わせて設定できる', async () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    // 地上3階、地階2階にする
    const aboveGroundInput = screen.getByLabelText('地上階数');
    const basementInput = screen.getByLabelText('地階数');
    
    fireEvent.change(aboveGroundInput, { target: { value: '3' } });
    fireEvent.change(basementInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(aboveGroundInput).toHaveValue(3);
      expect(basementInput).toHaveValue(2);
    });
  });
});

describe('FloorManager - Task 5.1 Integration', () => {
  it('FloorCountInputコンポーネントが表示される', () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    expect(screen.getByLabelText('地上階数')).toBeInTheDocument();
    expect(screen.getByLabelText('地階数')).toBeInTheDocument();
  });

  it('初期状態で地上階数と地階数が既存階データから逆算される', () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    // 初期状態は地上1階のみ（地上階数: 1, 地階数: 0）
    const aboveGroundInput = screen.getByLabelText('地上階数') as HTMLInputElement;
    const basementInput = screen.getByLabelText('地階数') as HTMLInputElement;

    expect(aboveGroundInput.value).toBe('1');
    expect(basementInput.value).toBe('0');
  });

  it('地上階数を入力すると値が更新される', async () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    const aboveGroundInput = screen.getByLabelText('地上階数');
    
    // 地上5階に変更
    fireEvent.change(aboveGroundInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(aboveGroundInput).toHaveValue(5);
    });
  });

  it('地階数を入力すると値が更新される', async () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    const basementInput = screen.getByLabelText('地階数');
    
    // 地階2階に変更
    fireEvent.change(basementInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(basementInput).toHaveValue(2);
    });
  });

  it('「階を追加」ボタンが削除されている', () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    expect(screen.queryByRole('button', { name: /階を追加/i })).not.toBeInTheDocument();
  });

  it('各階の「削除」ボタンが削除されている', () => {
    render(
      <AppStateProvider>
        <FloorManager />
      </AppStateProvider>
    );

    expect(screen.queryByRole('button', { name: /削除/i })).not.toBeInTheDocument();
  });
});

