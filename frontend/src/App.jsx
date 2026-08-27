import React from 'react';
import MapView from './components/map/MapView';
import GodModeConsole from './components/console/GodModeConsole';
import StatsBar from './components/stats/StatsBar';
import ExportPanel from './components/export/ExportPanel';
import BeforeAfterSlider from './components/slider/BeforeAfterSlider';
import useMapStore from './store/useMapStore';

/**
 * Main application layout
 * Divides screen into map (left/background) and agent console (right panel)
 * Bottom bar for stats and export actions.
 */
function App() {
  const isInterventionActive = useMapStore(state => state.interventionResults !== null);

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-shade-dark text-white overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-row relative h-[calc(100vh-64px)]">
        
        {/* Left/Center: Map View */}
        <div className="flex-1 relative">
          {isInterventionActive ? (
            <BeforeAfterSlider />
          ) : (
            <MapView />
          )}
        </div>

        {/* Right: God Mode Agent Console */}
        <div className="w-[450px] border-l border-shade-border bg-shade-panel z-10 shadow-2xl flex flex-col">
          <GodModeConsole />
        </div>

      </div>

      {/* Bottom Bar: Stats & Actions */}
      <div className="h-16 border-t border-shade-border bg-shade-panel flex items-center justify-between px-4 z-20 shrink-0">
        <StatsBar />
        <ExportPanel />
      </div>

    </div>
  );
}

export default App;
