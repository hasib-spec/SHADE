import React from 'react';
import useMapStore from '../../store/useMapStore';
import { FiBox, FiLayers, FiSun, FiThermometer, FiMapPin } from 'react-icons/fi';

/**
 * Controls to toggle districts (Maryvale vs Arcadia), view modes, and temperature scales.
 */
const MapControls = () => {
  const { 
    viewMode, 
    setViewMode, 
    selectedDistrict, 
    setSelectedDistrict,
    temperatureMode,
    setTemperatureMode 
  } = useMapStore();

  return (
    <div className="flex flex-col gap-2.5 z-20 font-mono text-xs select-none">
      
      {/* 1. District Switcher */}
      <div className="bg-black/80 border border-cyan-500/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1">
        <button
          onClick={() => setSelectedDistrict('Maryvale')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            selectedDistrict.toLowerCase() === 'maryvale'
              ? 'bg-red-600/80 text-white shadow-lg border border-red-400'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Maryvale: SVI 0.94, Canopy 5.8%, High Vulnerability District"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
          <span>Maryvale (High Risk)</span>
        </button>

        <button
          onClick={() => setSelectedDistrict('Arcadia')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            selectedDistrict.toLowerCase() === 'arcadia'
              ? 'bg-emerald-600/80 text-white shadow-lg border border-emerald-400'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Arcadia: SVI 0.17, Canopy 32.1%, Low Vulnerability Wealthy District"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Arcadia (Control)</span>
        </button>
      </div>

      {/* 2. Visualization & Layer Mode Toggles */}
      <div className="bg-black/80 border border-cyan-500/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1">
        <button
          onClick={() => setViewMode('3d_hex')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
            viewMode === '3d_hex' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="3D Heat Prisms (Extruded by HERI Equity Risk)"
        >
          <FiBox size={14} />
          <span>3D Prisms</span>
        </button>

        <button
          onClick={() => setViewMode('20m_cells')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
            viewMode === '20m_cells' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="20m² Flat Micro-Cell Grid"
        >
          <FiLayers size={14} />
          <span>20m² Grid</span>
        </button>

        <button
          onClick={() => setViewMode('2m_plane')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
            viewMode === '2m_plane' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="2m Pedestrian Measurement Plane"
        >
          <span className="text-emerald-400 font-bold">2m</span>
          <span>Plane</span>
        </button>
      </div>

      {/* 3. Temperature Scale Toggle */}
      <div className="bg-black/80 border border-cyan-500/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1">
        <button
          onClick={() => setTemperatureMode('air_temp')}
          className={`flex-1 px-2.5 py-1 rounded-lg flex items-center justify-center gap-1 transition-colors ${
            temperatureMode === 'air_temp' ? 'bg-amber-600/70 text-white font-semibold' : 'text-gray-400 hover:text-white'
          }`}
          title="Ambient Air Temperature measured at 2m height"
        >
          <FiThermometer size={13} />
          <span>2m Air Temp</span>
        </button>

        <button
          onClick={() => setTemperatureMode('mrt_perceived')}
          className={`flex-1 px-2.5 py-1 rounded-lg flex items-center justify-center gap-1 transition-colors ${
            temperatureMode === 'mrt_perceived' ? 'bg-purple-600/70 text-white font-semibold' : 'text-gray-400 hover:text-white'
          }`}
          title="Mean Radiant Temperature (MRT) - Perceived Solar Radiation"
        >
          <FiSun size={13} />
          <span>MRT Perceived</span>
        </button>
      </div>

    </div>
  );
};

export default MapControls;
