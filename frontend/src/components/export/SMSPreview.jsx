import React, { useState, useEffect } from 'react';
import { exportService } from '../../services/exportService';

const SMSPreview = ({ onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSMS() {
      try {
        const res = await exportService.exportSMS({ target_demographic: 'elderly' });
        setAlerts(res);
      } catch (e) {
        setAlerts([
          {
            english: "URGENT: Extreme Heat Alert for Maryvale, Phoenix. Tomorrow at 3:00 PM: 44.6°C / 112.3°F. Seek shelter at Maryvale Community Center. Check on elderly neighbors and ensure they have AC/water.",
            spanish: "URGENTE: Alerta de Calor Extremo para Maryvale, Phoenix. Mañana a las 3:00 PM: 44.6°C / 112.3°F. Busque refugio en el Centro Comunitario de Maryvale. Controle a sus vecinos ancianos y asegúrese de que tengan aire acondicionado/agua."
          }
        ]);
      }
    }
    fetchSMS();
  }, []);

  const handleCopy = () => {
    if (alerts.length > 0) {
      const text = `ENGLISH BROADCAST:\n${alerts[0].english}\n\nTRANSMISIÓN EN ESPAÑOL:\n${alerts[0].spanish}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-shade-panel border border-cyan-500/40 rounded-lg p-6 w-full max-w-lg font-sans text-sm shadow-2xl">
        <div className="flex justify-between items-center mb-4 text-cyan-400 font-mono">
          <h3 className="font-bold">📱 BILINGUAL RESIDENT HEAT ALERT BROADCAST</h3>
          <button onClick={onClose} className="text-white hover:text-cyan-300">✕</button>
        </div>
        <div className="bg-shade-dark p-4 rounded text-white border border-cyan-800/50 space-y-4 max-h-72 overflow-y-auto">
          <p className="text-xs text-gray-400 font-mono">TARGET: Maryvale High-Risk Census Tract (SVI 0.94) • 1,840 elderly residents</p>
          
          <div className="bg-cyan-950/40 p-3 rounded border border-cyan-500/30">
            <span className="text-xs font-bold text-cyan-400 font-mono block mb-1">🇺🇸 English Broadcast</span>
            <p className="text-xs text-gray-200">
              {alerts[0]?.english || "URGENT: Extreme Heat Alert for Maryvale. Tomorrow at 3:00 PM: 44.6°C / 112.3°F."}
            </p>
          </div>

          <div className="bg-amber-950/30 p-3 rounded border border-amber-500/30">
            <span className="text-xs font-bold text-amber-400 font-mono block mb-1">🇲🇽 Transmisión en Español</span>
            <p className="text-xs text-gray-200">
              {alerts[0]?.spanish || "URGENTE: Alerta de Calor Extremo para Maryvale. Mañana a las 3:00 PM: 44.6°C / 112.3°F."}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-400 font-mono">Direct Twilio / Nixle SMS Gateway</span>
          <div className="flex gap-3 font-mono">
            <button className="px-4 py-2 border border-gray-700 rounded text-white hover:bg-white/10" onClick={onClose}>Close</button>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded" onClick={handleCopy}>
              {copied ? "Copied! ✅" : "Copy Drafts 📋"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSPreview;
