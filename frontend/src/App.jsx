import React from 'react';
import MapView from './components/map/MapView';
import GodModeConsole from './components/console/GodModeConsole';
import StatsBar from './components/stats/StatsBar';
import ExportPanel from './components/export/ExportPanel';
import BeforeAfterSlider from './components/slider/BeforeAfterSlider';
import useMapStore from './store/useMapStore';

/**
 * Main application layout
 * Full viewport 3D twin with floating collapsible Co-pilot console and live stats HUD.
 */
function App() {
  const isInterventionActive = useMapStore(state => state.interventionResults !== null);

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-black text-white overflow-hidden select-none">
      
      {/* Main Viewport (Full Screen 3D Twin & Overlays) */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {isInterventionActive ? (
          <BeforeAfterSlider />
        ) : (
          <MapView />
        )}

        {/* Floating Collapsible Co-Pilot Console */}
        <GodModeConsole />
      </div>

      {/* Bottom HUD Bar: Live Metrics & Municipal Exports */}
      <div className="h-16 border-t border-cyan-500/30 bg-black/90 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
        <StatsBar />
        <ExportPanel />
      </div>

    </div>
  );
}

export default App;
