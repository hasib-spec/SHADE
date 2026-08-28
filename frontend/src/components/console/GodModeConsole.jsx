import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { FiX, FiMessageSquare, FiSend, FiCpu, FiCornerDownLeft } from 'react-icons/fi';

export default function GodModeConsole({ isOpen, onClose }) {
  const { messages, sendMessage, isStreaming, activeToolCall } = useAgentStore();
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
    <aside className="absolute right-0 top-0 bottom-0 w-[420px] bg-black/95 backdrop-blur-2xl border-l border-cyan-500/30 flex flex-col shadow-2xl text-cyan-50 font-mono z-40 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-cyan-500/30 flex justify-between items-center bg-gradient-to-r from-cyan-950/80 via-black to-black">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-cyan-300">SHADE Co-Pilot</h2>
            <p className="text-[9px] text-cyan-400/70 tracking-tight">Autonomous Heat Action Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
            <FiCpu size={11} />
            <span>LIVE AI</span>
          </span>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close Co-Pilot Panel"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs select-text">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[92%] p-3.5 rounded-xl ${
              msg.role === 'user' 
                ? 'bg-cyan-700/40 text-cyan-50 border border-cyan-500/40 shadow-md' 
                : 'bg-gray-900/90 border border-gray-700 shadow-lg text-gray-100'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-800">
            <span className="animate-spin">⚙️</span>
            <span>{activeToolCall || "Analyzing FortyGuard 20m² microclimate intelligence..."}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Console */}
      <div className="p-3.5 border-t border-cyan-500/30 bg-black/80">
         <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1">
            <button 
              className="text-[10px] whitespace-nowrap bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-700/50 hover:bg-cyan-800 text-cyan-300 transition-colors" 
              onClick={() => {
                sendMessage("Provide the complete $50,000 tactical heat deployment plan for Maryvale targeting vulnerable seniors before 3 PM peak.");
              }}
            >
              🚩 $50k Maryvale Plan
            </button>
            <button 
              className="text-[10px] whitespace-nowrap bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors" 
              onClick={() => {
                sendMessage("Compare Maryvale and Arcadia heat vulnerability and recommend 3 tactical priorities.");
              }}
            >
              ⚖️ Maryvale vs Arcadia
            </button>
            <button 
              className="text-[10px] whitespace-nowrap bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-700/50 hover:bg-red-800 text-red-300 transition-colors" 
              onClick={() => {
                sendMessage("What is the peak heat risk at 2 PM near 55th Ave & W Whitton Ave?");
              }}
            >
              ☀️ 2 PM Heat Risk
            </button>
         </div>
         <div className="flex items-center gap-2">
           <input 
             className="flex-1 bg-black/60 border border-cyan-700/70 p-2.5 rounded-xl text-xs outline-none focus:border-cyan-400 placeholder-cyan-800 text-cyan-100" 
             placeholder="Ask anything (e.g. Maryvale 2 PM heat near 55th Ave)..."
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             disabled={isStreaming}
           />
           <button 
             className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-cyan-500/20" 
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
