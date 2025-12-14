/**
 * BuildingCommonAreaInput コンポーネント
 * 建物全体の共用部面積入力（各階ごと）
 */

import { useAppState } from '../contexts/useAppState';
import '../styles/BuildingCommonAreaInput.css';

interface BuildingCommonAreaInputProps {
  floorId: string;
}

export function BuildingCommonAreaInput({ floorId }: BuildingCommonAreaInputProps) {
  const { state, dispatch } = useAppState();
  
  const floor = state.building.floors.find((f) => f.id === floorId);
  if (!floor) return null;

  const handleBuildingCommonAreaChange = (value: string) => {
    // 空文字列の場合は0にリセット
    const area = value === '' ? 0 : parseFloat(value);
    if (isNaN(area) || area < 0) return;
    
    dispatch({
      type: 'UPDATE_FLOOR',
      payload: { 
        floorId, 
        updates: { buildingCommonArea: area } 
      },
    });
  };

  return (
    <div className="building-common-area-input">
      <div className="input-group">
        <label htmlFor={`building-common-area-${floorId}`}>建物全体共用部面積 (m²):</label>
        <input
          id={`building-common-area-${floorId}`}
          type="number"
          value={floor.buildingCommonArea}
          onChange={(e) => handleBuildingCommonAreaChange(e.target.value)}
          min="0"
          step="0.01"
          aria-label="建物全体共用部面積"
        />
        <span className="hint">この階にある建物全体の共用部（エントランス、設備室、機械室等）</span>
      </div>
    </div>
  );
}
