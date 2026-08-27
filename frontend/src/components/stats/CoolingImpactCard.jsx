import React from 'react';
import { formatPopulation, formatTemp } from '../../utils/formatters';

/**
 * Card showing projected impact. Highlights the Abu Dhabi anchor metric.
 */
const CoolingImpactCard = ({ residentsCovered, avgDeltaT }) => {
  if (residentsCovered === 0) {
    return (
      <div className="flex items-center text-gray-500 italic text-xs">
        Awaiting agent allocation...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">Vulnerable Residents Protected</span>
        <span className="text-white font-semibold">{formatPopulation(residentsCovered)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs">Projected Cooling (Avg ΔT)</span>
        <span className="text-blue-400 font-bold">{formatTemp(avgDeltaT)}</span>
      </div>
    </div>
  );
};

export default CoolingImpactCard;
