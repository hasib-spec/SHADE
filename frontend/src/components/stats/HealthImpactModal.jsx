import React, { useEffect, useState } from 'react';
import { FiX, FiActivity, FiDollarSign, FiTrendingUp, FiPercent } from 'react-icons/fi';
import { correlationService } from '../../services/advancedServices';
import useMapStore from '../../store/useMapStore';
import { formatCurrency } from '../../utils/formatters';

export default function HealthImpactModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [studyData, setStudyData] = useState(null);
  const currentPlan = useMapStore(state => state.currentPlan);
  const selectedDistrict = useMapStore(state => state.selectedDistrict || 'Maryvale');

  const activeBudget = currentPlan?.budget_spent || 50000.0;

  useEffect(() => {
    async function fetchStudy() {
      try {
        const data = await correlationService.getHealthStudy(selectedDistrict, activeBudget);
        setStudyData(data);
      } catch (e) {
        console.error("Failed to load health study:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStudy();
  }, [selectedDistrict, activeBudget]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none font-sans">
      <div className="bg-[#08090D] border border-purple-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiX size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-white/[0.08] pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/50">
            <FiActivity className="text-purple-400" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Epidemiological Correlation & Municipal ROI</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-mono">TRACK 7</span>
            </div>
            <p className="text-xs text-gray-400 font-mono">FortyGuard 20m² Microclimate Regression Analysis</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs font-mono text-cyan-400 animate-pulse">
            Computing empirical regression matrix from Maricopa County baselines...
          </div>
        ) : studyData ? (
          <div className="space-y-5 text-xs font-sans">
            
            {/* 1. Empirical Regressions Grid */}
            <div>
              <h3 className="text-xs font-bold text-gray-200 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FiPercent className="text-purple-400" /> Empirical Health Regressions (20m² Resolution)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {studyData.outcomes.map((item, idx) => (
                  <div key={idx} className="bg-[#050608]/80 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
                    <div className="text-[11px] font-bold text-purple-200 leading-tight">{item.metric_name}</div>
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-xl font-bold text-white">R² = {item.r_squared}</span>
                      <span className="text-[10px] text-gray-400">p &lt; {item.p_value}</span>
                    </div>
                    <div className="text-[10px] text-gray-300 leading-relaxed font-sans">{item.description}</div>
                    <div className="text-[10px] font-mono font-bold text-emerald-400 pt-1 border-t border-white/[0.04]">
                      {item.impact_per_celsius_rise}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Demographic Disparity Comparison Table */}
            <div>
              <h3 className="text-xs font-bold text-gray-200 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FiTrendingUp className="text-purple-400" /> District Thermal Equity Disparity
              </h3>
              <div className="bg-[#050608]/80 rounded-xl border border-white/[0.06] overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02] border-b border-white/[0.06] text-gray-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-3">District Profile</th>
                      <th className="p-3">Avg 2m Temp</th>
                      <th className="p-3">Tree Canopy</th>
                      <th className="p-3">CDC SVI</th>
                      <th className="p-3">ED Admissions / 100k</th>
                      <th className="p-3">Heat Mortality Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] tabular-nums">
                    {studyData.district_comparison.map((d, idx) => (
                      <tr key={idx} className={idx === 0 ? 'bg-red-950/20 text-red-200' : 'bg-emerald-950/20 text-emerald-200'}>
                        <td className="p-3 font-bold font-sans">{d.district}</td>
                        <td className="p-3 font-bold">{d.avg_temp_2m_c}°C</td>
                        <td className="p-3">{d.tree_canopy_pct}%</td>
                        <td className="p-3">{d.svi_score}</td>
                        <td className="p-3 font-bold">{d.heat_er_admissions_per_100k}</td>
                        <td className="p-3 font-bold">{d.annual_heat_mortality_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Municipal Economic ROI Box */}
            <div>
              <h3 className="text-xs font-bold text-gray-200 font-mono uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FiDollarSign className="text-emerald-400" /> Municipal Health & Economic ROI Summary
              </h3>
              <div className="bg-gradient-to-r from-purple-950/40 via-[#050608] to-emerald-950/40 p-4 rounded-xl border border-purple-500/30 grid grid-cols-4 gap-4 font-mono tabular-nums text-center">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">Tactical Budget</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(studyData.roi_summary.intervention_budget_usd)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">ED Visits Avoided</span>
                  <span className="text-lg font-bold text-emerald-400">{studyData.roi_summary.projected_hospital_visits_avoided} patients</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">Net Economic Benefit</span>
                  <span className="text-lg font-bold text-emerald-300">{formatCurrency(studyData.roi_summary.net_economic_benefit_usd)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-sans">Benefit-Cost Ratio</span>
                  <span className="text-lg font-extrabold text-cyan-300">{studyData.roi_summary.benefit_cost_ratio}x ROI</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 font-mono text-xs">
            Could not fetch health impact data from backend.
          </div>
        )}

      </div>
    </div>
  );
}
