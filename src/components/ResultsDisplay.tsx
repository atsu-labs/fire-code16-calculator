/**
 * ResultsDisplay コンポーネント
 * 計算結果の表示
 */

import { useAppState } from '../contexts/AppStateContext';
import '../styles/ResultsDisplay.css';
import type { UsageAreaBreakdown } from '../types';

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

  // 全用途コードを収集（重複なし、ソート済み）
  const allUsageCodes = Array.from(
    new Set(
      floorResults.flatMap((floor) =>
        floor.usageBreakdowns.map((b) => b.annexedCode)
      )
    )
  ).sort();

  // 用途コードから用途名を取得するマップ
  const usageCodeToName = new Map<string, string>();
  floorResults.forEach((floor) => {
    floor.usageBreakdowns.forEach((b) => {
      usageCodeToName.set(b.annexedCode, b.annexedName);
    });
  });

  // 階と用途コードから内訳を取得するヘルパー
  const getBreakdown = (floorId: string, usageCode: string): UsageAreaBreakdown | null => {
    const floor = floorResults.find((f) => f.floorId === floorId);
    if (!floor) return null;
    return floor.usageBreakdowns.find((b) => b.annexedCode === usageCode) || null;
  };

  // 用途ごとの専有面積合計を計算
  const usageTotals = new Map<string, number>();
  allUsageCodes.forEach((code) => {
    const total = floorResults.reduce((sum, floor) => {
      const breakdown = getBreakdown(floor.floorId, code);
      return sum + (breakdown ? breakdown.exclusiveArea : 0);
    }, 0);
    usageTotals.set(code, total);
  });

  // 各共用部の合計を計算
  const totalFloorCommon = floorResults.reduce(
    (sum, floor) => sum + (floor.originalData?.floorCommonArea || 0),
    0
  );
  const totalBuildingCommon = floorResults.reduce(
    (sum, floor) => sum + (floor.originalData?.buildingCommonArea || 0),
    0
  );
  const totalGroupCommon = floorResults.reduce(
    (sum, floor) => sum + (floor.originalData?.usageGroupCommonArea || 0),
    0
  );

  // 全専有面積の合計
  const grandTotalExclusive = Array.from(usageTotals.values()).reduce((sum, val) => sum + val, 0);

  return (
    <div className="results-display">
      <h2>計算結果</h2>

      {/* 案分前マトリックス */}
      <div className="matrix-section">
        <h3>案分前の面積（入力値）</h3>
        <div className="table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="row-header">階</th>
                {allUsageCodes.map((code) => (
                  <th key={code} className="usage-header">
                    {usageCodeToName.get(code)}
                  </th>
                ))}
                <th className="total-header">階共用部</th>
                <th className="total-header">建物共用部</th>
                <th className="total-header">グループ共用部</th>
                <th className="total-header">階の合計</th>
              </tr>
            </thead>
            <tbody>
              {floorResults.map((floor) => {
                // 各階の専有面積合計
                const floorExclusiveTotal = allUsageCodes.reduce((sum, code) => {
                  const breakdown = getBreakdown(floor.floorId, code);
                  return sum + (breakdown ? breakdown.exclusiveArea : 0);
                }, 0);
                
                // 階の合計
                const floorTotal = 
                  floorExclusiveTotal +
                  (floor.originalData?.floorCommonArea || 0) +
                  (floor.originalData?.buildingCommonArea || 0) +
                  (floor.originalData?.usageGroupCommonArea || 0);

                return (
                  <tr key={floor.floorId}>
                    <td className="row-header">{floor.floorName}</td>
                    {allUsageCodes.map((code) => {
                      const breakdown = getBreakdown(floor.floorId, code);
                      return (
                        <td key={code} className="data-cell">
                          {breakdown ? breakdown.exclusiveArea.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className="total-cell">
                      {floor.originalData?.floorCommonArea.toFixed(2) || '0.00'}
                    </td>
                    <td className="total-cell">
                      {floor.originalData?.buildingCommonArea.toFixed(2) || '0.00'}
                    </td>
                    <td className="total-cell">
                      {floor.originalData?.usageGroupCommonArea.toFixed(2) || '0.00'}
                    </td>
                    <td className="row-total-cell">
                      <strong>{floorTotal.toFixed(2)}</strong>
                    </td>
                  </tr>
                );
              })}
              {/* 合計行 */}
              <tr className="total-row">
                <td className="row-header"><strong>合計</strong></td>
                {allUsageCodes.map((code) => (
                  <td key={code} className="data-cell total-cell">
                    <strong>{usageTotals.get(code)?.toFixed(2) || '0.00'}</strong>
                  </td>
                ))}
                <td className="total-cell">
                  <strong>{totalFloorCommon.toFixed(2)}</strong>
                </td>
                <td className="total-cell">
                  <strong>{totalBuildingCommon.toFixed(2)}</strong>
                </td>
                <td className="total-cell">
                  <strong>{totalGroupCommon.toFixed(2)}</strong>
                </td>
                <td className="grand-total-cell">
                  <strong>{(grandTotalExclusive + totalFloorCommon + totalBuildingCommon + totalGroupCommon).toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 案分後の合計面積（階別×用途別） */}
      <div className="matrix-section">
        <h3>案分後の合計面積（階別×用途別）</h3>
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5em', marginBottom: '1em' }}>
          ※各セルの値 = 専有面積 + 階共用部按分 + 建物共用部按分（その階から） + グループ共用部按分（全グループから）
        </p>
        <div className="table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="row-header">階</th>
                {allUsageCodes.map((code) => (
                  <th key={code} className="usage-header">
                    {usageCodeToName.get(code)}
                  </th>
                ))}
                <th className="total-header">階の合計</th>
              </tr>
            </thead>
            <tbody>
              {floorResults.map((floor) => {
                // 階の合計 = 案分前の入力値の合計
                // （専有面積 + 階共用部 + 建物共用部 + グループ共用部）
                const floorTotalAfterDistribution = 
                  (floor.originalData?.totalExclusiveArea || 0) +
                  (floor.originalData?.floorCommonArea || 0) +
                  (floor.originalData?.buildingCommonArea || 0) +
                  (floor.originalData?.usageGroupCommonArea || 0);

                return (
                  <tr key={floor.floorId}>
                    <td className="row-header">{floor.floorName}</td>
                    {allUsageCodes.map((code) => {
                      const breakdown = getBreakdown(floor.floorId, code);
                      if (breakdown && breakdown.buildingCommonByFloor) {
                        // この階の用途の合計 = 専有 + 階共用 + この階からの建物共用按分 + グループ共用按分（全グループから）
                        const buildingCommonFromThisFloor = breakdown.buildingCommonByFloor.get(floor.floorId) || 0;
                        
                        const totalForThisFloor = 
                          breakdown.exclusiveArea +
                          breakdown.floorCommonArea +
                          buildingCommonFromThisFloor +
                          breakdown.usageGroupCommonArea;
                        return (
                          <td key={code} className="data-cell total-cell">
                            <strong>{totalForThisFloor.toFixed(2)}</strong>
                          </td>
                        );
                      } else if (breakdown) {
                        // buildingCommonByFloorがない場合（その階に建物共用部がない）
                        const totalForThisFloor = 
                          breakdown.exclusiveArea +
                          breakdown.floorCommonArea +
                          breakdown.usageGroupCommonArea;
                        return (
                          <td key={code} className="data-cell total-cell">
                            <strong>{totalForThisFloor.toFixed(2)}</strong>
                          </td>
                        );
                      }
                      
                      // その階にその用途が存在しない場合
                      // でも、他の階の建物共用部やグループ共用部から按分を受けている可能性がある
                      const allBreakdowns = floorResults.flatMap(f => f.usageBreakdowns);
                      const usageBreakdown = allBreakdowns.find(b => b.annexedCode === code);
                      
                      let totalFromOtherSources = 0;
                      
                      // 建物共用部: この階から他の用途への按分
                      if (usageBreakdown && usageBreakdown.buildingCommonByFloor) {
                        const buildingCommonFromThisFloor = usageBreakdown.buildingCommonByFloor.get(floor.floorId) || 0;
                        totalFromOtherSources += buildingCommonFromThisFloor;
                      }
                      
                      // グループ共用部: 全グループからの按分（この階にその用途がなくても受け取る可能性がある）
                      // 実際にはその階にその用途がない場合、グループ共用部も受け取らないはず
                      // （グループ共用部は用途が存在する階で計上される）
                      
                      if (totalFromOtherSources > 0) {
                        return (
                          <td key={code} className="data-cell total-cell">
                            <strong>{totalFromOtherSources.toFixed(2)}</strong>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={code} className="data-cell total-cell">
                          -
                        </td>
                      );
                    })}
                    <td className="row-total-cell">
                      <strong>{floorTotalAfterDistribution.toFixed(2)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
