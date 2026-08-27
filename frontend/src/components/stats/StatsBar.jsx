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
    <div className="flex items-center gap-6 text-sm font-mono flex-1">
      <div className="flex flex-col">
        <span className="text-gray-400 text-xs">District</span>
        <span className="text-cyan-400 font-bold">{selectedDistrict}</span>
      </div>

      <div className="h-8 w-px bg-cyan-800/50"></div>

      <div className="flex flex-col">
        <span className="text-gray-400 text-xs">Cells Analyzed (20m²)</span>
        <span className="text-white font-semibold">{cellsAnalyzed.toLocaleString()} cells</span>
      </div>
      
      <div className="h-8 w-px bg-cyan-800/50"></div>
      
      <div className="flex flex-col">
        <span className="text-gray-400 text-xs">Budget Deployed</span>
        <span className="text-emerald-400 font-semibold">{formatCurrency(budgetSpent)}</span>
      </div>

      <div className="h-8 w-px bg-cyan-800/50"></div>

      <CoolingImpactCard 
        residentsCovered={residentsCovered} 
        avgDeltaT={avgDeltaT} 
      />
    </div>
  );
};

export default StatsBar;
