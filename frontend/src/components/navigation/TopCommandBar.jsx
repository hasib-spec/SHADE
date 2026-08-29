import React, { useState, useEffect } from 'react';
import useMapStore from '../../store/useMapStore';
import { useAgentStore } from '../../store/useAgentStore';
import { 
  FiShield, 
  FiPlay, 
  FiPause, 
  FiClock, 
  FiBox, 
  FiLayers, 
  FiSun, 
  FiThermometer, 
  FiNavigation, 
  FiActivity, 
  FiMessageSquare,
  FiAlertTriangle,
  FiMapPin,
  FiSearch
} from 'react-icons/fi';

export default function TopCommandBar({ 
  onOpenCoolRoute, 
  onOpenHealthStudy, 
  isConsoleOpen, 
  onToggleConsole 
}) {
  const { 
    selectedDistrict, 
    setSelectedDistrict,
    currentLocationMeta,
    viewMode, 
    setViewMode, 
    temperatureMode, 
    setTemperatureMode,
    selectedHour,
    setSelectedHour,
    gridData 
  } = useMapStore();

  const { sendMessage } = useAgentStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Autoplay diurnal simulation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        const nextH = selectedHour >= 18 ? 6 : selectedHour + 1;
        setSelectedHour(nextH);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedHour]);

  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${period}`;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    sendMessage(`CHECK WEATHER IN ${searchInput.trim()} AND ANALYZE HEAT RISK`);
    setSearchInput('');
    setIsSearchOpen(false);
  };

  const isMaryvale = selectedDistrict.toLowerCase().includes('maryvale');
  const isArcadia = selectedDistrict.toLowerCase().includes('arcadia');
  const isCustomLocation = !isMaryvale && !isArcadia;

  // Calculate current peak temp from active grid
  const currentMaxTemp = gridData && gridData.length > 0 
    ? Math.max(...gridData.map(c => Number(c.temp_2m) || 35.0)).toFixed(1)
    : '42.0';

  const isPeakHour = selectedHour >= 14 && selectedHour <= 16;

  return (
    <header className="h-14 w-full bg-[#08090D]/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 flex items-center justify-between z-30 font-mono text-xs text-gray-200 select-none shadow-2xl shrink-0">
      
      {/* 1. Left: Brand & Dynamic District / Location Switcher */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-300/30">
            <FiShield size={17} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-sm tracking-wider text-white">SHADE</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/40">20m² TWIN</span>
            </div>
            <span className="text-[9px] text-gray-400 tracking-tight leading-none block mt-0.5">Street Heat Action & Decision Engine</span>
          </div>
        </div>

        {/* Dynamic Location Switcher */}
        <div className="flex items-center bg-[#050608]/80 p-1 rounded-xl border border-white/[0.08] shadow-inner gap-1">
          <button
            onClick={() => setSelectedDistrict('Maryvale')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] ${
              isMaryvale
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-900/40 border border-red-400/50'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Maryvale: SVI 0.94 (High Vulnerability), Canopy 5.8%"
          >
            <span className={`w-2 h-2 rounded-full ${isMaryvale ? 'bg-red-300 animate-ping' : 'bg-red-500'}`}></span>
            <span>Maryvale</span>
          </button>

          <button
            onClick={() => setSelectedDistrict('Arcadia')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] ${
              isArcadia
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/50'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Arcadia: SVI 0.17 (Control Baseline), Canopy 32.1%"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Arcadia</span>
          </button>

          {/* Active Global Location Pin (e.g. Jauharabad, Pakistan, London, etc.) */}
          {isCustomLocation && (
            <div className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 text-[11px] bg-gradient-to-r from-cyan-600 to-blue-700 text-white border border-cyan-400/60 shadow-lg shadow-cyan-900/40 animate-in fade-in">
              <FiMapPin size={11} className="text-cyan-200 animate-bounce" />
              <span className="max-w-[140px] truncate">{selectedDistrict}</span>
            </div>
          )}

          {/* Quick City Search Input Trigger */}
          <div className="relative">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Enter any global city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                  className="bg-black border border-cyan-400 px-2 py-0.5 rounded text-[11px] text-white outline-none w-36 font-sans"
                  onBlur={() => !searchInput && setIsSearchOpen(false)}
                />
                <button type="submit" className="p-1 bg-cyan-600 rounded hover:bg-cyan-500 text-white">
                  <FiSearch size={11} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1 text-gray-400 hover:text-cyan-300 hover:bg-white/10 rounded transition-colors"
                title="Search any global city or coordinates"
              >
                <FiSearch size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Center: 12-Hour Heatwave Diurnal Timeline Scrubber */}
      <div className="flex items-center gap-3 bg-[#050608]/80 px-4 py-1.5 rounded-xl border border-white/[0.08] shadow-inner">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-bold text-[11px] ${
            isPlaying 
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-500/30' 
              : 'bg-white/[0.05] hover:bg-white/[0.1] text-cyan-300 border-white/[0.1]'
          }`}
          title="Play / Pause 12-Hour Diurnal Cycle Simulation"
        >
          {isPlaying ? <FiPause size={12} /> : <FiPlay size={12} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="flex items-center gap-1.5 min-w-[85px] text-cyan-300 font-bold text-xs tabular-nums">
          <FiClock size={13} className="text-cyan-400" />
          <span>{formatHour(selectedHour)}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[9px] text-gray-500 font-semibold uppercase">6 AM</span>
          <input 
            type="range" 
            min="6" 
            max="18" 
            step="1"
            value={selectedHour}
            onChange={(e) => setSelectedHour(Number(e.target.value))}
            className="w-36 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[9px] text-gray-500 font-semibold uppercase">6 PM</span>
        </div>

        {isPeakHour ? (
          <div className="flex items-center gap-1.5 bg-red-950/90 text-red-300 border border-red-500/60 px-2.5 py-0.5 rounded-md animate-pulse text-[10px] font-bold shadow-md shadow-red-950/50">
            <FiAlertTriangle size={12} className="text-red-400" />
            <span>{currentMaxTemp}°C PEAK</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 px-2.5 py-0.5 rounded-md text-[10px] font-medium">
            <FiSun size={12} className="text-amber-400" />
            <span>{currentMaxTemp}°C Max</span>
          </div>
        )}
      </div>

      {/* 3. Right: View Modes, Metric Toggles, Track Tools & Co-Pilot */}
      <div className="flex items-center gap-2.5">
        
        {/* Layer View Mode */}
        <div className="flex items-center bg-[#050608]/80 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setViewMode('3d_hex')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-[11px] ${
              viewMode === '3d_hex' 
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30' 
                : 'text-gray-400 hover:text-white'
            }`}
            title="3D Extruded Heat Prisms"
          >
            <FiBox size={13} />
            <span>3D</span>
          </button>

          <button
            onClick={() => setViewMode('20m_cells')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-[11px] ${
              viewMode === '20m_cells' 
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30' 
                : 'text-gray-400 hover:text-white'
            }`}
            title="20m² Flat Grid Mesh"
          >
            <FiLayers size={13} />
            <span>Grid</span>
          </button>

          <button
            onClick={() => setViewMode('2m_plane')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-[11px] ${
              viewMode === '2m_plane' 
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/30' 
                : 'text-gray-400 hover:text-white'
            }`}
            title="2m Pedestrian Measurement Plane (FortyGuard Principle)"
          >
            <span className="text-emerald-400 font-bold">2m</span>
            <span>Plane</span>
          </button>
        </div>

        {/* Temperature Mode */}
        <div className="flex items-center bg-[#050608]/80 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setTemperatureMode(temperatureMode === 'air_temp' ? 'mrt_perceived' : 'air_temp')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-bold ${
              temperatureMode === 'air_temp' ? 'text-amber-300 hover:text-amber-200' : 'text-purple-300 hover:text-purple-200'
            }`}
            title="Toggle Air Temp @ 2m vs Mean Radiant Temperature (MRT)"
          >
            {temperatureMode === 'air_temp' ? <FiThermometer size={13} className="text-amber-400" /> : <FiSun size={13} className="text-purple-400" />}
            <span>{temperatureMode === 'air_temp' ? '2m Air' : 'MRT Solar'}</span>
          </button>
        </div>

        {/* Track 1 Showcase Button */}
        <button
          onClick={onOpenCoolRoute}
          className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 shadow-md shadow-emerald-950/50 text-[11px]"
          title="Track 1: Hyperlocal Cool-Route Pedestrian Navigation"
        >
          <FiNavigation size={13} className="text-emerald-400" />
          <span>Cool-Route</span>
        </button>

        {/* Track 7 Showcase Button */}
        <button
          onClick={onOpenHealthStudy}
          className="px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-500/50 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 shadow-md shadow-purple-950/50 text-[11px]"
          title="Track 7: Epidemiological Health Correlation & Municipal ROI Study"
        >
          <FiActivity size={13} className="text-purple-400" />
          <span>Health ROI</span>
        </button>

        {/* Co-Pilot AI Drawer Toggle */}
        <button
          onClick={onToggleConsole}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all text-xs border ${
            isConsoleOpen
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-laser-cyan'
              : 'bg-[#050608]/90 text-cyan-300 border-cyan-600/50 hover:bg-cyan-950/60'
          }`}
          title="Toggle SHADE Co-Pilot AI Assistant"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <FiMessageSquare size={14} />
          <span>Co-Pilot</span>
        </button>

      </div>

    </header>
  );
}
