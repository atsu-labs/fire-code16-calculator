/**
 * メインアプリケーションコンポーネント
 * 消防法に基づく建物用途別面積計算機
 */

import { useState, useEffect, useMemo } from 'react';
import { AppStateProvider, useAppState } from './contexts';
import { useFloorActions } from './contexts/FloorActions';
import { FloorManager } from './components/FloorManager';
import { UsageManager } from './components/UsageManager';
import { CommonAreaInputs } from './components/CommonAreaInputs';
import { UsageGroupSelector } from './components/UsageGroupSelector';
import { ResultsDisplay } from './components/ResultsDisplay';
import { AppControls } from './components/AppControls';
import { sortFloors } from './utils/floorSorter';
import './App.css';

function AppContent() {
  const { state } = useAppState();
  const { copyFloorData, updateFloorName } = useFloorActions();
  const [copyingFloorId, setCopyingFloorId] = useState<string | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingFloorName, setEditingFloorName] = useState<string>('');

  // 階をソート（非階 → 地上階 → 地階）
  const sortedFloors = useMemo(() => sortFloors(state.building.floors), [state.building.floors]);

  // 初期ロード時にスクロール位置を最上部に固定
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-left">
            <h1>消防法 用途別面積計算機</h1>
            <p>建物の階ごとに用途と面積を入力し、共用部の按分計算を行います</p>
          </div>
          <div className="header-right">
            <AppControls />
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="input-section">
          <FloorManager />
          
          {sortedFloors.map((floor) => {
            // この階の専用部面積の合計を計算
            const totalExclusiveArea = floor.usages.reduce(
              (sum, usage) => sum + usage.exclusiveArea,
              0
            );
            // グループ共用部面積の合計を計算
            const totalGroupCommonArea = floor.usageGroups.reduce(
              (sum, group) => sum + group.commonArea,
              0
            );
            // 全ての面積を合計
            const totalArea = totalExclusiveArea + floor.floorCommonArea + floor.buildingCommonArea + totalGroupCommonArea;

            const hasData = floor.usages.length > 0 || 
                           floor.floorCommonArea > 0 || 
                           floor.buildingCommonArea > 0 || 
                           floor.usageGroups.length > 0;

            const handleCopyClick = () => {
              if (copyingFloorId === floor.id) {
                // キャンセル
                setCopyingFloorId(null);
              } else {
                // コピーモード開始
                setCopyingFloorId(floor.id);
              }
            };

            const handlePasteClick = async () => {
              if (!copyingFloorId) return;
              
              const confirmed = window.confirm(
                `${state.building.floors.find((f) => f.id === copyingFloorId)?.name}の内容を${floor.name}にコピーしますか?\n\n※${floor.name}の既存データは上書きされます`
              );
              
              if (confirmed) {
                await copyFloorData(copyingFloorId, floor.id);
                setCopyingFloorId(null);
              }
            };

            // 非階の名前編集ハンドラ
            const handleEditStart = () => {
              if (floor.floorType === 'non-floor') {
                setEditingFloorId(floor.id);
                setEditingFloorName(floor.name);
              }
            };

            const handleEditSave = async () => {
              if (!editingFloorName.trim()) {
                alert('階名を入力してください');
                return;
              }

              const result = await updateFloorName(floor.id, editingFloorName);
              if (result.success) {
                setEditingFloorId(null);
                setEditingFloorName('');
              } else {
                alert(result.error.message);
              }
            };

            const handleEditCancel = () => {
              setEditingFloorId(null);
              setEditingFloorName('');
            };

            const handleEditKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                handleEditSave();
              } else if (e.key === 'Escape') {
                handleEditCancel();
              }
            };

            // 階種別に応じたクラス名を決定
            const floorTypeClass = floor.floorType === 'non-floor' 
              ? 'non-floor' 
              : floor.floorType === 'basement' 
                ? 'basement' 
                : 'above-ground';

            return (
              <div key={floor.id} className={`floor-section ${floorTypeClass}`}>
                <h3 className="floor-title">
                  {editingFloorId === floor.id ? (
                    <span className="floor-name-edit">
                      <input
                        type="text"
                        value={editingFloorName}
                        onChange={(e) => setEditingFloorName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={handleEditSave}
                        autoFocus
                        className="floor-name-input"
                      />
                    </span>
                  ) : (
                    <span 
                      className={`floor-name ${floor.floorType === 'non-floor' ? 'editable' : ''}`}
                      onClick={handleEditStart}
                      onDoubleClick={handleEditStart}
                      title={floor.floorType === 'non-floor' ? 'クリックして名前を編集' : ''}
                    >
                      {floor.name}
                      {floor.floorType === 'non-floor' && <span className="edit-icon">✏️</span>}
                    </span>
                  )}
                  <span className="floor-actions">
                    {copyingFloorId === floor.id ? (
                      <button
                        className="floor-copy-btn copying"
                        onClick={handleCopyClick}
                        title="コピーをキャンセル"
                      >
                        📋 キャンセル
                      </button>
                    ) : copyingFloorId ? (
                      <button
                        className="floor-paste-btn"
                        onClick={handlePasteClick}
                        title={`${state.building.floors.find((f) => f.id === copyingFloorId)?.name}の内容を貼り付け`}
                      >
                        📥 貼り付け
                      </button>
                    ) : (
                      <button
                        className="floor-copy-btn"
                        onClick={handleCopyClick}
                        disabled={!hasData}
                        title={hasData ? 'この階の内容をコピー' : 'コピーするデータがありません'}
                      >
                        📋 コピー
                      </button>
                    )}
                  </span>
                  <span className="floor-total-area">
                    合計: {totalArea.toFixed(2)} m²
                  </span>
                </h3>
                <UsageManager floorId={floor.id} />
                <CommonAreaInputs floorId={floor.id} />
                <UsageGroupSelector floorId={floor.id} />
              </div>
            );
          })}
        </section>

        <section className="results-section">
          <ResultsDisplay />
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
