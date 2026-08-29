import React, { useState, useEffect } from 'react';
import { FiX, FiDownload, FiFileText, FiCheck } from 'react-icons/fi';
import { exportService } from '../../services/exportService';

export default function GeoJSONPreview({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchGeoJSON() {
      try {
        const res = await exportService.exportGeoJSON({});
        setData(res);
      } catch (e) {
        console.error("GeoJSON export failed:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGeoJSON();
  }, []);

  const handleDownload = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SHADE_Municipal_WorkOrder_Maryvale_QGIS.geojson";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none font-sans">
      <div className="bg-[#08090D] border border-cyan-500/40 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative text-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FiFileText size={16} />
            </div>
            <div>
              <h3 className="font-bold text-xs font-mono text-cyan-300">SHADE_WorkOrder_Maryvale.geojson</h3>
              <p className="text-[10px] text-gray-400 font-sans">Standard RFC 7946 GeoJSON FeatureCollection for QGIS & ArcGIS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {/* Code Content Box */}
        <div className="bg-[#050608] p-4 rounded-xl text-emerald-400 h-72 overflow-y-auto mb-4 border border-white/[0.06] text-xs font-mono select-text">
          {loading ? (
            <div className="text-cyan-400 animate-pulse text-center py-16">Generating QGIS FeatureCollection from knapsack allocation...</div>
          ) : (
            <pre className="leading-relaxed whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex justify-between items-center pt-2 font-mono text-xs">
          <span className="text-[10px] text-gray-400 font-sans">40G Microclimate Geometry + Municipal Attributes</span>
          <div className="flex gap-2.5">
            <button 
              onClick={handleCopy}
              className="px-3.5 py-2 border border-white/[0.12] rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
            >
              {copied ? <FiCheck className="text-emerald-400" /> : null}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/30 transition-all hover:scale-105 flex items-center gap-1.5"
            >
              <FiDownload size={14} />
              <span>Download .geojson</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
