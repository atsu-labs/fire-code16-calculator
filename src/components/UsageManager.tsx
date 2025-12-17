/**
 * UsageManager コンポーネント
 * 用途の追加・編集・削除を管理する
 */

import { useAppState } from '../contexts/useAppState';
import { useUsageActions } from '../contexts/UsageActions';
import { selectableBuildingUses, buildingUses } from '../types';
import '../styles/UsageManager.css';

interface UsageManagerProps {
  floorId: string;
}

export function UsageManager({ floorId }: UsageManagerProps) {
  const { state } = useAppState();
  const { addUsage, updateUsage, deleteUsage } = useUsageActions();

  const floor = state.building.floors.find((f) => f.id === floorId);
  if (!floor) return null;

  const handleAddUsage = async () => {
    const result = await addUsage(floorId, {
      annexedCode: selectableBuildingUses[0].code,
      annexedName: selectableBuildingUses[0].name,
      exclusiveArea: 0,
    });
    if (!result.success) {
      console.error('用途の追加に失敗:', result.error);
    }
  };

  const handleUsageCodeChange = async (usageId: string, newCode: string) => {
    const buildingUse = buildingUses.find((u) => u.code === newCode);
    if (!buildingUse) return;

    const result = await updateUsage(floorId, usageId, {
      annexedCode: buildingUse.code,
      annexedName: buildingUse.name,
    });
    if (!result.success) {
      console.error('用途の更新に失敗:', result.error);
    }
  };

  const handleUsageAreaChange = async (usageId: string, newArea: string) => {
    const area = parseFloat(newArea);
    if (isNaN(area)) return;
    
    const result = await updateUsage(floorId, usageId, { exclusiveArea: area });
    if (!result.success) {
      console.error('用途面積の更新に失敗:', result.error);
    }
  };

  const handleDeleteUsage = async (usageId: string) => {
    const result = await deleteUsage(floorId, usageId);
    if (!result.success) {
      console.error('用途の削除に失敗:', result.error);
    }
  };

  return (
    <div className="usage-manager">
      <div className="usage-manager-header">
        <h3>用途管理</h3>
        <button onClick={handleAddUsage} className="add-button">
          用途を追加
        </button>
      </div>
      <div className="usages-list">
        {floor.usages.map((usage) => (
          <div key={usage.id} className="usage-item">
            <div className="usage-input-group">
              <label htmlFor={`usage-code-${usage.id}`}>用途:</label>
              <select
                id={`usage-code-${usage.id}`}
                value={usage.annexedCode}
                onChange={(e) => handleUsageCodeChange(usage.id, e.target.value)}
                aria-label="用途名"
              >
                {selectableBuildingUses.map((use) => (
                  <option key={use.code} value={use.code}>
                    {use.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="usage-input-group">
              <label htmlFor={`usage-area-${usage.id}`}>面積 (m²):</label>
              <input
                id={`usage-area-${usage.id}`}
                type="number"
                value={usage.exclusiveArea}
                onChange={(e) => handleUsageAreaChange(usage.id, e.target.value)}
                min="0"
                step="0.01"
                aria-label="用途面積"
              />
            </div>
            <button
              onClick={() => handleDeleteUsage(usage.id)}
              className="delete-button"
              aria-label="削除"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
