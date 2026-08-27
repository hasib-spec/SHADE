import React, { useState } from 'react';
import { useAgentStore } from '../../store/useAgentStore';

export default function GodModeConsole() {
  const { messages, sendMessage, isStreaming, demoMode, setDemoMode } = useAgentStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="absolute right-4 top-4 w-96 h-[80vh] bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl flex flex-col shadow-2xl text-cyan-50 font-mono z-10">
      <div className="p-3 border-b border-cyan-500/30 flex justify-between items-center bg-cyan-900/20 rounded-t-xl">
        <h2 className="text-sm font-bold tracking-widest text-cyan-400">GOD MODE L6</h2>
        <button onClick={() => setDemoMode(!demoMode)} className="text-[10px] px-2 py-1 bg-cyan-800/50 rounded border border-cyan-600">
          {demoMode ? 'DEMO' : 'LIVE'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-cyan-600/40 text-cyan-50 border border-cyan-500/30' : 'bg-gray-800/80 border border-gray-600/50 shadow-lg text-gray-200'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && <div className="text-cyan-500 text-xs animate-pulse">⚙️ Calling spatial solver...</div>}
      </div>
      
      <div className="p-3 border-t border-cyan-500/30 bg-black/40 rounded-b-xl">
         <div className="flex gap-2 mb-2">
            <button className="text-[10px] bg-cyan-900/50 px-2 py-1 rounded border border-cyan-700/50 hover:bg-cyan-800 text-cyan-300 transition-colors" onClick={() => setInput("🚩 $50k Maryvale Elderly Plan")}>🚩 $50k Maryvale Elderly Plan</button>
         </div>
         <div className="flex">
           <input 
             className="flex-1 bg-black/50 border border-cyan-700 p-2 rounded-l text-sm outline-none focus:border-cyan-400 placeholder-cyan-800" 
             placeholder="Prompt Nim LLM..."
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
           />
           <button className="bg-cyan-600 px-4 rounded-r font-bold hover:bg-cyan-500 text-sm" onClick={handleSend}>EXEC</button>
         </div>
      </div>
    </div>
  );
}
