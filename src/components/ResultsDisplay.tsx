/**
 * ResultsDisplay コンポーネント
 * 計算結果の表示
 */

import { useAppState } from '../contexts/AppStateContext';
import '../styles/ResultsDisplay.css';

export function ResultsDisplay() {
  const { state } = useAppState();

  if (!state.calculationResults || state.calculationResults.floorResults.length === 0) {
    return (
      <div className="results-display empty">
        <p>計算を実行すると結果が表示されます</p>
      </div>
    );
  }

  const { floorResults, buildingTotal } = state.calculationResults;

  return (
    <div className="results-display">
      <h2>計算結果</h2>

      {floorResults.map((floorResult) => (
        <div key={floorResult.floorId} className="floor-result">
          <h3>{floorResult.floorName}</h3>

          {floorResult.usageBreakdowns.map((breakdown) => (
            <div key={breakdown.usageId} className="usage-result">
              <h4>{breakdown.annexedName}</h4>
              <table className="result-table">
                <tbody>
                  <tr>
                    <th>専有面積</th>
                    <td>{breakdown.exclusiveArea.toFixed(2)} m²</td>
                  </tr>
                  <tr>
                    <th>階共用部按分面積</th>
                    <td>{breakdown.floorCommonArea.toFixed(2)} m²</td>
                  </tr>
                  <tr>
                    <th>建物共用部按分面積</th>
                    <td>{breakdown.buildingCommonArea.toFixed(2)} m²</td>
                  </tr>
                  {breakdown.usageGroupCommonArea > 0 && (
                    <tr>
                      <th>用途グループ共用部按分面積</th>
                      <td>{breakdown.usageGroupCommonArea.toFixed(2)} m²</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <th>合計面積</th>
                    <td><strong>{breakdown.totalArea.toFixed(2)} m²</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}

      {buildingTotal && (
        <div className="building-totals">
          <h3>建物全体の集計</h3>
          <table className="result-table">
            <thead>
              <tr>
                <th>用途</th>
                <th>専有面積</th>
                <th>階共用部</th>
                <th>建物共用部</th>
                <th>グループ共用部</th>
                <th>合計面積</th>
              </tr>
            </thead>
            <tbody>
              {buildingTotal.usageTotals.map((total) => (
                <tr key={total.annexedCode}>
                  <td>{total.annexedName}</td>
                  <td>{total.exclusiveArea.toFixed(2)} m²</td>
                  <td>{total.floorCommonArea.toFixed(2)} m²</td>
                  <td>{total.buildingCommonArea.toFixed(2)} m²</td>
                  <td>{total.usageGroupCommonArea.toFixed(2)} m²</td>
                  <td><strong>{total.totalArea.toFixed(2)} m²</strong></td>
                </tr>
              ))}
              <tr className="grand-total-row">
                <td colSpan={5}><strong>総合計</strong></td>
                <td><strong>{buildingTotal.grandTotal.toFixed(2)} m²</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
