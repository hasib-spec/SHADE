import React from 'react';
import useMapStore from '../../store/useMapStore';

/**
 * Toggle between Air Temperature (2m) and Mean Radiant Temperature (perceived).
 */
const TemperatureToggle = () => {
  const { activeLayer, setActiveLayer } = useMapStore();

  return (
    <div className="flex bg-shade-panel rounded-full p-1 border border-shade-border shadow-lg">
      <button
        onClick={() => setActiveLayer('air_temp')}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
          activeLayer === 'air_temp' ? 'bg-shade-accent text-shade-dark' : 'text-gray-400 hover:text-white'
        }`}
      >
        Air Temp (2m)
      </button>
      <button
        onClick={() => setActiveLayer('mrt_perceived')}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
          activeLayer === 'mrt_perceived' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        MRT / Perceived
      </button>
    </div>
  );
};

export default TemperatureToggle;
