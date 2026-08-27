import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { FiMinimize2, FiMaximize2, FiMessageSquare, FiSend } from 'react-icons/fi';

export default function GodModeConsole() {
  const { messages, sendMessage, isStreaming, demoMode, setDemoMode, activeToolCall } = useAgentStore();
  const [input, setInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [messages, isStreaming, isCollapsed]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  // If collapsed, render a sleek floating pill button
  if (isCollapsed) {
    return (
      <div className="absolute right-6 top-6 z-30">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-black/85 hover:bg-cyan-950/90 border border-cyan-500/50 rounded-2xl shadow-2xl backdrop-blur-xl text-cyan-300 text-xs font-mono font-bold transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <FiMessageSquare size={16} />
          <span>SHADE Co-Pilot</span>
          <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-700/50">Open</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-6 top-6 w-[410px] h-[80vh] bg-black/85 backdrop-blur-xl border border-cyan-500/40 rounded-2xl flex flex-col shadow-2xl text-cyan-50 font-mono z-30 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Professional Municipal Header */}
      <div className="p-3.5 border-b border-cyan-500/30 flex justify-between items-center bg-gradient-to-r from-cyan-950/70 to-black rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <h2 className="text-xs font-bold tracking-wider text-cyan-300">SHADE Co-Pilot</h2>
            <p className="text-[9px] text-cyan-400/70 tracking-tight">Autonomous Heat Response Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDemoMode(!demoMode)} 
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
              demoMode 
                ? 'bg-amber-900/40 text-amber-300 border-amber-500/50' 
                : 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50'
            }`}
            title="Toggle between Live AI reasoning and Seeded Demo mode"
          >
            {demoMode ? 'DEMO' : 'LIVE AI'}
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Minimize Co-Pilot"
          >
            <FiMinimize2 size={15} />
          </button>
        </div>
      </div>
      
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[92%] p-3 rounded-xl ${
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
            <span>{activeToolCall || "Analyzing FortyGuard 20m² intelligence..."}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Console */}
      <div className="p-3 border-t border-cyan-500/30 bg-black/60 rounded-b-2xl">
         <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            <button 
              className="text-[10px] whitespace-nowrap bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-700/50 hover:bg-cyan-800 text-cyan-300 transition-colors" 
              onClick={() => {
                sendMessage("🚩 $50k Maryvale Elderly Plan");
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
         </div>
         <div className="flex items-center gap-1.5">
           <input 
             className="flex-1 bg-black/60 border border-cyan-700/70 p-2.5 rounded-xl text-xs outline-none focus:border-cyan-400 placeholder-cyan-800 text-cyan-100" 
             placeholder="Ask anything (e.g. Maryvale 2 PM heat near 55th Ave)..."
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             disabled={isStreaming}
           />
           <button 
             className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center" 
             onClick={handleSend}
             disabled={isStreaming || !input.trim()}
             title="Send message"
           >
             <FiSend size={15} />
           </button>
         </div>
      </div>
    </div>
  );
}
