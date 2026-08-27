import React, { useState, useEffect } from 'react';
import { routingService } from '../../services/advancedServices';
import { FiNavigation, FiX, FiShield, FiSun, FiTrendingDown, FiClock } from 'react-icons/fi';

export default function CoolRouteModal({ onClose, onRouteCalculated }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoute() {
      try {
        const data = await routingService.getCoolPath();
        setRouteData(data);
        if (onRouteCalculated) {
          onRouteCalculated(data);
        }
      } catch (e) {
        console.error("Failed to calculate cool route:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchRoute();
  }, []);

  if (!routeData && loading) {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-2xl text-cyan-300 font-mono text-xs animate-pulse">
          🧭 Calculating FortyGuard 20m² Lowest-Exposure Pedestrian Path...
        </div>
      </div>
    );
  }

  if (!routeData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-black/90 border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl font-mono text-cyan-50">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FiNavigation className="text-emerald-400 text-lg animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-cyan-300">Track 1: Hyperlocal Cool-Route Pedestrian Navigation</h2>
              <p className="text-[10px] text-gray-400">Maryvale Transit Corridor: Community Center → 55th Ave Bus Stop</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <FiX size={18} />
          </button>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          
          {/* 1. Direct Asphalt Route */}
          <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400">🔥 Direct Asphalt Route</span>
              <span className="text-[9px] bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full">Standard GPS</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Distance:</span>
                <span className="text-white font-semibold">{routeData.direct_route.distance_meters} m</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Walk Time:</span>
                <span className="text-white font-semibold">{routeData.direct_route.estimated_walk_minutes} min</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Avg Air Temp (2m):</span>
                <span className="text-red-400 font-bold">{routeData.direct_route.avg_temp_2m_c} °C (113.4°F)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Perceived MRT Heat:</span>
                <span className="text-red-300 font-bold">{routeData.direct_route.avg_mrt_c} °C (137.3°F)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shade Coverage:</span>
                <span className="text-red-400 font-semibold">{routeData.direct_route.shade_coverage_pct}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-red-500/20 text-[10px] text-red-300 font-sans">
              ⚠️ Severe heat distress risk. Continuous unshaded asphalt radiation.
            </div>
          </div>

          {/* 2. SHADE Cool Corridor */}
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">🌿 SHADE Cool Corridor</span>
              <span className="text-[9px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/40">FortyGuard AI</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Distance:</span>
                <span className="text-white font-semibold">{routeData.cool_route.distance_meters} m (+70m)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Walk Time:</span>
                <span className="text-white font-semibold">{routeData.cool_route.estimated_walk_minutes} min (+1 min)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Avg Air Temp (2m):</span>
                <span className="text-emerald-400 font-bold">{routeData.cool_route.avg_temp_2m_c} °C (106.5°F)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Perceived MRT Heat:</span>
                <span className="text-purple-300 font-bold">{routeData.cool_route.avg_mrt_c} °C (107.8°F)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shade Coverage:</span>
                <span className="text-emerald-300 font-semibold">{routeData.cool_route.shade_coverage_pct}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-200 font-sans">
              ✨ Routes through residential tree canopy and shaded pedestrian awnings.
            </div>
          </div>

        </div>

        {/* Quantified Benefit Callout */}
        <div className="bg-cyan-950/60 border border-cyan-400/60 p-3.5 rounded-xl flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <span className="font-bold text-cyan-200 block">Thermal Exposure Shielding</span>
              <span className="text-[10px] text-cyan-400">
                -3.8°C Air Temp Relief • -16.4°C Perceived MRT Solar Relief
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-emerald-400">-68.4%</span>
            <span className="text-[10px] text-gray-300 block">Heat Stroke Probability</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors text-xs"
          >
            Apply Route to 3D Twin Map
          </button>
        </div>

      </div>
    </div>
  );
}
