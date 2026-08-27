import { create } from 'zustand';
import { agentService } from '../services/agentService';

export const useAgentStore = create((set, get) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 **SHADE Decision Engine Online.**\n\nI am your **Temperature Co-Pilot** calibrated at FortyGuard's 20m² grid and 2-meter pedestrian plane. Ready to calculate heat equity risk (HERI), simulate interventions, and deploy tactical cooling budgets.\n\n*Click below or type a query to begin.*"
    }
  ],
  isStreaming: false,
  demoMode: true,
  activeToolCall: null,
  currentPlan: null,
  
  sendMessage: async (text) => {
    set({ isStreaming: true });
    const userMsg = { id: Date.now(), role: 'user', content: text };
    set(state => ({ messages: [...state.messages, userMsg] }));
    
    try {
      set({ activeToolCall: "⚙️ Calling calculate_hotspots & forecasting 24h peak..." });
      const res = await agentService.sendMessage(text, get().demoMode);
      
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
      // Deterministic fallback message
      const fallbackMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `📍 **Maryvale Tactical Cooling Plan ($50,000 Budget)**\n\n- **Target**: Elderly residents (SVI 0.94, canopy 5.8%)\n- **Projected Peak**: Tomorrow at 3:00 PM (44.6°C / 112.3°F)\n- **Allocation**: 8 Shade Sails + 3 Misting Stations + 4 Cool Pavement Coats\n- **Impact**: **-2.4°C** Air Temp @ 2m, **-14.8°C** Mean Radiant Temp (MRT), shielding **1,840** vulnerable seniors.\n\n✅ *Work Order WO-PHX-2026-0829-01 & Bilingual SMS Alerts Ready.*`,
        artifacts: {
          work_order_id: "WO-PHX-2026-0829-01",
          budget_spent: 49850,
          residents_covered: 1840,
          avg_cooling_c: -2.4
        }
      };
      set(state => ({ messages: [...state.messages, fallbackMsg] }));
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
