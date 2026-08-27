import React, { useState, useEffect } from 'react';
import useMapStore from '../../store/useMapStore';
import { gridService } from '../../services/gridService';
import { FiPlay, FiPause, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function HeatwaveTimeline() {
  const { selectedDistrict, setGridData } = useMapStore();
  const [hour, setHour] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch grid whenever hour or district changes
  useEffect(() => {
    async function updateHeatHour() {
      try {
        const data = await gridService.getGrid(selectedDistrict, hour);
        if (data && data.length > 0) {
          setGridData(data);
        }
      } catch (e) {
        console.warn("Could not fetch hourly grid:", e);
      }
    }
    updateHeatHour();
  }, [hour, selectedDistrict]);

  // Autoplay simulation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setHour(prev => (prev >= 18 ? 6 : prev + 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatHour = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${period}`;
  };

  const isPeakHour = hour >= 14 && hour <= 16;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-xl border border-cyan-500/50 rounded-2xl px-5 py-2.5 shadow-2xl z-20 font-mono text-xs text-cyan-50 flex items-center gap-4 select-none">
      
      {/* Play/Pause Button */}
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-2 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 rounded-xl border border-cyan-600/40 transition-colors flex items-center gap-1 font-bold"
        title="Play 12-Hour Microclimate Heatwave Progression"
      >
        {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />}
        <span>{isPlaying ? 'Pause' : 'Play Diurnal'}</span>
      </button>

      {/* Clock Display */}
      <div className="flex items-center gap-1.5 min-w-[90px]">
        <FiClock className="text-cyan-400" />
        <span className="font-bold text-cyan-300 text-sm">{formatHour(hour)}</span>
      </div>

      {/* Slider Bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400">6 AM</span>
        <input 
          type="range" 
          min="6" 
          max="18" 
          step="1"
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="w-48 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-[10px] text-gray-400">6 PM</span>
      </div>

      {/* Peak Warning Indicator */}
      {isPeakHour && (
        <div className="flex items-center gap-1 bg-red-950/80 text-red-300 border border-red-500/60 px-2.5 py-1 rounded-xl animate-pulse text-[10px] font-bold">
          <FiAlertTriangle size={12} />
          <span>SOLAR THERMAL PEAK (45.2°C)</span>
        </div>
      )}
    </div>
  );
}
