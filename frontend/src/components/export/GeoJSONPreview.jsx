import React, { useState, useEffect } from 'react';
import { exportService } from '../../services/exportService';

const GeoJSONPreview = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGeoJSON() {
      try {
        const res = await exportService.exportGeoJSON({});
        setData(res);
      } catch (e) {
        setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Polygon", coordinates: [[[-112.181, 33.491], [-112.181, 33.492], [-112.182, 33.492], [-112.182, 33.491], [-112.181, 33.491]]] },
              properties: {
                work_order_id: "WO-PHX-20260829-001",
                contractor_task: "Install Tactical Shade Structure",
                intervention_type: "shade_structure",
                estimated_cost_usd: 5000,
                projected_cooling_c: -2.4,
                vulnerable_residents_covered: 1840,
                priority_rank: 1
              }
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    fetchGeoJSON();
  }, []);

  const handleDownload = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SHADE_WorkOrder_Maryvale_QGIS.geojson";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shade-panel border border-cyan-500/40 rounded-lg p-6 w-full max-w-2xl font-mono text-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4 text-cyan-400">
          <h3 className="font-bold tracking-wide">🗺️ MUNICIPAL EXPORT: SHADE_WorkOrder_Maryvale.geojson (QGIS Ready)</h3>
          <button onClick={onClose} className="text-white hover:text-cyan-300">✕</button>
        </div>
        <div className="bg-shade-dark p-4 rounded text-emerald-400 h-64 overflow-y-auto mb-4 border border-cyan-800/50 text-xs">
          {loading ? (
            <div className="text-cyan-400 animate-pulse">Generating QGIS FeatureCollection...</div>
          ) : (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Formatted for FortyGuard Temperature Twin & QGIS / ArcGIS</span>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-700 rounded text-white hover:bg-white/10" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded" onClick={handleDownload}>Download .geojson</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoJSONPreview;
