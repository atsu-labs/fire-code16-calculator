/**
 * FloorCountInput E2Eテスト
 * Task 7.1: 階数入力から階リスト更新までのE2Eテスト
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.5, 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 8.2, 8.3, 8.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe.skip('FloorCountInput E2E Tests - Task 7.1', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // window.confirmをスパイ
    confirmSpy = vi.spyOn(window, 'confirm');
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  describe('基本的な階数入力フロー', () => {
    it('ユーザーが地上階数5、地階数2を入力すると7階が表示される', async () => {
      render(<App />);

      // 初期状態: 地上1階のみ
      expect(screen.getAllByLabelText(/階名/i)).toHaveLength(1);

      // 地上階数を5に設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      fireEvent.change(aboveGroundInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(5);
      });

      // 地階数を2に設定
      const basementInput = screen.getByLabelText('地階数');
      fireEvent.change(basementInput, { target: { value: '2' } });

      // 合計7階が表示されることを確認
      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(7);

        // 階の表示順序を確認: 地上階降順 + 地階降順
        expect(floorInputs[0]).toHaveValue('5階'); // 地上5階
        expect(floorInputs[1]).toHaveValue('4階'); // 地上4階
        expect(floorInputs[2]).toHaveValue('3階'); // 地上3階
        expect(floorInputs[3]).toHaveValue('2階'); // 地上2階
        expect(floorInputs[4]).toHaveValue('1階'); // 地上1階
        expect(floorInputs[5]).toHaveValue('地下1階'); // 地階1階
        expect(floorInputs[6]).toHaveValue('地下2階'); // 地階2階
      });
    });
  });

  describe('階数減少による階削除フロー', () => {
    it('地上階数を3に変更すると4階・5階が削除される', async () => {
      // 確認ダイアログを自動承認
      confirmSpy.mockImplementation(() => true);

      render(<App />);

      // まず地上5階、地階2階に設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      const basementInput = screen.getByLabelText('地階数');

      fireEvent.change(aboveGroundInput, { target: { value: '5' } });
      fireEvent.change(basementInput, { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(7);
      });

      // 地上階数を3に減らす
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });

      // 5階が削除され、3階 + 2地階 = 5階になることを確認
      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(5);

        // 4階と5階が削除され、3階、2階、1階、地下1階、地下2階が残る
        expect(floorInputs[0]).toHaveValue('3階');
        expect(floorInputs[1]).toHaveValue('2階');
        expect(floorInputs[2]).toHaveValue('1階');
        expect(floorInputs[3]).toHaveValue('地下1階');
        expect(floorInputs[4]).toHaveValue('地下2階');

        // 4階と5階が存在しないことを確認
        const allValues = Array.from(floorInputs).map((input: Element) => (input as HTMLInputElement).value);
        expect(allValues).not.toContain('4階');
        expect(allValues).not.toContain('5階');
      });
    });
  });

  describe('確認ダイアログのフロー', () => {
    it('削除される階にデータがある場合、確認ダイアログが表示される', async () => {
      confirmSpy.mockImplementation(() => true);

      render(<App />);

      // 地上3階にする
      const aboveGroundInput = screen.getByLabelText('地上階数');
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(3);
      });

      // 3階（最上階）に用途を追加してデータを作成
      const addUsageButtons = screen.getAllByRole('button', { name: /用途を追加/i });
      fireEvent.click(addUsageButtons[0]); // 最初のボタンは3階（降順表示のため）

      await waitFor(() => {
        // 用途が追加されたことを確認
        const usageSelects = screen.getAllByLabelText(/用途名/i);
        expect(usageSelects.length).toBeGreaterThan(0);
      });

      // 地上階数を2に減らす（3階を削除）
      confirmSpy.mockClear();
      fireEvent.change(aboveGroundInput, { target: { value: '2' } });

      // 確認ダイアログが呼び出されることを確認
      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(confirmSpy).toHaveBeenCalledWith(
          expect.stringContaining('データが存在')
        );
      });
    });

    it('確認ダイアログでキャンセルを選択すると変更が中止される', async () => {
      // キャンセルを選択
      confirmSpy.mockImplementation(() => false);

      render(<App />);

      // 地上3階にする
      const aboveGroundInput = screen.getByLabelText('地上階数');
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(3);
      });

      // 3階に用途を追加
      const addUsageButtons = screen.getAllByRole('button', { name: /用途を追加/i });
      fireEvent.click(addUsageButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByLabelText(/用途名/i).length).toBeGreaterThan(0);
      });

      // 地上階数を2に減らそうとする
      confirmSpy.mockClear();
      fireEvent.change(aboveGroundInput, { target: { value: '2' } });

      // 確認ダイアログが表示される
      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      // キャンセルが選択されたので、3階のまま維持される
      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(3);
        expect(floorInputs[0]).toHaveValue('3階');
      });

      // 注: 入力フィールドは変更されたままだが、実際の階データは変更されていない
      // これはReactの制御されたコンポーネントの挙動として正常
    });

    it('確認ダイアログでOKを選択すると階が削除される', async () => {
      // OKを選択
      confirmSpy.mockImplementation(() => true);

      render(<App />);

      // 地上3階にする
      const aboveGroundInput = screen.getByLabelText('地上階数');
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(3);
      });

      // 3階に用途を追加
      const addUsageButtons = screen.getAllByRole('button', { name: /用途を追加/i });
      fireEvent.click(addUsageButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByLabelText(/用途名/i).length).toBeGreaterThan(0);
      });

      // 地上階数を2に減らす
      confirmSpy.mockClear();
      fireEvent.change(aboveGroundInput, { target: { value: '2' } });

      // 確認ダイアログが表示される
      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      // OKが選択されたので、3階が削除され2階になる
      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(2);
        expect(floorInputs[0]).toHaveValue('2階');
        expect(floorInputs[1]).toHaveValue('1階');

        // 3階が存在しないことを確認
        const allValues = Array.from(floorInputs).map((input: Element) => (input as HTMLInputElement).value);
        expect(allValues).not.toContain('3階');
      });
    });
  });

  describe('階順序の表示確認', () => {
    it('階順序が論理的（地上階降順 → 地階降順）に表示される', async () => {
      render(<App />);

      // 地上3階、地階2階に設定
      const aboveGroundInput = screen.getByLabelText('地上階数');
      const basementInput = screen.getByLabelText('地階数');

      fireEvent.change(aboveGroundInput, { target: { value: '3' } });
      fireEvent.change(basementInput, { target: { value: '2' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(5);

        // 論理的順序の検証
        // 地上階は上から下へ (3階 → 2階 → 1階)
        expect(floorInputs[0]).toHaveValue('3階');
        expect(floorInputs[1]).toHaveValue('2階');
        expect(floorInputs[2]).toHaveValue('1階');

        // 地階は浅い方から深い方へ (地下1階 → 地下2階)
        expect(floorInputs[3]).toHaveValue('地下1階');
        expect(floorInputs[4]).toHaveValue('地下2階');
      });
    });

    it('階数変更後も論理的順序が維持される', async () => {
      confirmSpy.mockImplementation(() => true);

      render(<App />);

      const aboveGroundInput = screen.getByLabelText('地上階数');

      // まず2階にする
      fireEvent.change(aboveGroundInput, { target: { value: '2' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs[0]).toHaveValue('2階');
        expect(floorInputs[1]).toHaveValue('1階');
      });

      // 5階に増やす
      fireEvent.change(aboveGroundInput, { target: { value: '5' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(5);

        // 降順が維持される
        expect(floorInputs[0]).toHaveValue('5階');
        expect(floorInputs[1]).toHaveValue('4階');
        expect(floorInputs[2]).toHaveValue('3階');
        expect(floorInputs[3]).toHaveValue('2階');
        expect(floorInputs[4]).toHaveValue('1階');
      });

      // 3階に減らす
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(3);

        // 降順が維持される
        expect(floorInputs[0]).toHaveValue('3階');
        expect(floorInputs[1]).toHaveValue('2階');
        expect(floorInputs[2]).toHaveValue('1階');
      });
    });
  });

  describe('複雑なシナリオ', () => {
    it('地上階と地階を同時に変更しても正しく反映される', async () => {
      confirmSpy.mockImplementation(() => true);

      render(<App />);

      const aboveGroundInput = screen.getByLabelText('地上階数');
      const basementInput = screen.getByLabelText('地階数');

      // 地上5階、地階3階に設定
      fireEvent.change(aboveGroundInput, { target: { value: '5' } });
      fireEvent.change(basementInput, { target: { value: '3' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(8);

        // 地上階
        expect(floorInputs[0]).toHaveValue('5階');
        expect(floorInputs[4]).toHaveValue('1階');

        // 地階
        expect(floorInputs[5]).toHaveValue('地下1階');
        expect(floorInputs[6]).toHaveValue('地下2階');
        expect(floorInputs[7]).toHaveValue('地下3階');
      });

      // 地上3階、地階1階に減らす
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });
      fireEvent.change(basementInput, { target: { value: '1' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(4);

        expect(floorInputs[0]).toHaveValue('3階');
        expect(floorInputs[1]).toHaveValue('2階');
        expect(floorInputs[2]).toHaveValue('1階');
        expect(floorInputs[3]).toHaveValue('地下1階');
      });
    });

    it('地上階を0にして地階のみにできる', async () => {
      render(<App />);

      const aboveGroundInput = screen.getByLabelText('地上階数');
      const basementInput = screen.getByLabelText('地階数');

      // まず地階を追加
      fireEvent.change(basementInput, { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(3); // 地上1 + 地階2
      });

      // 地上階を0にする
      fireEvent.change(aboveGroundInput, { target: { value: '0' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(2); // 地階2のみ

        expect(floorInputs[0]).toHaveValue('地下1階');
        expect(floorInputs[1]).toHaveValue('地下2階');
      });
    });

    it('既存階にデータがある場合でも、増加時はダイアログなしで階が追加される', async () => {
      confirmSpy.mockImplementation(() => true);

      render(<App />);

      // 地上2階にする
      const aboveGroundInput = screen.getByLabelText('地上階数');
      fireEvent.change(aboveGroundInput, { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/階名/i)).toHaveLength(2);
      });

      // 1階に用途を追加
      const addUsageButtons = screen.getAllByRole('button', { name: /用途を追加/i });
      fireEvent.click(addUsageButtons[1]); // 2番目のボタンは1階（降順表示）

      await waitFor(() => {
        expect(screen.getAllByLabelText(/用途名/i).length).toBeGreaterThan(0);
      });

      // 地上3階に増やす（データがある階は削除されないので確認ダイアログは不要）
      confirmSpy.mockClear();
      fireEvent.change(aboveGroundInput, { target: { value: '3' } });

      await waitFor(() => {
        const floorInputs = screen.getAllByLabelText(/階名/i);
        expect(floorInputs).toHaveLength(3);
      });

      // 確認ダイアログは呼ばれない（増加のみ）
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});
