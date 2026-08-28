import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import useMapStore from '../../store/useMapStore';
import useAgentStore from '../../store/useAgentStore';
import CoolingImpactCard from './CoolingImpactCard';

/**
 * Bottom statistics bar summarizing the current state/plan.
 */
const StatsBar = () => {
  const gridData = useMapStore(state => state.gridData || []);
  const selectedDistrict = useMapStore(state => state.selectedDistrict || 'Maryvale');
  const currentPlan = useAgentStore(state => state.currentPlan);

  const cellsAnalyzed = gridData.length > 0 ? gridData.length : 400;
  const budgetSpent = currentPlan?.budget_spent || 49850;
  const residentsCovered = currentPlan?.residents_covered || 1840;
  const avgDeltaT = currentPlan?.avg_cooling_c || -2.4;

  return (
    <div className="flex items-center gap-6 text-xs font-mono flex-1 select-none">
      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">District Target</span>
        <span className="text-cyan-400 font-bold text-sm">{selectedDistrict}</span>
      </div>

      <div className="h-7 w-px bg-cyan-900/50"></div>

      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Telemetry Grid</span>
        <span className="text-white font-semibold text-xs">{cellsAnalyzed.toLocaleString()} cells (20m²)</span>
      </div>
      
      <div className="h-7 w-px bg-cyan-900/50"></div>
      
      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Tactical Budget</span>
        <span className="text-emerald-400 font-bold text-xs">{formatCurrency(budgetSpent)}</span>
      </div>

      <div className="h-7 w-px bg-cyan-900/50"></div>

      <CoolingImpactCard 
        residentsCovered={residentsCovered} 
        avgDeltaT={avgDeltaT} 
      />
    </div>
  );
};

export default StatsBar;
