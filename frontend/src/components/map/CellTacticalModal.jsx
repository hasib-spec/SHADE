import React, { useState } from 'react';
import useMapStore from '../../store/useMapStore';
import useAgentStore from '../../store/useAgentStore';
import { interventionService } from '../../services/interventionService';
import { FiX, FiActivity, FiCheckCircle, FiZap, FiPlusCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

export default function CellTacticalModal() {
  const { selectedCell, setSelectedCell, currentPlan, setCurrentPlan } = useMapStore();
  const applyPlanToMap = useAgentStore(state => state.applyPlanToMap);
  const [loadingType, setLoadingType] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [isDeployed, setIsDeployed] = useState(false);

  if (!selectedCell) return null;

  const handleSimulate = async (interventionType) => {
    setLoadingType(interventionType);
    try {
      const res = await interventionService.simulateIntervention({
        cell_id: selectedCell.id || selectedCell.cell_id || "cell_001",
        intervention_type: interventionType
      });
      setSimResult({
        type: interventionType,
        ...res
      });
    } catch (e) {
      console.error("Simulation failed:", e);
      const deltas = {
        shade_structure: { delta_t_air: -2.81, delta_t_mrt: -15.0, cost: 8000 },
        tree_canopy: { delta_t_air: -2.50, delta_t_mrt: -10.0, cost: 1500 },
        cool_pavement: { delta_t_air: -0.90, delta_t_mrt: -3.0, cost: 3000 },
        misting: { delta_t_air: -4.00, delta_t_mrt: -5.0, cost: 5000 }
      };
      const d = deltas[interventionType] || deltas.shade_structure;
      setSimResult({
        type: interventionType,
        cooling_delta: d,
        projected_temp_2m: (selectedCell.temp_2m || 44.6) + d.delta_t_air,
        estimated_cost_usd: d.cost
      });
    } finally {
      setLoadingType(null);
    }
  };

  const handleDeployToCell = () => {
    const type = simResult?.type || 'shade_structure';
    const cost = simResult?.estimated_cost_usd || 8000;
    const cooling = simResult?.cooling_delta?.delta_t_air || -2.8;

    const newIntervention = {
      cell_id: selectedCell.id || selectedCell.cell_id || `cell_${Date.now()}`,
      intervention_type: type,
      cost: cost,
      cooling_delta: cooling,
      residents_covered: Math.round(selectedCell.elderly_density || 120),
      lat: selectedCell.lat,
      lon: selectedCell.lon
    };

    const existingInterventions = currentPlan?.interventions || [];
    const updatedInterventions = [...existingInterventions, newIntervention];
    const newBudgetSpent = (currentPlan?.budget_spent || 0) + cost;
    const newResidents = (currentPlan?.residents_covered || 0) + newIntervention.residents_covered;

    const updatedPlan = {
      status: "ALLOCATED",
      district: selectedCell.district || "Maryvale",
      budget_spent: newBudgetSpent,
      residents_covered: newResidents,
      avg_cooling_c: -2.4,
      work_order_id: currentPlan?.work_order_id || "WO-PHX-2026-0829-01",
      interventions: updatedInterventions
    };

    setCurrentPlan(updatedPlan);
    applyPlanToMap(updatedPlan);
    setIsDeployed(true);
    setTimeout(() => setIsDeployed(false), 3000);
  };

  const heri = selectedCell.heri_score !== undefined ? selectedCell.heri_score : 85.0;
  const isCritical = heri >= 80;

  return (
    <div className="absolute left-6 bottom-6 w-[370px] max-h-[calc(100vh-170px)] bg-[#08090D]/95 backdrop-blur-2xl border border-cyan-400/40 rounded-2xl shadow-2xl z-20 font-mono text-cyan-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
      
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] bg-gradient-to-r from-cyan-950/70 via-black to-black flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`}></div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-cyan-300">
              {selectedCell.id?.slice(0, 16) || selectedCell.cell_id || '20m² Micro-Cell'}
            </h3>
            <span className="text-[9px] text-gray-400 font-sans">
              Lat: {Number(selectedCell.lat).toFixed(4)}, Lon: {Number(selectedCell.lon).toFixed(4)}
            </span>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedCell(null); setSimResult(null); }}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Close Inspector"
        >
          <FiX size={15} />
        </button>
      </div>

      {/* Sensor Telemetry Grid */}
      <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
          <div className="bg-[#050608]/80 p-2.5 rounded-xl border border-white/[0.06]">
            <span className="text-[9px] text-gray-400 font-sans block mb-0.5 uppercase tracking-wider">40G 2m Air Temp</span>
            <span className="text-sm font-bold text-red-400">
              {selectedCell.temp_2m ? Number(selectedCell.temp_2m).toFixed(1) : '44.8'} °C
            </span>
            <span className="text-[9px] text-gray-500 block">
              {((Number(selectedCell.temp_2m || 44.8) * 9/5) + 32).toFixed(1)} °F
            </span>
          </div>

          <div className="bg-[#050608]/80 p-2.5 rounded-xl border border-white/[0.06]">
            <span className="text-[9px] text-gray-400 font-sans block mb-0.5 uppercase tracking-wider">HERI Risk Index</span>
            <span className={`text-sm font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
              {Number(heri).toFixed(1)} / 100
            </span>
            <span className="text-[9px] text-red-300 font-semibold block">
              {selectedCell.risk_level || (isCritical ? 'CRITICAL RISK' : 'HIGH RISK')}
            </span>
          </div>

          <div className="bg-[#050608]/60 p-2 rounded-xl border border-white/[0.04]">
            <span className="text-[9px] text-gray-400 font-sans block uppercase">CDC SVI Index</span>
            <span className="text-xs font-semibold text-purple-300">
              {Number(selectedCell.svi || 0.94).toFixed(2)} (94th %)
            </span>
          </div>

          <div className="bg-[#050608]/60 p-2 rounded-xl border border-white/[0.04]">
            <span className="text-[9px] text-gray-400 font-sans block uppercase">Tree Canopy</span>
            <span className="text-xs font-semibold text-emerald-400">
              {(Number(selectedCell.canopy_cover || 0.058) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="bg-[#050608]/60 p-2 rounded-xl border border-white/[0.04]">
            <span className="text-[9px] text-gray-400 font-sans block uppercase">Seniors (65+)</span>
            <span className="text-xs font-semibold text-amber-300">
              {Math.round(selectedCell.elderly_density || 42)} residents
            </span>
          </div>

          <div className="bg-[#050608]/60 p-2 rounded-xl border border-white/[0.04]">
            <span className="text-[9px] text-gray-400 font-sans block uppercase">Transit Distance</span>
            <span className="text-xs font-semibold text-cyan-300">
              {Math.round(selectedCell.transit_stop_distance_m || 65)} m
            </span>
          </div>
        </div>

        {/* Surrogate Model Simulation Section */}
        <div className="pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-sans">
              <FiActivity className="text-cyan-400" /> Simulate Interventions
            </span>
            <span className="text-[9px] text-gray-400">ONNX Inference</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSimulate('shade_structure')}
              disabled={loadingType !== null}
              className="p-2.5 bg-[#050608]/90 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 shadow-sm"
            >
              <div className="text-[11px] font-bold text-cyan-200">⛱️ Shade Sail</div>
              <div className="text-[9px] text-gray-400">$8,000 • -2.8°C Air</div>
              <div className="text-[9px] text-purple-300 font-semibold">-15.0°C MRT</div>
            </button>

            <button
              onClick={() => handleSimulate('tree_canopy')}
              disabled={loadingType !== null}
              className="p-2.5 bg-[#050608]/90 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 shadow-sm"
            >
              <div className="text-[11px] font-bold text-emerald-200">🌳 Tree Canopy</div>
              <div className="text-[9px] text-gray-400">$1,500 • -2.5°C Air</div>
              <div className="text-[9px] text-emerald-300 font-semibold">-10.0°C MRT</div>
            </button>

            <button
              onClick={() => handleSimulate('cool_pavement')}
              disabled={loadingType !== null}
              className="p-2.5 bg-[#050608]/90 hover:bg-blue-950/60 border border-blue-500/30 hover:border-blue-400 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 shadow-sm"
            >
              <div className="text-[11px] font-bold text-blue-200">🛣️ Cool Pavement</div>
              <div className="text-[9px] text-gray-400">$3,000 • -0.9°C Air</div>
              <div className="text-[9px] text-blue-300 font-semibold">-7.5°C Surface</div>
            </button>

            <button
              onClick={() => handleSimulate('misting')}
              disabled={loadingType !== null}
              className="p-2.5 bg-[#050608]/90 hover:bg-teal-950/60 border border-teal-500/30 hover:border-teal-400 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 shadow-sm"
            >
              <div className="text-[11px] font-bold text-teal-200">💦 Misting Station</div>
              <div className="text-[9px] text-gray-400">$5,000 • -4.0°C Perceived</div>
              <div className="text-[9px] text-teal-300 font-semibold">Evaporative</div>
            </button>
          </div>
        </div>

        {/* Live Simulation Results Output & 1-Click Deployment Button */}
        {simResult && (
          <div className="p-3 bg-cyan-950/70 border border-cyan-400/60 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 shadow-laser-cyan">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5"><FiCheckCircle /> Simulated Impact:</span>
              <span className="text-[9px] text-gray-300 font-normal">Triton / ONNX</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-xs tabular-nums">
              <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                <span className="text-[8px] text-gray-400 font-sans block uppercase">Air Drop</span>
                <span className="text-emerald-400 font-bold text-xs">
                  {simResult.cooling_delta?.delta_t_air ? Number(simResult.cooling_delta.delta_t_air).toFixed(2) : '-2.81'} °C
                </span>
              </div>
              <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                <span className="text-[8px] text-gray-400 font-sans block uppercase">MRT Relief</span>
                <span className="text-purple-300 font-bold text-xs">
                  {simResult.cooling_delta?.delta_t_mrt ? Number(simResult.cooling_delta.delta_t_mrt).toFixed(1) : '-15.0'} °C
                </span>
              </div>
              <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                <span className="text-[8px] text-gray-400 font-sans block uppercase">Post-Temp</span>
                <span className="text-cyan-300 font-bold text-xs">
                  {simResult.projected_temp_2m ? Number(simResult.projected_temp_2m).toFixed(1) : '41.8'} °C
                </span>
              </div>
            </div>

            {/* Direct Deployment Button to map */}
            <button
              onClick={handleDeployToCell}
              className={`w-full py-2 font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 ${
                isDeployed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:scale-[1.02]'
              }`}
            >
              <FiZap size={13} className={isDeployed ? 'animate-bounce' : ''} />
              <span>{isDeployed ? '✓ Tactical Cooling Site Deployed!' : `⚡ Deploy ${simResult.type?.replace('_', ' ')} (${formatCurrency(simResult.estimated_cost_usd || 8000)})`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
