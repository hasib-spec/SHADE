import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import useMapStore from '../../store/useMapStore';
import { FiX, FiMessageSquare, FiSend, FiCpu, FiCheckCircle, FiShield, FiDollarSign, FiZap } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

export default function GodModeConsole({ isOpen, onClose }) {
  const { messages, sendMessage, isStreaming, activeToolCall, applyPlanToMap } = useAgentStore();
  const currentPlan = useMapStore(state => state.currentPlan);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isStreaming, isOpen]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[430px] bg-[#08090D]/95 backdrop-blur-2xl border-l border-white/[0.08] flex flex-col shadow-2xl text-gray-100 font-mono z-40 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/[0.08] flex justify-between items-center bg-gradient-to-r from-cyan-950/50 via-[#08090D] to-[#08090D]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider text-cyan-300 font-mono uppercase">SHADE Co-Pilot</h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
                <FiCpu size={10} />
                <span>GEMINI LIVE</span>
              </span>
            </div>
            <p className="text-[9px] text-gray-400 font-sans tracking-tight">Autonomous Municipal Climate Action Engine</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Close Co-Pilot Panel"
        >
          <FiX size={16} />
        </button>
      </div>
      
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs select-text">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[92%] p-3.5 rounded-xl ${
              msg.role === 'user' 
                ? 'bg-cyan-950/80 text-cyan-50 border border-cyan-500/40 shadow-lg shadow-cyan-950/50' 
                : 'bg-[#0f131a] border border-white/[0.08] shadow-lg text-gray-100'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs">{msg.content}</p>

              {/* Action Plan Execution Card inside chat bubble */}
              {msg.artifacts && msg.artifacts.budget_spent > 0 && (
                <div className="mt-3 p-3 bg-cyan-950/90 border border-cyan-400/50 rounded-xl space-y-2 text-xs font-mono shadow-laser-cyan">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5"><FiCheckCircle /> Tactical Allocation Live</span>
                    <span className="text-[9px] text-cyan-300 font-normal">{msg.artifacts.district}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs tabular-nums">
                    <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                      <span className="text-[8px] text-gray-400 font-sans block uppercase">Budget</span>
                      <span className="text-emerald-400 font-bold text-xs">{formatCurrency(msg.artifacts.budget_spent)}</span>
                    </div>
                    <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                      <span className="text-[8px] text-gray-400 font-sans block uppercase">Protected</span>
                      <span className="text-white font-bold text-xs">{msg.artifacts.residents_covered} seniors</span>
                    </div>
                    <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                      <span className="text-[8px] text-gray-400 font-sans block uppercase">Avg ΔT</span>
                      <span className="text-cyan-300 font-bold text-xs">{msg.artifacts.avg_cooling_c}°C</span>
                    </div>
                  </div>

                  <button
                    onClick={() => applyPlanToMap(msg.artifacts)}
                    className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] rounded-lg transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5"
                  >
                    <FiZap size={12} />
                    <span>Apply & Highlight on 3D Twin Map</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse bg-cyan-950/40 p-3 rounded-xl border border-cyan-800/60 font-mono">
            <span className="animate-spin text-sm">⚙️</span>
            <span>{activeToolCall || "Analyzing FortyGuard 20m² microclimate intelligence..."}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Console */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#050608]/90">
         <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1">
            <button 
              className="text-[10px] whitespace-nowrap bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-700/50 hover:bg-cyan-900 text-cyan-300 transition-colors font-mono font-medium" 
              onClick={() => {
                sendMessage("Provide the complete $50,000 tactical heat deployment plan for Maryvale targeting vulnerable seniors before 3 PM peak.");
              }}
            >
              🚩 $50k Maryvale Plan
            </button>
            <button 
              className="text-[10px] whitespace-nowrap bg-[#11141d] px-2.5 py-1 rounded-lg border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 transition-colors font-mono font-medium" 
              onClick={() => {
                sendMessage("Compare Maryvale and Arcadia heat vulnerability and recommend 3 tactical priorities.");
              }}
            >
              ⚖️ Maryvale vs Arcadia
            </button>
            <button 
              className="text-[10px] whitespace-nowrap bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-700/50 hover:bg-red-900 text-red-300 transition-colors font-mono font-medium" 
              onClick={() => {
                sendMessage("What is the peak heat risk at 2 PM near 55th Ave & W Whitton Ave? Allocate budget for mobile cooling.");
              }}
            >
              ☀️ 2 PM Heat & Allocate
            </button>
         </div>
         <div className="flex items-center gap-2">
           <input 
             className="flex-1 bg-[#090b10] border border-white/[0.12] p-2.5 rounded-xl text-xs outline-none focus:border-cyan-400 placeholder-gray-500 text-gray-100 font-sans" 
             placeholder="Ask anything (e.g. Maryvale 2 PM heat near 55th Ave)..."
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             disabled={isStreaming}
           />
           <button 
             className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white p-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:scale-105" 
             onClick={handleSend}
             disabled={isStreaming || !input.trim()}
             title="Send message"
           >
             <FiSend size={15} />
           </button>
         </div>
      </div>
    </aside>
  );
}
