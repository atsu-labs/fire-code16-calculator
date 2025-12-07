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
          
          {state.building.floors.map((floor) => (
            <div key={floor.id} className="floor-section">
              <h3 className="floor-title">{floor.name}</h3>
              <UsageManager floorId={floor.id} />
              <CommonAreaInputs floorId={floor.id} />
              <UsageGroupSelector floorId={floor.id} />
            </div>
          ))}
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
