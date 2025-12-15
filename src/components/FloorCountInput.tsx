/**
 * FloorCountInput コンポーネント
 * 地上階数・地階数の数値入力UIを提供
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useState, useEffect } from 'react';
import { ValidationService } from '../services';
import '../styles/FloorCountInput.css';

/**
 * FloorCountInputコンポーネントのProps
 */
export interface FloorCountInputProps {
  /** 地上階数 */
  aboveGroundCount: number;
  /** 地階数 */
  basementCount: number;
  /** 非階数 */
  nonFloorCount: number;
  /** 階数変更時のコールバック */
  onChange: (aboveGround: number, basement: number, nonFloor: number) => void;
  /** 無効化フラグ */
  disabled?: boolean;
}

/**
 * 地上階数・地階数・非階数の入力コンポーネント
 */
export function FloorCountInput({
  aboveGroundCount,
  basementCount,
  nonFloorCount,
  onChange,
  disabled = false,
}: FloorCountInputProps) {
  const validationService = new ValidationService();

  // ローカルステート（入力値を文字列で管理）
  const [aboveGroundInput, setAboveGroundInput] = useState(String(aboveGroundCount));
  const [basementInput, setBasementInput] = useState(String(basementCount));
  const [nonFloorInput, setNonFloorInput] = useState(String(nonFloorCount));

  // エラーメッセージ
  const [aboveGroundError, setAboveGroundError] = useState<string | undefined>();
  const [basementError, setBasementError] = useState<string | undefined>();
  const [nonFloorError, setNonFloorError] = useState<string | undefined>();

  // Propsが変更された場合、ローカルステートを同期
  useEffect(() => {
    setAboveGroundInput(String(aboveGroundCount));
  }, [aboveGroundCount]);

  useEffect(() => {
    setBasementInput(String(basementCount));
  }, [basementCount]);

  useEffect(() => {
    setNonFloorInput(String(nonFloorCount));
  }, [nonFloorCount]);

  /**
   * 地上階数の変更ハンドラ
   */
  const handleAboveGroundChange = (value: string) => {
    setAboveGroundInput(value);

    // 空文字列または非数値文字列のチェック
    if (value === '' || isNaN(Number(value))) {
      setAboveGroundError('地上階数は有効な数値である必要があります');
      return;
    }

    // 数値に変換
    const numValue = Number(value);

    // バリデーション
    const result = validationService.validateInteger(numValue, '地上階数');

    if (result.success) {
      setAboveGroundError(undefined);
      onChange(numValue, basementCount, nonFloorCount);
    } else {
      setAboveGroundError(result.error.message);
    }
  };

  /**
   * 地階数の変更ハンドラ
   */
  const handleBasementChange = (value: string) => {
    setBasementInput(value);

    // 空文字列または非数値文字列のチェック
    if (value === '' || isNaN(Number(value))) {
      setBasementError('地階数は有効な数値である必要があります');
      return;
    }

    // 数値に変換
    const numValue = Number(value);

    // バリデーション
    const result = validationService.validateInteger(numValue, '地階数');

    if (result.success) {
      setBasementError(undefined);
      onChange(aboveGroundCount, numValue, nonFloorCount);
    } else {
      setBasementError(result.error.message);
    }
  };

  /**
   * 非階数の変更ハンドラ
   */
  const handleNonFloorChange = (value: string) => {
    setNonFloorInput(value);

    // 空文字列または非数値文字列のチェック
    if (value === '' || isNaN(Number(value))) {
      setNonFloorError('非階数は有効な数値である必要があります');
      return;
    }

    // 数値に変換
    const numValue = Number(value);

    // バリデーション
    const result = validationService.validateInteger(numValue, '非階数');

    if (result.success) {
      setNonFloorError(undefined);
      onChange(aboveGroundCount, basementCount, numValue);
    } else {
      setNonFloorError(result.error.message);
    }
  };

  return (
    <div className="floor-count-input">
      {/* 地上階数入力 */}
      <div className="floor-count-input__field">
        <label htmlFor="above-ground-count">地上階数</label>
        <input
          id="above-ground-count"
          type="number"
          min="0"
          step="1"
          value={aboveGroundInput}
          onChange={(e) => handleAboveGroundChange(e.target.value)}
          disabled={disabled}
          aria-label="地上階数を入力してください"
          aria-invalid={!!aboveGroundError}
          aria-describedby={aboveGroundError ? 'above-ground-error' : undefined}
        />
        {aboveGroundError && (
          <div
            id="above-ground-error"
            className="floor-count-input__error"
            role="alert"
            aria-live="polite"
          >
            {aboveGroundError}
          </div>
        )}
      </div>

      {/* 地階数入力 */}
      <div className="floor-count-input__field">
        <label htmlFor="basement-count">地階数</label>
        <input
          id="basement-count"
          type="number"
          min="0"
          step="1"
          value={basementInput}
          onChange={(e) => handleBasementChange(e.target.value)}
          disabled={disabled}
          aria-label="地階数を入力してください"
          aria-invalid={!!basementError}
          aria-describedby={basementError ? 'basement-error' : undefined}
        />
        {basementError && (
          <div
            id="basement-error"
            className="floor-count-input__error"
            role="alert"
            aria-live="polite"
          >
            {basementError}
          </div>
        )}
      </div>

      {/* 非階数入力 */}
      <div className="floor-count-input__field">
        <label htmlFor="non-floor-count">非階数</label>
        <input
          id="non-floor-count"
          type="number"
          min="0"
          step="1"
          value={nonFloorInput}
          onChange={(e) => handleNonFloorChange(e.target.value)}
          disabled={disabled}
          aria-label="非階数を入力してください（PH、M階など）"
          aria-invalid={!!nonFloorError}
          aria-describedby={nonFloorError ? 'non-floor-error' : undefined}
        />
        {nonFloorError && (
          <div
            id="non-floor-error"
            className="floor-count-input__error"
            role="alert"
            aria-live="polite"
          >
            {nonFloorError}
          </div>
        )}
      </div>
    </div>
  );
}
