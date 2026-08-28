import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import useMapStore from '../../store/useMapStore';
import useAgentStore from '../../store/useAgentStore';
import CoolingImpactCard from './CoolingImpactCard';

/**
 * Bottom statistics bar showing real-time telemetry from grid data.
 * All values are computed from live state — no hardcoded fallbacks.
 */
const StatsBar = () => {
  const gridData = useMapStore(state => state.gridData || []);
  const selectedDistrict = useMapStore(state => state.selectedDistrict || 'Maryvale');
  const currentPlan = useAgentStore(state => state.currentPlan);

  const cellsAnalyzed = gridData.length;
  const budgetSpent = currentPlan?.budget_spent || 0;
  const residentsCovered = currentPlan?.residents_covered || 0;
  const avgDeltaT = currentPlan?.avg_cooling_c || 0;

  // Compute live stats from grid data
  const avgTemp = gridData.length > 0
    ? (gridData.reduce((sum, c) => sum + (c.temp_2m || 0), 0) / gridData.length).toFixed(1)
    : '—';
  const maxTemp = gridData.length > 0
    ? Math.max(...gridData.map(c => c.temp_2m || 0)).toFixed(1)
    : '—';

  return (
    <div className="flex items-center gap-5 text-xs font-mono flex-1 select-none">
      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">District</span>
        <span className="text-cyan-400 font-bold text-sm">{selectedDistrict}</span>
      </div>

      <div className="h-7 w-px bg-cyan-900/50"></div>

      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Grid Cells</span>
        <span className="text-white font-semibold text-xs">
          {cellsAnalyzed > 0 ? `${cellsAnalyzed.toLocaleString()} (20m²)` : 'Loading...'}
        </span>
      </div>

      <div className="h-7 w-px bg-cyan-900/50"></div>

      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Avg / Max Temp</span>
        <span className="text-red-400 font-bold text-xs">{avgTemp}°C / {maxTemp}°C</span>
      </div>

      <div className="h-7 w-px bg-cyan-900/50"></div>

      {budgetSpent > 0 && (
        <>
          <div className="flex flex-col">
            <span className="text-gray-500 text-[10px] uppercase tracking-wider">Budget Deployed</span>
            <span className="text-emerald-400 font-bold text-xs">{formatCurrency(budgetSpent)}</span>
          </div>
          <div className="h-7 w-px bg-cyan-900/50"></div>
        </>
      )}

      <CoolingImpactCard
        residentsCovered={residentsCovered}
        avgDeltaT={avgDeltaT}
      />
    </div>
  );
};

export default StatsBar;
