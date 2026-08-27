import React, { useState } from 'react';
import { FiDownload, FiMessageSquare } from 'react-icons/fi';
import GeoJSONPreview from './GeoJSONPreview';
import SMSPreview from './SMSPreview';

/**
 * Export actions bottom bar. Fulfils the "action, not dashboard" requirement.
 */
const ExportPanel = () => {
  const [showGeoJSON, setShowGeoJSON] = useState(false);
  const [showSMS, setShowSMS] = useState(false);

  return (
    <div className="flex gap-4">
      <button 
        onClick={() => setShowGeoJSON(true)}
        className="flex items-center gap-2 px-4 py-1.5 bg-shade-dark border border-shade-accent/50 text-shade-accent rounded hover:bg-shade-accent hover:text-shade-dark transition-colors text-sm font-mono"
      >
        <FiDownload />
        <span>Export Work Order (GeoJSON)</span>
      </button>

      <button 
        onClick={() => setShowSMS(true)}
        className="flex items-center gap-2 px-4 py-1.5 bg-shade-dark border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors text-sm font-mono"
      >
        <FiMessageSquare />
        <span>Draft Resident Alerts (SMS)</span>
      </button>

      {showGeoJSON && <GeoJSONPreview onClose={() => setShowGeoJSON(false)} />}
      {showSMS && <SMSPreview onClose={() => setShowSMS(false)} />}
    </div>
  );
};

export default ExportPanel;
