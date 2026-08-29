import React, { useState, useEffect } from 'react';
import { FiX, FiMessageSquare, FiCopy, FiCheck, FiSend, FiSmartphone } from 'react-icons/fi';
import { exportService } from '../../services/exportService';

export default function SMSPreview({ onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSMS() {
      try {
        const res = await exportService.exportSMS({ target_demographic: 'elderly' });
        setAlerts(res);
      } catch (e) {
        console.error("Failed to load SMS alerts:", e);
      } finally {
        setLoading(false);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none font-sans">
      <div className="bg-[#08090D] border border-purple-500/40 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative text-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FiSmartphone size={16} />
            </div>
            <div>
              <h3 className="font-bold text-xs font-mono text-purple-300">Bilingual Resident Heat Alerts</h3>
              <p className="text-[10px] text-gray-400 font-sans">Automated Twilio / Nixle SMS Emergency Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {/* Content Box */}
        <div className="space-y-3.5 mb-4">
          <p className="text-[10px] text-gray-400 font-mono">
            TARGET: Maryvale High-Risk Census Tract (SVI 0.94) • 1,840 vulnerable elderly residents
          </p>
          
          {loading ? (
            <div className="text-center py-10 text-xs font-mono text-cyan-400 animate-pulse">
              Synthesizing localized emergency warnings...
            </div>
          ) : alerts.length > 0 ? (
            <>
              {/* English Broadcast */}
              <div className="bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-500/30 space-y-1.5">
                <span className="text-[10px] font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  🇺🇸 English Broadcast
                </span>
                <p className="text-xs text-gray-200 leading-relaxed font-sans">
                  {alerts[0].english}
                </p>
              </div>

              {/* Spanish Broadcast */}
              <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  🇲🇽 Transmisión en Español
                </span>
                <p className="text-xs text-gray-200 leading-relaxed font-sans">
                  {alerts[0].spanish}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400 text-xs font-mono">No alerts returned from backend.</div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 font-mono text-xs">
          <span className="text-[10px] text-gray-400 font-sans">Multi-lingual emergency dispatch ready</span>
          <div className="flex gap-2.5">
            <button 
              onClick={onClose} 
              className="px-3.5 py-2 border border-white/[0.12] rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all hover:scale-105 flex items-center gap-1.5"
            >
              {copied ? <FiCheck size={14} className="text-emerald-300" /> : <FiCopy size={14} />}
              <span>{copied ? "Copied!" : "Copy Broadcast"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
