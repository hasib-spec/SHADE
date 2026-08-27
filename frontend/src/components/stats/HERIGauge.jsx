import React from 'react';

/**
 * Visual gauge showing the Heat Equity Risk Index for a selected cell.
 */
const HERIGauge = ({ score }) => {
  const percentage = Math.min(Math.max(score, 0), 100);
  
  // Color based on risk
  let color = 'bg-green-500';
  if (percentage > 50) color = 'bg-yellow-500';
  if (percentage > 75) color = 'bg-orange-500';
  if (percentage > 90) color = 'bg-red-500';
  if (percentage > 95) color = 'bg-purple-500'; // Extreme equity risk

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-gray-400">HERI Score</span>
        <span className="text-white font-bold">{percentage.toFixed(1)}/100</span>
      </div>
      <div className="h-2 w-full bg-shade-dark rounded-full overflow-hidden border border-shade-border">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default HERIGauge;
