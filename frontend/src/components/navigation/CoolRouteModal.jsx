import React, { useState } from 'react';
import { FiX, FiNavigation, FiTrendingDown, FiShield, FiSun, FiClock, FiMapPin, FiCompass, FiAlertCircle } from 'react-icons/fi';
import { routingService } from '../../services/advancedServices';

export default function CoolRouteModal({ onClose, onRouteCalculated }) {
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const calculateCoolPath = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await routingService.getCoolPath({
        // MODELED demo trip (mesh is modeled, data_provenance="modeled").
        // Measured output on this exact pair: distance +8.4%, integrated radiant
        // (MRT) dose −9.5%, avg MRT −7.9°C, peak air −2.0°C — see README Track 1.
        start_lat: 33.4925,
        start_lon: -112.1770, // west side of the modeled canal-path corridor (51st Ave area)
        end_lat: 33.4954,
        end_lon: -112.1759,   // north-east of the corridor (49th Ave area)
        district: 'Maryvale',
        hour: 15.0
      });
      if (data && data.direct_route && data.cool_route) {
        setRouteResult(data);
        if (onRouteCalculated) {
          onRouteCalculated(data);
        }
      } else {
        throw new Error("Invalid response schema from routing engine");
      }
    } catch (e) {
      console.error("Failed to compute cool route:", e);
      setErrorMsg(e.message || "Failed to reach routing engine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none font-sans">
      <div className="bg-[#08090D] border border-emerald-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <FiX size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-white/[0.08] pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <FiNavigation className="text-emerald-400" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Hyperlocal Cool-Route Navigation</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">TRACK 1</span>
            </div>
            <p className="text-xs text-gray-400 font-mono">FortyGuard 20m² Canopy & Microclimate Pedestrian Routing</p>
          </div>
        </div>

        {/* Origin / Destination Waypoints */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs font-mono">
          <div className="bg-[#050608]/80 p-3 rounded-xl border border-white/[0.06] flex items-center gap-2.5">
            <FiMapPin className="text-red-400 shrink-0" size={16} />
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Origin (Residential)</span>
              <span className="font-bold text-gray-200">55th Ave & W Whitton Ave</span>
            </div>
          </div>

          <div className="bg-[#050608]/80 p-3 rounded-xl border border-white/[0.06] flex items-center gap-2.5">
            <FiCompass className="text-emerald-400 shrink-0" size={16} />
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Destination (Cooling Refuge)</span>
              <span className="font-bold text-gray-200">Maryvale Community Center</span>
            </div>
          </div>
        </div>

        {/* Error Message if any */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 font-mono">
            <FiAlertCircle className="shrink-0 text-red-400" size={16} />
            <span>Error computing route: {errorMsg}</span>
          </div>
        )}

        {/* Calculate Action */}
        {!routeResult && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-300 font-sans mb-4 max-w-md mx-auto">
              Computes pedestrian routing that actively avoids unshaded asphalt corridors, diverting pedestrians through high-canopy residential tree pockets.
            </p>
            <button
              onClick={calculateCoolPath}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Routing across 20m² grid...' : '🚀 Compute Shaded vs Asphalt Path'}
            </button>
          </div>
        )}

        {/* Side-by-Side Results Comparison */}
        {routeResult && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* Direct Path (Red) */}
              <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 font-mono">Direct Asphalt Route</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-600/40 font-mono">DANGER</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono tabular-nums">
                  {routeResult.direct_route.avg_temp_2m_c}°C
                  <span className="text-xs text-gray-400 font-normal ml-1">avg 2m</span>
                </div>
                <div className="text-xs space-y-1 text-gray-300 font-mono text-[11px] tabular-nums">
                  <div>Solar MRT: <strong className="text-red-400">{routeResult.direct_route.avg_mrt_c}°C</strong></div>
                  <div>Shade Coverage: <strong className="text-gray-400">{routeResult.direct_route.shade_coverage_pct}%</strong></div>
                  <div>Walk Time: {routeResult.direct_route.estimated_walk_minutes} min ({routeResult.direct_route.distance_meters} m)</div>
                </div>
              </div>

              {/* Cool Path (Green) */}
              <div className="bg-emerald-950/30 border border-emerald-500/50 p-4 rounded-xl space-y-2 shadow-laser-emerald">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">SHADE Cool Corridor</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-mono">RECOMMENDED</span>
                </div>
                <div className="text-2xl font-bold text-emerald-300 font-mono tabular-nums">
                  {routeResult.cool_route.avg_temp_2m_c}°C
                  <span className="text-xs text-emerald-400/80 font-normal ml-1">avg 2m</span>
                </div>
                <div className="text-xs space-y-1 text-gray-200 font-mono text-[11px] tabular-nums">
                  <div>Solar MRT: <strong className="text-emerald-400">{routeResult.cool_route.avg_mrt_c}°C</strong></div>
                  <div>Shade Coverage: <strong className="text-emerald-300 font-bold">{routeResult.cool_route.shade_coverage_pct}%</strong></div>
                  <div>Walk Time: {routeResult.cool_route.estimated_walk_minutes} min ({routeResult.cool_route.distance_meters} m)</div>
                </div>
              </div>

            </div>

            {/* Impact Metric Card */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 via-[#050608] to-cyan-950/60 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <FiShield className="text-emerald-400" size={18} />
                <div>
                  <div className="font-bold text-white">Mean Radiant Temperature Relief</div>
                  <div className="text-[10px] text-gray-400">Pedestrian heat stress reduced by taking shaded corridor</div>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="text-base font-extrabold text-emerald-400">-{routeResult.mrt_relief_c}°C MRT</div>
                <div className="text-[10px] text-emerald-300 font-semibold">-{routeResult.heat_stroke_risk_reduction_pct}% Stroke Risk</div>
              </div>
            </div>

            {/* Render on Map Button */}
            <div className="text-center pt-1">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-xl transition-all shadow-lg shadow-emerald-900/30"
              >
                🗺️ View Shaded Corridor on 3D Twin Map
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
