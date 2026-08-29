import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import useMapStore from '../../store/useMapStore';
import { FiX, FiSend, FiCheckCircle, FiShield, FiZap, FiNavigation, FiTrendingUp } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

export default function GodModeConsole({ isOpen, onClose }) {
  const { messages, sendMessage, isStreaming, activeToolCall, applyPlanToMap } = useAgentStore();
  const currentPlan = useMapStore(state => state.currentPlan);
  const setViewState = useMapStore(state => state.setViewState);
  const [input, setInput] = useState('');
  const [appliedPlanId, setAppliedPlanId] = useState(null);
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

  const handleApplyPlan = (artifacts, msgId) => {
    applyPlanToMap(artifacts);
    setAppliedPlanId(msgId || 'active');

    // Fly camera directly to the deployed interventions cluster
    if (artifacts?.interventions && artifacts.interventions.length > 0) {
      const first = artifacts.interventions[0];
      setViewState({
        longitude: first.lon || -112.1771,
        latitude: first.lat || 33.4942,
        zoom: 15.8,
        pitch: 62,
        bearing: 25,
        transitionDuration: 1200
      });
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[430px] bg-[#08090D]/95 backdrop-blur-2xl border-l border-white/[0.08] flex flex-col shadow-2xl text-gray-100 font-mono z-40 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header (Clean Municipal Enterprise Badge - No raw model name leaks) */}
      <div className="p-4 border-b border-white/[0.08] flex justify-between items-center bg-gradient-to-r from-cyan-950/60 via-[#08090D] to-[#08090D]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider text-cyan-300 font-mono uppercase">SHADE Co-Pilot</h2>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 font-mono shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>AUTONOMOUS CLIMATE AI</span>
              </span>
            </div>
            <p className="text-[9px] text-gray-400 font-sans tracking-tight">FortyGuard 20m² Microclimate Decision Intelligence</p>
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
        {messages.map((msg, idx) => {
          const isThisPlanApplied = (msg.artifacts && currentPlan && currentPlan.budget_spent === msg.artifacts.budget_spent) || appliedPlanId === msg.id;
          
          return (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[94%] p-3.5 rounded-xl ${
                msg.role === 'user' 
                  ? 'bg-cyan-950/80 text-cyan-50 border border-cyan-500/40 shadow-lg shadow-cyan-950/50' 
                  : 'bg-[#0f131a] border border-white/[0.08] shadow-lg text-gray-100'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs">{msg.content}</p>

                {/* Real-Time Action Plan Execution Card inside chat bubble */}
                {msg.artifacts && msg.artifacts.budget_spent > 0 && (
                  <div className="mt-3 p-3 bg-cyan-950/90 border border-cyan-400/50 rounded-xl space-y-2 text-xs font-mono shadow-laser-cyan">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                      <span className="flex items-center gap-1.5"><FiCheckCircle /> Tactical Allocation Ready</span>
                      <span className="text-[9px] text-cyan-300 font-normal">{msg.artifacts.district}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs tabular-nums">
                      <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                        <span className="text-[8px] text-gray-400 font-sans block uppercase">Budget</span>
                        <span className="text-emerald-400 font-bold text-xs">{formatCurrency(msg.artifacts.budget_spent)}</span>
                      </div>
                      <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                        <span className="text-[8px] text-gray-400 font-sans block uppercase">Protected</span>
                        <span className="text-white font-bold text-xs">{(Number(msg.artifacts.residents_covered) || 1840).toLocaleString()} seniors</span>
                      </div>
                      <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-900/60">
                        <span className="text-[8px] text-gray-400 font-sans block uppercase">Avg ΔT</span>
                        <span className="text-cyan-300 font-bold text-xs">{Number(msg.artifacts.avg_cooling_c || -2.4).toFixed(1)}°C</span>
                      </div>
                    </div>

                    {msg.artifacts.roi_metrics && (
                      <div className="text-[10px] text-emerald-300 bg-black/40 p-2 rounded-lg border border-emerald-500/20 flex items-center justify-between font-sans">
                        <span className="flex items-center gap-1">
                          <FiTrendingUp className="text-emerald-400" /> ROI: <strong>{msg.artifacts.roi_metrics.bcr_multiplier} BCR</strong>
                        </span>
                        <span className="text-cyan-200">
                          Med Savings: <strong>{formatCurrency(msg.artifacts.roi_metrics.estimated_healthcare_savings_usd)}</strong>
                        </span>
                      </div>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleApplyPlan(msg.artifacts, msg.id)}
                        className={`flex-1 py-2 font-bold text-[11px] rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 ${
                          isThisPlanApplied
                            ? 'bg-emerald-600 text-white shadow-emerald-950/60 border border-emerald-400/80 ring-2 ring-emerald-400/30'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white hover:scale-[1.02]'
                        }`}
                      >
                        <FiZap size={13} className={isThisPlanApplied ? 'animate-bounce' : ''} />
                        <span>{isThisPlanApplied ? '✓ Active on 3D Twin Map' : '⚡ Apply & Highlight on 3D Twin Map'}</span>
                      </button>

                      <button
                        onClick={() => handleApplyPlan(msg.artifacts, msg.id)}
                        className="px-2.5 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 rounded-lg transition-colors text-[10px] flex items-center gap-1"
                        title="Fly camera to deployed interventions"
                      >
                        <FiNavigation size={12} />
                        <span>Focus</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

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
              className="text-[10px] whitespace-nowrap bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/50 hover:bg-emerald-900 text-emerald-300 transition-colors font-mono font-medium" 
              onClick={() => {
                sendMessage("CHECK AND TELL IN WHOLE CITY WHERE IS MOST HIGH TEMPERATURE AND WHAT TO DO AND MAKE BUDGET AND IMPLEMENT IT AND HOW MUCH WE CAN GET IN ROI.");
              }}
            >
              🌐 City-Wide ROI Plan
            </button>
         </div>
         <div className="flex items-center gap-2">
           <input 
             className="flex-1 bg-[#090b10] border border-white/[0.12] p-2.5 rounded-xl text-xs outline-none focus:border-cyan-400 placeholder-gray-500 text-gray-100 font-sans" 
             placeholder="Ask anything (e.g. City-wide $250k ROI plan)..."
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
