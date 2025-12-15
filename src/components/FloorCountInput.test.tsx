/**
 * FloorCountInput コンポーネントの単体テスト
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloorCountInput } from './FloorCountInput';

describe('FloorCountInput', () => {
  describe('初期表示', () => {
    it('地上階数入力フィールドが表示される', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      expect(aboveGroundInput).toBeInTheDocument();
      expect(aboveGroundInput).toHaveValue(1);
    });

    it('地階数入力フィールドが表示される', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={2}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const basementInput = screen.getByLabelText(/地階数/i);
      expect(basementInput).toBeInTheDocument();
      expect(basementInput).toHaveValue(2);
    });
  });

  describe('入力値の反映', () => {
    it('地上階数を変更すると入力値がステートに反映される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      fireEvent.change(aboveGroundInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(5, 0, 0);
      });
    });

    it('地階数を変更すると入力値がステートに反映される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const basementInput = screen.getByLabelText(/地階数/i);
      fireEvent.change(basementInput, { target: { value: '3' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(1, 3, 0);
      });
    });

    it('0を入力すると正しく反映される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={5}
          basementCount={2}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      fireEvent.change(aboveGroundInput, { target: { value: '0' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(0, 2, 0);
      });
    });
  });

  describe('バリデーション', () => {
    it('負の数を入力するとバリデーションエラーが表示される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      fireEvent.change(aboveGroundInput, { target: { value: '-1' } });

      await waitFor(() => {
        expect(screen.getByText(/0以上の整数である必要があります/i)).toBeInTheDocument();
      });

      // onChangeは呼ばれない（無効な値）
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('小数を入力するとバリデーションエラーが表示される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const basementInput = screen.getByLabelText(/地階数/i);
      fireEvent.change(basementInput, { target: { value: '2.5' } });

      await waitFor(() => {
        expect(screen.getByText(/整数である必要があります/i)).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('最大値を超える値を入力するとバリデーションエラーが表示される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      fireEvent.change(aboveGroundInput, { target: { value: '1001' } });

      await waitFor(() => {
        expect(screen.getByText(/最大値1000以下である必要があります/i)).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('非数値を入力するとバリデーションエラーが表示される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      fireEvent.change(aboveGroundInput, { target: { value: 'abc' } });

      await waitFor(() => {
        expect(screen.getByText(/有効な数値である必要があります/i)).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('有効な値を入力するとバリデーションエラーが消える', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);

      // まず無効な値を入力
      fireEvent.change(aboveGroundInput, { target: { value: '-1' } });
      await waitFor(() => {
        expect(screen.getByText(/0以上の整数である必要があります/i)).toBeInTheDocument();
      });

      // 有効な値に修正
      fireEvent.change(aboveGroundInput, { target: { value: '5' } });
      await waitFor(() => {
        expect(screen.queryByText(/0以上の整数である必要があります/i)).not.toBeInTheDocument();
      });

      expect(mockOnChange).toHaveBeenCalledWith(5, 0, 0);
    });
  });

  describe('アクセシビリティ', () => {
    it('地上階数入力フィールドにlabel要素が関連付けられている', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const label = screen.getByText(/地上階数/i);
      
      expect(aboveGroundInput).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('地階数入力フィールドにlabel要素が関連付けられている', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const basementInput = screen.getByLabelText(/地階数/i);
      const label = screen.getByText(/地階数/i);
      
      expect(basementInput).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('入力フィールドにtype="number"属性が設定されている', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).toHaveAttribute('type', 'number');
      expect(basementInput).toHaveAttribute('type', 'number');
    });

    it('入力フィールドにmin="0"属性が設定されている', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).toHaveAttribute('min', '0');
      expect(basementInput).toHaveAttribute('min', '0');
    });

    it('入力フィールドにaria-label属性が設定されている', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).toHaveAttribute('aria-label');
      expect(basementInput).toHaveAttribute('aria-label');
    });

    it('バリデーションエラーがaria-live="polite"領域で通知される', async () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      fireEvent.change(aboveGroundInput, { target: { value: '-1' } });

      await waitFor(() => {
        const errorMessage = screen.getByText(/0以上の整数である必要があります/i);
        const ariaLiveRegion = errorMessage.closest('[aria-live]');
        
        expect(ariaLiveRegion).toBeInTheDocument();
        expect(ariaLiveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('キーボード操作で地上階数フィールドにフォーカスできる', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      aboveGroundInput.focus();
      
      expect(document.activeElement).toBe(aboveGroundInput);
    });

    it('キーボード操作で地階数フィールドにフォーカスできる', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const basementInput = screen.getByLabelText(/地階数/i);
      basementInput.focus();
      
      expect(document.activeElement).toBe(basementInput);
    });

    it('Tabキーでフォーカス順序が論理的である', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);

      // 地上階数フィールドにフォーカス
      aboveGroundInput.focus();
      expect(document.activeElement).toBe(aboveGroundInput);

      // Tabキーで次のフィールドに移動
      fireEvent.keyDown(aboveGroundInput, { key: 'Tab' });
      
      // 地階数フィールドがフォーカス可能であることを確認
      expect(basementInput).toBeInTheDocument();
      expect(basementInput.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('disabled状態', () => {
    it('disabled=trueの場合、入力フィールドが無効化される', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).toBeDisabled();
      expect(basementInput).toBeDisabled();
    });

    it('disabled=falseの場合、入力フィールドが有効である', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={1}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).not.toBeDisabled();
      expect(basementInput).not.toBeDisabled();
    });
  });

  describe('エッジケース', () => {
    it('両方の階数が0の場合でも正しく表示される', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={0}
          basementCount={0}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).toHaveValue(0);
      expect(basementInput).toHaveValue(0);
    });

    it('大きな値（100階）も正しく表示される', () => {
      const mockOnChange = vi.fn();
      render(
        <FloorCountInput
          aboveGroundCount={100}
          basementCount={50}
          nonFloorCount={0}
          onChange={mockOnChange}
        />
      );

      const aboveGroundInput = screen.getByLabelText(/地上階数/i);
      const basementInput = screen.getByLabelText(/地階数/i);
      
      expect(aboveGroundInput).toHaveValue(100);
      expect(basementInput).toHaveValue(50);
    });
  });
});
