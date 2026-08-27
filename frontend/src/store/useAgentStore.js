import { create } from 'zustand';
import { agentService } from '../services/agentService';

export const useAgentStore = create((set, get) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 **SHADE Decision Engine Online.**\n\nI am your **Temperature Co-Pilot** calibrated at FortyGuard's 20m² grid and 2-meter pedestrian plane. Ready to calculate heat equity risk (HERI), simulate interventions, and answer any municipal cooling questions in real-time.\n\n*Click below or type any query to begin.*"
    }
  ],
  isStreaming: false,
  demoMode: false,
  activeToolCall: null,
  currentPlan: null,
  
  sendMessage: async (text) => {
    if (!text || !text.trim()) return;
    
    set({ isStreaming: true });
    const userMsg = { id: Date.now(), role: 'user', content: text.trim() };
    const currentMessages = [...get().messages, userMsg];
    set({ messages: currentMessages });
    
    try {
      set({ activeToolCall: "⚙️ Processing query with FortyGuard 20m² microclimate intelligence..." });
      
      const res = await agentService.sendMessage(text.trim(), get().demoMode, currentMessages);
      
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.response || res.content || "Analysis complete.",
        artifacts: res.artifacts || null
      };
      
      set(state => ({ 
        messages: [...state.messages, assistantMsg],
        currentPlan: res.artifacts || null
      }));
    } catch (error) {
      console.error("Agent chat failed:", error);
      const errMsg = error.response?.data?.detail || error.message || "Could not connect to backend.";
      const errorBubble = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ **AI Co-Pilot Notice**: ${errMsg}\n\n*Please ensure your backend is reachable and Gemini/NIM API credentials are set.*`
      };
      set(state => ({ messages: [...state.messages, errorBubble] }));
    } finally {
      set({ isStreaming: false, activeToolCall: null });
    }
  },
  setDemoMode: (val) => set({ demoMode: val }),
  setActiveToolCall: (tool) => set({ activeToolCall: tool }),
  applyPlanToMap: (plan) => {
    console.log("Applying plan to 3D Twin:", plan);
  }
}));

export default useAgentStore;
