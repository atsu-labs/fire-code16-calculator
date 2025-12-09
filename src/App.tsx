/**
 * メインアプリケーションコンポーネント
 * 消防法に基づく建物用途別面積計算機
 */

import { AppStateProvider, useAppState } from './contexts';
import { FloorManager } from './components/FloorManager';
import { UsageManager } from './components/UsageManager';
import { CommonAreaInputs } from './components/CommonAreaInputs';
import { UsageGroupSelector } from './components/UsageGroupSelector';
import { ResultsDisplay } from './components/ResultsDisplay';
import { AppControls } from './components/AppControls';
import './App.css';

function AppContent() {
  const { state } = useAppState();

  return (
    <div className="app">
      <header className="app-header">
        <h1>消防法 用途別面積計算機</h1>
        <p>建物の階ごとに用途と面積を入力し、共用部の按分計算を行います</p>
      </header>

      <AppControls />

      <main className="app-main">
        <section className="input-section">
          <FloorManager />
          
          {state.building.floors.map((floor) => {
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

            return (
              <div key={floor.id} className="floor-section">
                <h3 className="floor-title">
                  <span className="floor-name">{floor.name}</span>
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
