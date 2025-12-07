/**
 * AppControls コンポーネント
 * 計算実行とクリアボタン
 */

import { useAppState } from '../contexts/AppStateContext';
import { useCalculationActions } from '../contexts/CalculationActions';
import '../styles/AppControls.css';

export function AppControls() {
  const { state } = useAppState();
  const { executeCalculation, clearAll } = useCalculationActions();

  const handleCalculate = async () => {
    const result = await executeCalculation();
    if (!result.success) {
      alert(`計算エラー: ${result.error || '不明なエラー'}`);
    }
  };

  const handleClear = () => {
    if (confirm('すべてのデータをクリアしてもよろしいですか?')) {
      clearAll();
    }
  };

  const isCalculating = state.uiState.isCalculating;

  return (
    <div className="app-controls">
      <button
        onClick={handleCalculate}
        disabled={isCalculating}
        className="calculate-button"
      >
        {isCalculating ? '計算中...' : '計算実行'}
      </button>
      <button
        onClick={handleClear}
        disabled={isCalculating}
        className="clear-button"
      >
        クリア
      </button>
      {state.uiState.errors.length > 0 && (
        <div className="error-message" role="alert">
          エラー: {state.uiState.errors.map(e => e.message).join(', ')}
        </div>
      )}
    </div>
  );
}
