import React, { useState, useEffect } from 'react';
import { correlationService } from '../../services/advancedServices';
import { FiActivity, FiX, FiTrendingUp, FiDollarSign, FiHeart, FiShield } from 'react-icons/fi';

export default function HealthImpactModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudy() {
      try {
        const res = await correlationService.getHealthStudy();
        setData(res);
      } catch (e) {
        console.error("Failed to fetch correlation study:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStudy();
  }, []);

  if (!data && loading) {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-2xl text-cyan-300 font-mono text-xs animate-pulse">
          📊 Ingesting Maricopa County Epidemiological & Energy Load Regression Data...
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-black/90 border border-cyan-500/50 rounded-2xl max-w-3xl w-full p-6 shadow-2xl font-mono text-cyan-50 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FiActivity className="text-purple-400 text-lg animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-cyan-300">Track 7: Hyperlocal Temperature & Health Outcome Correlation Study</h2>
              <p className="text-[10px] text-gray-400">Grounded in Maricopa County Public Health & FortyGuard 20m² Microclimate Models</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <FiX size={18} />
          </button>
        </div>

        {/* 1. Statistical Regressions */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-cyan-300 mb-2">📈 Empirical Regression Models</h3>
          <div className="grid grid-cols-3 gap-3">
            {data.outcomes.map((item, idx) => (
              <div key={idx} className="bg-cyan-950/30 border border-cyan-800/40 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-cyan-200 text-[11px] leading-tight">{item.metric_name}</div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">R² Coefficient:</span>
                  <span className="text-emerald-400 font-bold">{item.r_squared} (p &lt; {item.p_value})</span>
                </div>
                <div className="text-[10px] text-purple-300 font-semibold">{item.impact_per_celsius_rise}</div>
                <p className="text-[9px] text-gray-400 leading-snug">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. District Inequity Breakdown */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-cyan-300 mb-2">⚖️ Heat Inequity & Health Vulnerability Gap</h3>
          <div className="bg-black/50 border border-gray-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-cyan-950/60 text-cyan-400 border-b border-gray-800 text-[10px]">
                <tr>
                  <th className="p-2.5">District</th>
                  <th className="p-2.5">Avg T_2m</th>
                  <th className="p-2.5">Canopy</th>
                  <th className="p-2.5">CDC SVI</th>
                  <th className="p-2.5">ER Visits / 100k</th>
                  <th className="p-2.5">Heat Mortality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-[11px]">
                {data.district_comparison.map((d, i) => (
                  <tr key={i} className={i === 0 ? "text-red-300 bg-red-950/20 font-semibold" : "text-emerald-300 font-semibold"}>
                    <td className="p-2.5">{d.district}</td>
                    <td className="p-2.5">{d.avg_temp_2m_c} °C</td>
                    <td className="p-2.5">{d.tree_canopy_pct}%</td>
                    <td className="p-2.5">{d.svi_score}</td>
                    <td className="p-2.5">{d.heat_er_admissions_per_100k}</td>
                    <td className="p-2.5">{d.annual_heat_mortality_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Municipal ROI & Health Economics */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/50 p-4 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-emerald-400 text-lg" />
              <span className="text-xs font-bold text-emerald-300">
                Municipal Cost-Benefit Ratio: {data.roi_summary.benefit_cost_ratio}x Payback
              </span>
            </div>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/40 font-bold">
              $50,000 Tactical Plan
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center text-xs pt-1">
            <div className="bg-black/50 p-2 rounded-lg border border-emerald-900">
              <span className="text-[9px] text-gray-400 block">ED Visits Avoided</span>
              <span className="text-emerald-300 font-bold text-sm">{data.roi_summary.projected_hospital_visits_avoided} visits</span>
            </div>
            <div className="bg-black/50 p-2 rounded-lg border border-emerald-900">
              <span className="text-[9px] text-gray-400 block">Medical Savings</span>
              <span className="text-emerald-300 font-bold text-sm">${data.roi_summary.direct_medical_cost_savings_usd.toLocaleString()}</span>
            </div>
            <div className="bg-black/50 p-2 rounded-lg border border-emerald-900">
              <span className="text-[9px] text-gray-400 block">Worker Hours Saved</span>
              <span className="text-emerald-300 font-bold text-sm">{data.roi_summary.worker_productivity_hours_saved.toLocaleString()} hrs</span>
            </div>
            <div className="bg-black/50 p-2 rounded-lg border border-emerald-900">
              <span className="text-[9px] text-gray-400 block">Net Economic Benefit</span>
              <span className="text-cyan-300 font-bold text-sm">${data.roi_summary.net_economic_benefit_usd.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors text-xs"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
}
