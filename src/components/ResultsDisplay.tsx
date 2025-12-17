/**
 * ResultsDisplay コンポーネント
 * 計算結果の表示
 */

import { useAppState } from '../contexts/useAppState';
import { sortFloors } from '../utils/floorSorter';
import '../styles/ResultsDisplay.css';
import type { UsageAreaBreakdown } from '../types';

export function ResultsDisplay() {
  const { state } = useAppState();

  // 入力データから案分前の面積マトリックスを生成
  const renderInputMatrix = () => {
    const { floors } = state.building;

    if (floors.length === 0) {
      return (
        <div className="results-display empty">
          <p>階と用途を入力してください</p>
        </div>
      );
    }

    // 階をソート（非階 → 地上階 → 地階）
    const sortedFloors = sortFloors(floors);

    // 全用途コードを収集（重複なし、ソート済み）
    const allUsageCodes = Array.from(
      new Set(
        floors.flatMap((floor) =>
          floor.usages.map((usage) => usage.annexedCode)
        )
      )
    ).sort();

    // 用途コードから用途名を取得するマップ
    const usageCodeToName = new Map<string, string>();
    floors.forEach((floor) => {
      floor.usages.forEach((usage) => {
        usageCodeToName.set(usage.annexedCode, usage.annexedName);
      });
    });

    // 階と用途コードから専有面積を取得（同じ用途コードが複数ある場合は合計）
    const getExclusiveArea = (floorId: string, usageCode: string): number => {
      const floor = floors.find((f) => f.id === floorId);
      if (!floor) return 0;
      
      const usages = floor.usages.filter((u) => u.annexedCode === usageCode);
      return usages.reduce((sum, u) => sum + u.exclusiveArea, 0);
    };

    // 用途ごとの専有面積合計を計算
    const usageTotals = new Map<string, number>();
    allUsageCodes.forEach((code) => {
      const total = floors.reduce((sum, floor) => {
        return sum + getExclusiveArea(floor.id, code);
      }, 0);
      usageTotals.set(code, total);
    });

    // 各共用部の合計を計算
    const totalFloorCommon = floors.reduce(
      (sum, floor) => sum + floor.floorCommonArea,
      0
    );
    const totalBuildingCommon = floors.reduce(
      (sum, floor) => sum + floor.buildingCommonArea,
      0
    );
    const totalGroupCommon = floors.reduce(
      (sum, floor) => sum + floor.usageGroups.reduce((s, g) => s + g.commonArea, 0),
      0
    );

    // 全専有面積の合計
    const grandTotalExclusive = Array.from(usageTotals.values()).reduce((sum, val) => sum + val, 0);

    return (
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
              {sortedFloors.map((floor) => {
                // 各階の専有面積合計
                const floorExclusiveTotal = allUsageCodes.reduce((sum, code) => {
                  return sum + getExclusiveArea(floor.id, code);
                }, 0);
                
                // グループ共用部の合計
                const floorGroupCommonTotal = floor.usageGroups.reduce(
                  (sum, group) => sum + group.commonArea,
                  0
                );
                
                // 階の合計
                const floorTotal = 
                  floorExclusiveTotal +
                  floor.floorCommonArea +
                  floor.buildingCommonArea +
                  floorGroupCommonTotal;

                // 階種別に応じたクラス名を決定
                const floorTypeClass = floor.floorType === 'non-floor' 
                  ? 'non-floor' 
                  : floor.floorType === 'basement' 
                    ? 'basement' 
                    : 'above-ground';

                return (
                  <tr key={floor.id}>
                    <td className={`row-header ${floorTypeClass}`}>{floor.name}</td>
                    {allUsageCodes.map((code) => {
                      const area = getExclusiveArea(floor.id, code);
                      return (
                        <td key={code} className="data-cell">
                          {area > 0 ? area.toFixed(2) : '-'}
                        </td>
                      );
                    })}
                    <td className="total-cell">
                      {floor.floorCommonArea.toFixed(2)}
                    </td>
                    <td className="total-cell">
                      {floor.buildingCommonArea.toFixed(2)}
                    </td>
                    <td className="total-cell">
                      {floorGroupCommonTotal.toFixed(2)}
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
    );
  };

  // 計算結果がない場合は入力マトリックスのみ表示
  if (!state.calculationResults || state.calculationResults.floorResults.length === 0) {
    return (
      <div className="results-display">
        <h2>入力状況</h2>
        {renderInputMatrix()}
        <div className="calculation-prompt">
          <p>「計算実行」ボタンを押すと按分後の結果が表示されます</p>
        </div>
      </div>
    );
  }

  const { floorResults, buildingTotal, distributionTrace } = state.calculationResults;

  // floorResultsを元の階情報でソート（非階 → 地上階 → 地階）
  const sortedFloorResults = [...floorResults].sort((a, b) => {
    const floorA = state.building.floors.find(f => f.id === a.floorId);
    const floorB = state.building.floors.find(f => f.id === b.floorId);
    if (!floorA || !floorB) return 0;
    
    // sortFloorsの順序に従う
    const sortedFloors = sortFloors(state.building.floors);
    const indexA = sortedFloors.findIndex(f => f.id === a.floorId);
    const indexB = sortedFloors.findIndex(f => f.id === b.floorId);
    return indexA - indexB;
  });

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

  // 階と用途コードから内訳を取得するヘルパー（同じ用途コードが複数ある場合は合計）
  const getBreakdown = (floorId: string, usageCode: string): UsageAreaBreakdown | null => {
    const floor = floorResults.find((f) => f.floorId === floorId);
    if (!floor) return null;
    
    // 同じ用途コードの全ての内訳を取得
    const breakdowns = floor.usageBreakdowns.filter((b) => b.annexedCode === usageCode);
    if (breakdowns.length === 0) return null;
    if (breakdowns.length === 1) return breakdowns[0];
    
    // 複数ある場合は合計
    const combined: UsageAreaBreakdown = {
      usageId: breakdowns[0].usageId,
      annexedCode: usageCode,
      annexedName: breakdowns[0].annexedName,
      exclusiveArea: breakdowns.reduce((sum, b) => sum + b.exclusiveArea, 0),
      floorCommonArea: breakdowns.reduce((sum, b) => sum + b.floorCommonArea, 0),
      buildingCommonArea: breakdowns.reduce((sum, b) => sum + b.buildingCommonArea, 0),
      usageGroupCommonArea: breakdowns.reduce((sum, b) => sum + b.usageGroupCommonArea, 0),
      totalArea: breakdowns.reduce((sum, b) => sum + b.totalArea, 0),
    };
    return combined;
  };

  return (
    <div className="results-display">
      <h2>計算結果</h2>

      {/* 案分前マトリックス（入力データから直接表示） */}
      {renderInputMatrix()}

      {/* 案分後の合計面積（階別×用途別） */}
      <div className="matrix-section">
        <h3>案分後の合計面積（階別×用途別）</h3>
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5em', marginBottom: '1em' }}>
          ※各セルの値 = 専有面積 + 階共用部按分 + 建物共用部按分（全階から） + グループ共用部按分（全グループから）
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
              {sortedFloorResults.map((floor) => {
                // 階の合計 = この階の各用途の totalArea の合計
                const floorTotalAfterDistribution = allUsageCodes.reduce((sum, code) => {
                  const breakdown = getBreakdown(floor.floorId, code);
                  return sum + (breakdown ? breakdown.totalArea : 0);
                }, 0);

                // 階種別に応じたクラス名を決定
                const floorData = state.building.floors.find(f => f.id === floor.floorId);
                const floorTypeClass = floorData?.floorType === 'non-floor' 
                  ? 'non-floor' 
                  : floorData?.floorType === 'basement' 
                    ? 'basement' 
                    : 'above-ground';

                return (
                  <tr key={floor.floorId}>
                    <td className={`row-header ${floorTypeClass}`}>{floor.floorName}</td>
                    {allUsageCodes.map((code) => {
                      const breakdown = getBreakdown(floor.floorId, code);
                      if (breakdown) {
                        return (
                          <td key={code} className="data-cell total-cell">
                            <strong>{breakdown.totalArea.toFixed(2)}</strong>
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

      {/* 用途判定結果 */}
      {state.calculationResults?.usageClassification && (
        <div className="usage-classification">
          <h3>用途判定</h3>
          <div className="classification-result">
            <div className="classification-main">
              <strong className="classification-type">
                {state.calculationResults.usageClassification.displayName}
              </strong>
            </div>
            <div className="classification-details">
              {state.calculationResults.usageClassification.details.map((detail, index) => (
                <div key={index} className="classification-detail">
                  {detail}
                </div>
              ))}
            </div>
            {state.calculationResults.usageClassification.alternativeClassification && (
              <div className="classification-alternative">
                <div className="alternative-note">
                  ※ {state.calculationResults.usageClassification.alternativeClassification.note}
                </div>
                <div className="alternative-result">
                  <strong>
                    {state.calculationResults.usageClassification.alternativeClassification.displayName}
                  </strong>
                </div>
                <div className="alternative-details">
                  {state.calculationResults.usageClassification.alternativeClassification.details.map((detail, index) => (
                    <div key={index} className="classification-detail">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 按分経過表 */}
      {distributionTrace && (
        <>
          {/* 建物共用部の按分経過 */}
          {distributionTrace.buildingCommonTraces.length > 0 && (
            <div className="distribution-trace">
              <h3>建物共用部の按分経過</h3>
              {[...distributionTrace.buildingCommonTraces]
                .sort((a, b) => {
                  // 階IDでソート順を決定
                  const sortedFloors = sortFloors(state.building.floors);
                  const indexA = sortedFloors.findIndex(f => f.id === a.sourceFloorId);
                  const indexB = sortedFloors.findIndex(f => f.id === b.sourceFloorId);
                  return indexA - indexB;
                })
                .map((trace) => {
                // 用途コード（annexedCode）ごとにグループ化して合計を計算
                const usageGroups = new Map<string, {
                  annexedCode: string;
                  annexedName: string;
                  totalDistributed: number;
                }>();

                trace.distributions.forEach((dist) => {
                  const key = dist.annexedCode; // annexedCodeでグループ化
                  if (!usageGroups.has(key)) {
                    usageGroups.set(key, {
                      annexedCode: dist.annexedCode,
                      annexedName: dist.annexedName,
                      totalDistributed: 0,
                    });
                  }
                  const group = usageGroups.get(key)!;
                  group.totalDistributed += dist.distributedArea;
                });

                return (
                  <div key={trace.sourceFloorId} className="trace-section">
                    <h4>{trace.sourceFloorName}の建物共用部 {trace.totalArea.toFixed(2)} m²</h4>
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>用途</th>
                          <th>按分面積</th>
                          <th>按分比率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(usageGroups.values())
                          .sort((a, b) => a.annexedCode.localeCompare(b.annexedCode))
                          .map((group) => (
                            <tr key={group.annexedCode}>
                              <td>{group.annexedName}</td>
                              <td>{group.totalDistributed.toFixed(2)} m²</td>
                              <td>{((group.totalDistributed / trace.totalArea) * 100).toFixed(2)}%</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* グループ共用部の按分経過 */}
          {distributionTrace.usageGroupTraces.length > 0 && (
            <div className="distribution-trace">
              <h3>グループ共用部の按分経過</h3>
              {[...distributionTrace.usageGroupTraces]
                .sort((a, b) => {
                  // 階IDでソート順を決定（groupFloorIdを使用）
                  const sortedFloors = sortFloors(state.building.floors);
                  const indexA = sortedFloors.findIndex(f => f.id === a.groupFloorId);
                  const indexB = sortedFloors.findIndex(f => f.id === b.groupFloorId);
                  return indexA - indexB;
                })
                .map((trace) => {
                // 用途コード（annexedCode）ごとにグループ化して合計を計算
                const usageGroups = new Map<string, {
                  annexedCode: string;
                  annexedName: string;
                  totalDistributed: number;
                }>();

                trace.distributions.forEach((dist) => {
                  const key = dist.annexedCode; // annexedCodeでグループ化
                  if (!usageGroups.has(key)) {
                    usageGroups.set(key, {
                      annexedCode: dist.annexedCode,
                      annexedName: dist.annexedName,
                      totalDistributed: 0,
                    });
                  }
                  const group = usageGroups.get(key)!;
                  group.totalDistributed += dist.distributedArea;
                });

                return (
                  <div key={trace.groupId} className="trace-section">
                    <h4>{trace.groupFloorName}のグループ共用部 {trace.totalArea.toFixed(2)} m²</h4>
                    <table className="result-table">
                      <thead>
                        <tr>
                          <th>用途</th>
                          <th>按分面積</th>
                          <th>按分比率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(usageGroups.values())
                          .sort((a, b) => a.annexedCode.localeCompare(b.annexedCode))
                          .map((group) => (
                            <tr key={group.annexedCode}>
                              <td>{group.annexedName}</td>
                              <td>{group.totalDistributed.toFixed(2)} m²</td>
                              <td>{((group.totalDistributed / trace.totalArea) * 100).toFixed(2)}%</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
