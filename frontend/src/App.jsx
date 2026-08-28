import React, { useState } from 'react';
import TopCommandBar from './components/navigation/TopCommandBar';
import MapView from './components/map/MapView';
import GodModeConsole from './components/console/GodModeConsole';
import StatsBar from './components/stats/StatsBar';
import ExportPanel from './components/export/ExportPanel';
import CoolRouteModal from './components/navigation/CoolRouteModal';
import HealthImpactModal from './components/stats/HealthImpactModal';
import GeoJSONPreview from './components/export/GeoJSONPreview';
import SMSPreview from './components/export/SMSPreview';

/**
 * Main SHADE Application Layout (Palantir/Linear Class Spatial Architecture)
 * Unified Top Command Bar + Full-Screen 3D Twin + Slide-over Co-Pilot + Centered Modals
 */
function App() {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [showCoolRoute, setShowCoolRoute] = useState(false);
  const [showHealthStudy, setShowHealthStudy] = useState(false);
  const [showGeoJSON, setShowGeoJSON] = useState(false);
  const [showSMS, setShowSMS] = useState(false);
  const [activeRouteData, setActiveRouteData] = useState(null);

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-black text-white overflow-hidden select-none">
      
      {/* 1. Unified Top Command Bar */}
      <TopCommandBar 
        onOpenCoolRoute={() => setShowCoolRoute(true)}
        onOpenHealthStudy={() => setShowHealthStudy(true)}
        isConsoleOpen={isConsoleOpen}
        onToggleConsole={() => setIsConsoleOpen(!isConsoleOpen)}
      />

      {/* 2. Full-Screen 3D Twin Viewport */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-black">
        <MapView activeRouteData={activeRouteData} />

        {/* Slide-over Co-Pilot AI Drawer */}
        <GodModeConsole 
          isOpen={isConsoleOpen} 
          onClose={() => setIsConsoleOpen(false)} 
        />
      </main>

      {/* 3. Bottom Telemetry & Action HUD */}
      <footer className="h-14 border-t border-cyan-500/30 bg-black/90 backdrop-blur-2xl flex items-center justify-between px-6 z-30 shrink-0">
        <StatsBar />
        <ExportPanel 
          onOpenGeoJSON={() => setShowGeoJSON(true)}
          onOpenSMS={() => setShowSMS(true)}
        />
      </footer>

      {/* 4. Centered High-Z-Index Modals */}
      {showCoolRoute && (
        <CoolRouteModal 
          onClose={() => setShowCoolRoute(false)}
          onRouteCalculated={(data) => setActiveRouteData(data)}
        />
      )}

      {showHealthStudy && (
        <HealthImpactModal onClose={() => setShowHealthStudy(false)} />
      )}

      {showGeoJSON && (
        <GeoJSONPreview onClose={() => setShowGeoJSON(false)} />
      )}

      {showSMS && (
        <SMSPreview onClose={() => setShowSMS(false)} />
      )}

    </div>
  );
}

export default App;
