import React from 'react';
import useMapStore from '../../store/useMapStore';
import { FiBox, FiLayers } from 'react-icons/fi';

/**
 * Controls to toggle map views (3D hex vs 2m cells).
 */
const MapControls = () => {
  const { viewMode, setViewMode } = useMapStore();

  return (
    <div className="bg-shade-panel border border-shade-border rounded-lg p-2 flex flex-col gap-2 shadow-lg backdrop-blur-sm bg-opacity-90">
      <button
        onClick={() => setViewMode('3d_hex')}
        className={`p-2 rounded flex items-center justify-center transition-colors ${
          viewMode === '3d_hex' ? 'bg-shade-accent text-shade-dark' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="3D Hexagon Overview"
      >
        <FiBox size={20} />
      </button>
      <button
        onClick={() => setViewMode('2m_plane')}
        className={`p-2 rounded flex items-center justify-center transition-colors ${
          viewMode === '2m_plane' ? 'bg-shade-accent text-shade-dark' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title="20m² Cell & 2m Pedestrian Plane"
      >
        <FiLayers size={20} />
      </button>
    </div>
  );
};

export default MapControls;
