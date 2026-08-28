import React, { useState, useEffect } from 'react';
import useMapStore from '../../store/useMapStore';
import { useAgentStore } from '../../store/useAgentStore';
import { gridService } from '../../services/gridService';
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
  FiAlertTriangle
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
    viewMode, 
    setViewMode, 
    temperatureMode, 
    setTemperatureMode,
    setGridData 
  } = useMapStore();

  const isStreaming = useAgentStore(state => state.isStreaming);

  const [hour, setHour] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync hourly grid data
  useEffect(() => {
    async function updateHeatHour() {
      try {
        const data = await gridService.getGrid(selectedDistrict, hour);
        if (data && data.length > 0) {
          setGridData(data);
        }
      } catch (e) {
        console.warn("Could not fetch hourly grid:", e);
      }
    }
    updateHeatHour();
  }, [hour, selectedDistrict]);

  // Autoplay simulation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setHour(prev => (prev >= 18 ? 6 : prev + 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${period}`;
  };

  const isPeakHour = hour >= 14 && hour <= 16;

  return (
    <header className="h-14 w-full bg-black/85 backdrop-blur-xl border-b border-cyan-500/30 px-4 flex items-center justify-between z-30 font-mono text-xs text-cyan-50 select-none shadow-2xl shrink-0">
      
      {/* 1. Left: Brand & District Switcher */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-3 border-r border-cyan-900/60">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FiShield size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-sm tracking-wider text-white">SHADE</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">20m²</span>
            </div>
            <span className="text-[9px] text-cyan-400/70 tracking-tight leading-none block">Temperature Action Engine</span>
          </div>
        </div>

        {/* District Switcher (Segmented Control) */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-cyan-800/40">
          <button
            onClick={() => setSelectedDistrict('Maryvale')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
              selectedDistrict.toLowerCase() === 'maryvale'
                ? 'bg-red-600/90 text-white shadow-md border border-red-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Maryvale: SVI 0.94, Canopy 5.8%, High Vulnerability District"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            <span>Maryvale (High Risk)</span>
          </button>

          <button
            onClick={() => setSelectedDistrict('Arcadia')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
              selectedDistrict.toLowerCase() === 'arcadia'
                ? 'bg-emerald-600/90 text-white shadow-md border border-emerald-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Arcadia: SVI 0.17, Canopy 32.1%, Low Vulnerability Wealthy District"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Arcadia (Control)</span>
          </button>
        </div>
      </div>

      {/* 2. Center: 12-Hour Heatwave Diurnal Timeline Scrubber */}
      <div className="flex items-center gap-3 bg-black/60 px-3.5 py-1 rounded-xl border border-cyan-800/40 shadow-inner">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-lg border border-cyan-600/40 transition-colors flex items-center gap-1 font-bold text-[11px]"
          title="Play/Pause 12-Hour Microclimate Diurnal Cycle"
        >
          {isPlaying ? <FiPause size={12} /> : <FiPlay size={12} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="flex items-center gap-1 min-w-[75px] text-cyan-300 font-bold text-xs">
          <FiClock size={13} className="text-cyan-400" />
          <span>{formatHour(hour)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 font-semibold">6 AM</span>
          <input 
            type="range" 
            min="6" 
            max="18" 
            step="1"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-32 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[9px] text-gray-500 font-semibold">6 PM</span>
        </div>

        {isPeakHour && (
          <div className="flex items-center gap-1 bg-red-950/90 text-red-300 border border-red-500/60 px-2 py-0.5 rounded-md animate-pulse text-[10px] font-bold">
            <FiAlertTriangle size={11} />
            <span>45.2°C PEAK</span>
          </div>
        )}
      </div>

      {/* 3. Right: View Modes, Track Tools & Co-Pilot Button */}
      <div className="flex items-center gap-2">
        
        {/* Layer View Mode */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-cyan-800/40">
          <button
            onClick={() => setViewMode('3d_hex')}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors text-[11px] ${
              viewMode === '3d_hex' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
            title="3D Heat Prisms"
          >
            <FiBox size={13} />
            <span>3D</span>
          </button>

          <button
            onClick={() => setViewMode('20m_cells')}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors text-[11px] ${
              viewMode === '20m_cells' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
            title="20m² Flat Grid"
          >
            <FiLayers size={13} />
            <span>Grid</span>
          </button>

          <button
            onClick={() => setViewMode('2m_plane')}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors text-[11px] ${
              viewMode === '2m_plane' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
            title="2m Pedestrian Measurement Plane"
          >
            <span className="text-emerald-400 font-bold">2m</span>
            <span>Plane</span>
          </button>
        </div>

        {/* Temperature Mode */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-cyan-800/40">
          <button
            onClick={() => setTemperatureMode(temperatureMode === 'air_temp' ? 'mrt_perceived' : 'air_temp')}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors text-[11px] font-bold ${
              temperatureMode === 'air_temp' ? 'text-amber-300' : 'text-purple-300'
            }`}
            title="Toggle Air Temp @ 2m vs Mean Radiant Temperature (MRT)"
          >
            {temperatureMode === 'air_temp' ? <FiThermometer size={13} /> : <FiSun size={13} />}
            <span>{temperatureMode === 'air_temp' ? '2m Air' : 'MRT Solar'}</span>
          </button>
        </div>

        {/* Track 1 Showcase Button */}
        <button
          onClick={onOpenCoolRoute}
          className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 shadow-md shadow-emerald-950/50 text-[11px]"
          title="Track 1: Hyperlocal Cool-Route Pedestrian Navigation"
        >
          <FiNavigation size={13} className="text-emerald-400" />
          <span>Cool-Route</span>
        </button>

        {/* Track 7 Showcase Button */}
        <button
          onClick={onOpenHealthStudy}
          className="px-2.5 py-1.5 bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-500/50 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 shadow-md shadow-purple-950/50 text-[11px]"
          title="Track 7: Epidemiological Health Correlation & Municipal ROI Study"
        >
          <FiActivity size={13} className="text-purple-400" />
          <span>Health ROI</span>
        </button>

        {/* Co-Pilot AI Drawer Toggle */}
        <button
          onClick={onToggleConsole}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs border ${
            isConsoleOpen
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/30'
              : 'bg-black/80 text-cyan-300 border-cyan-600/50 hover:bg-cyan-950'
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
