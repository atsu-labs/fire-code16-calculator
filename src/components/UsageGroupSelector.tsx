/**
 * UsageGroupSelector コンポーネント
 * 各階のグループ共用部の選択と管理（建物全体の用途から選択可能、その階に存在しない用途も含む）
 */

import { useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useUsageGroupActions } from '../contexts/UsageGroupActions';
import '../styles/UsageGroupSelector.css';

interface UsageGroupSelectorProps {
  floorId: string;
}

export function UsageGroupSelector({ floorId }: UsageGroupSelectorProps) {
  const { state } = useAppState();
  const { addUsageGroup, deleteUsageGroup } = useUsageGroupActions();
  const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
  const [commonArea, setCommonArea] = useState<string>('0');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // この階を取得
  const currentFloor = state.building.floors.find((f) => f.id === floorId);
  if (!currentFloor) return null;

  // 建物全体の全用途を取得
  const allUsages = state.building.floors.flatMap((floor) =>
    floor.usages.map((usage) => ({
      ...usage,
      floorId: floor.id,
      floorName: floor.name,
    }))
  );

  // 用途コードでグループ化してユニークな用途のみを取得
  const uniqueUsagesByCode = new Map<string, typeof allUsages[0]>();
  allUsages.forEach((usage) => {
    if (!uniqueUsagesByCode.has(usage.annexedCode)) {
      uniqueUsagesByCode.set(usage.annexedCode, usage);
    }
  });
  const uniqueUsages = Array.from(uniqueUsagesByCode.values());

  // ユニークな用途が3つ未満の場合は表示しない
  if (uniqueUsages.length < 3) return null;

  // 用途コード単位での選択/解除を処理
  const handleUsageCodeToggle = (annexedCode: string) => {
    // この用途コードに該当するすべてのusageIdを取得
    const usageIdsForCode = allUsages
      .filter((u) => u.annexedCode === annexedCode)
      .map((u) => u.id);
    
    // すでに選択されているかチェック（一つでも選択されていれば選択状態）
    const isSelected = usageIdsForCode.some((id) => selectedUsages.includes(id));
    
    if (isSelected) {
      // 解除：この用途コードの全usageIdを削除
      setSelectedUsages((prev) => prev.filter((id) => !usageIdsForCode.includes(id)));
    } else {
      // 選択：この用途コードの全usageIdを追加
      setSelectedUsages((prev) => [...prev, ...usageIdsForCode]);
    }
  };

  // 用途コードが選択されているかチェック
  const isUsageCodeSelected = (annexedCode: string) => {
    const usageIdsForCode = allUsages
      .filter((u) => u.annexedCode === annexedCode)
      .map((u) => u.id);
    return usageIdsForCode.some((id) => selectedUsages.includes(id));
  };

  const handleAddGroup = async () => {
    if (selectedUsages.length < 2) {
      alert('2つ以上の用途を選択してください');
      return;
    }
    
    // 選択されている用途コードの数を計算
    const selectedUsageCodes = new Set(
      selectedUsages.map((id) => {
        const usage = allUsages.find((u) => u.id === id);
        return usage?.annexedCode;
      }).filter(Boolean)
    );
    
    if (selectedUsageCodes.size === uniqueUsages.length) {
      alert('すべての用途は選択できません（全用途の場合は建物全体の共用部を使用してください）');
      return;
    }

    const area = parseFloat(commonArea);
    if (isNaN(area) || area < 0) {
      alert('共用部面積を正しく入力してください');
      return;
    }

    const result = await addUsageGroup(floorId, selectedUsages, area);
    if (result.success) {
      setSelectedUsages([]);
      setCommonArea('0');
    } else {
      alert(result.error.message);
      console.error('用途グループの追加に失敗:', result.error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const result = await deleteUsageGroup(floorId, groupId);
    if (!result.success) {
      console.error('用途グループの削除に失敗:', result.error);
    }
  };

  return (
    <div className="usage-group-selector">
      <div className="usage-group-header">
        <h4>この階のグループ共用部</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="toggle-button"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'グループ共用部を折り畳む' : 'グループ共用部を展開する'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <p className="description">
            建物全体の任意の用途（2つ以上、全用途未満）を選択してグループを作成できます。
          </p>
          
          <div className="group-creation">
            <p className="instruction">
              2つ以上の用途を選択してグループを作成（全用途は選択不可）
            </p>
            <div className="usage-checkboxes">
              {uniqueUsages.map((usage) => (
                <label key={usage.annexedCode} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isUsageCodeSelected(usage.annexedCode)}
                    onChange={() => handleUsageCodeToggle(usage.annexedCode)}
                    aria-label={`${usage.annexedName}を選択`}
                  />
                  <span>{usage.annexedName}</span>
                </label>
              ))}
            </div>
            <div className="common-area-input">
              <label htmlFor={`group-common-area-${floorId}`}>
                グループ共用部面積 (m²):
              </label>
              <input
                id={`group-common-area-${floorId}`}
                type="number"
                value={commonArea}
                onChange={(e) => setCommonArea(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <button
              onClick={handleAddGroup}
              className="add-group-button"
              disabled={(() => {
                // 選択されている用途コードの数を計算
                const selectedUsageCodes = new Set(
                  selectedUsages.map((id) => {
                    const usage = allUsages.find((u) => u.id === id);
                    return usage?.annexedCode;
                  }).filter(Boolean)
                );
                return selectedUsages.length < 2 || selectedUsageCodes.size === uniqueUsages.length;
              })()}
            >
              グループを追加
            </button>
          </div>

          {currentFloor.usageGroups.length > 0 && (
            <div className="existing-groups">
              <h5>この階の既存グループ</h5>
              {currentFloor.usageGroups.map((group) => {
                // グループ内の用途情報を取得（階名を含む）
                const groupUsageDetails = group.usageIds
                  .map((id) => {
                    const usageWithFloor = allUsages.find((u) => u.id === id);
                    return usageWithFloor
                      ? `${usageWithFloor.floorName} - ${usageWithFloor.annexedName}`
                      : null;
                  })
                  .filter(Boolean);

                return (
                  <div key={group.id} className="group-item">
                    <span className="group-usages">
                      {groupUsageDetails.join(', ')}
                    </span>
                    <span className="group-area">{group.commonArea.toFixed(2)} m²</span>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="delete-button"
                      aria-label="グループを削除"
                    >
                      削除
                    </button>
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
