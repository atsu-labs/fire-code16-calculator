/**
 * CommonAreaInputs コンポーネント
 * 階共用部の面積入力
 */

import { useAppState } from '../contexts/useAppState';
import { useFloorActions } from '../contexts/FloorActions';
import '../styles/CommonAreaInputs.css';

interface CommonAreaInputsProps {
  floorId: string;
}

export function CommonAreaInputs({ floorId }: CommonAreaInputsProps) {
  const { state } = useAppState();
  const { updateFloor } = useFloorActions();

  const floor = state.building.floors.find((f) => f.id === floorId);
  if (!floor) return null;

  const handleFloorCommonAreaChange = async (value: string) => {
    // 空文字列の場合は0にリセット
    const area = value === '' ? 0 : parseFloat(value);
    if (isNaN(area)) return;
    
    const result = await updateFloor(floorId, { floorCommonArea: area });
    if (!result.success) {
      console.error('階共用部面積の更新に失敗:', result.error);
    }
  };

  const handleBuildingCommonAreaChange = async (value: string) => {
    // 空文字列の場合は0にリセット
    const area = value === '' ? 0 : parseFloat(value);
    if (isNaN(area)) return;
    
    const result = await updateFloor(floorId, { buildingCommonArea: area });
    if (!result.success) {
      console.error('建物全体共用部面積の更新に失敗:', result.error);
    }
  };

  return (
    <div className="common-area-inputs">
      <h4>共用部面積</h4>
      <div className="input-row">
        <div className="input-group">
          <label htmlFor={`floor-common-${floorId}`}>階共用部 (m²):</label>
          <input
            id={`floor-common-${floorId}`}
            type="number"
            value={floor.floorCommonArea}
            onChange={(e) => handleFloorCommonAreaChange(e.target.value)}
            min="0"
            step="0.01"
            aria-label="階共用部面積"
          />
          <span className="hint">この階内の共用部分（廊下、階段等）</span>
        </div>
        <div className="input-group">
          <label htmlFor={`building-common-${floorId}`}>建物全体共用部 (m²):</label>
          <input
            id={`building-common-${floorId}`}
            type="number"
            value={floor.buildingCommonArea}
            onChange={(e) => handleBuildingCommonAreaChange(e.target.value)}
            min="0"
            step="0.01"
            aria-label="建物全体共用部面積"
          />
          <span className="hint">この階にある建物全体の共用部（エントランス、設備室、エレベーター等）</span>
        </div>
      </div>
    </div>
  );
}
