import React from 'react';
import { FiDownload, FiMessageSquare } from 'react-icons/fi';

/**
 * Export actions bottom bar.
 */
const ExportPanel = ({ onOpenGeoJSON, onOpenSMS }) => {
  return (
    <div className="flex items-center gap-3 font-mono text-xs select-none">
      <button 
        onClick={onOpenGeoJSON}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-black/80 border border-cyan-500/50 text-cyan-300 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-md shadow-cyan-950/50 font-bold hover:scale-105"
        title="Download QGIS/ArcGIS Work Order GeoJSON"
      >
        <FiDownload size={14} className="text-cyan-400" />
        <span>Export Work Order (GeoJSON)</span>
      </button>

      <button 
        onClick={onOpenSMS}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-black/80 border border-purple-500/50 text-purple-300 rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-md shadow-purple-950/50 font-bold hover:scale-105"
        title="Draft Bilingual SMS Emergency Alerts"
      >
        <FiMessageSquare size={14} className="text-purple-400" />
        <span>Draft Resident Alerts (SMS)</span>
      </button>
    </div>
  );
};

export default ExportPanel;
