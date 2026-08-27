import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';

export default function GodModeConsole() {
  const { messages, sendMessage, isStreaming, demoMode, setDemoMode, activeToolCall } = useAgentStore();
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="absolute right-4 top-4 w-[420px] h-[82vh] bg-black/75 backdrop-blur-lg border border-cyan-500/40 rounded-xl flex flex-col shadow-2xl text-cyan-50 font-mono z-10">
      {/* Header */}
      <div className="p-3 border-b border-cyan-500/30 flex justify-between items-center bg-cyan-950/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <h2 className="text-sm font-bold tracking-widest text-cyan-400">GOD MODE L6</h2>
          <span className="text-[10px] text-cyan-300/60 bg-cyan-900/40 px-1.5 py-0.5 rounded border border-cyan-700/30">
            Gemini 3.6 Flash
          </span>
        </div>
        <button 
          onClick={() => setDemoMode(!demoMode)} 
          className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
            demoMode 
              ? 'bg-amber-600/30 text-amber-300 border-amber-500' 
              : 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
          }`}
          title="Toggle between Live AI reasoning and Flagship Demo mode"
        >
          {demoMode ? 'DEMO MODE' : 'LIVE AI'}
        </button>
      </div>
      
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[92%] p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-cyan-700/40 text-cyan-50 border border-cyan-500/40' 
                : 'bg-gray-900/90 border border-gray-700 shadow-xl text-gray-100'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse bg-cyan-950/40 p-2 rounded border border-cyan-800">
            <span className="animate-spin">⚙️</span>
            <span>{activeToolCall || "AI Co-Pilot is analyzing microclimate data..."}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input Console */}
      <div className="p-3 border-t border-cyan-500/30 bg-black/60 rounded-b-xl">
         <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            <button 
              className="text-[10px] whitespace-nowrap bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-700/60 hover:bg-cyan-800 text-cyan-300 transition-colors" 
              onClick={() => {
                sendMessage("🚩 $50k Maryvale Elderly Plan");
              }}
            >
              🚩 $50k Maryvale Plan
            </button>
            <button 
              className="text-[10px] whitespace-nowrap bg-gray-900/80 px-2.5 py-1 rounded border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors" 
              onClick={() => {
                sendMessage("What is the peak heat risk in Maryvale tomorrow at 2 PM?");
              }}
            >
              ☀️ 2 PM Heat Risk
            </button>
         </div>
         <div className="flex">
           <input 
             className="flex-1 bg-black/60 border border-cyan-700/80 p-2.5 rounded-l text-sm outline-none focus:border-cyan-400 placeholder-cyan-800 text-cyan-100" 
             placeholder="Ask anything (e.g. Maryvale 2 PM heat near 55th Ave)..."
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             disabled={isStreaming}
           />
           <button 
             className="bg-cyan-600 px-5 rounded-r font-bold hover:bg-cyan-500 text-sm disabled:opacity-50 transition-colors" 
             onClick={handleSend}
             disabled={isStreaming || !input.trim()}
           >
             EXEC
           </button>
         </div>
      </div>
    </div>
  );
}
