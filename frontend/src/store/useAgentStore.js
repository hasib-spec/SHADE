import { create } from 'zustand';
import { agentService } from '../services/agentService';
import { useMapStore } from './useMapStore';

export const useAgentStore = create((set, get) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 **SHADE Decision Engine Online.**\n\nI am your **Temperature Co-Pilot** calibrated at FortyGuard's 20m² grid and 2-meter pedestrian plane. Ready to calculate heat equity risk (HERI), simulate interventions, and deploy tactical cooling budgets in real-time for ANY location worldwide.\n\n*Click a quick chip below or type any global location to begin.*"
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
      set({ activeToolCall: "📍 Geocoding & Querying Real-Time Microclimate Telemetry..." });
      
      const res = await agentService.sendMessage(text.trim(), get().demoMode, currentMessages);
      
      const artifacts = res.artifacts || null;
      const hasPlan = artifacts && (artifacts.budget_spent > 0 || artifacts.interventions?.length > 0);
      
      // Real-Time Global Map Synchronization:
      if (artifacts) {
        if (artifacts.grid_cells && artifacts.grid_cells.length > 0) {
          useMapStore.getState().setGridData(artifacts.grid_cells);
        }
        if (artifacts.district) {
          useMapStore.getState().setRawDistrict(artifacts.district);
        }
        if (artifacts.location_meta) {
          useMapStore.getState().setViewState({
            longitude: artifacts.location_meta.lon,
            latitude: artifacts.location_meta.lat,
            zoom: artifacts.location_meta.zoom || 15.5,
            pitch: 58,
            bearing: 22,
            transitionDuration: 1500
          });
        }
      }

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.response || res.content || "Analysis complete.",
        artifacts: artifacts,
        hasActionPlan: hasPlan
      };
      
      if (hasPlan) {
        set({ currentPlan: artifacts });
        useMapStore.getState().setCurrentPlan(artifacts);
      }
      
      set(state => ({ 
        messages: [...state.messages, assistantMsg]
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
    set({ currentPlan: plan });
    useMapStore.getState().setCurrentPlan(plan);
    if (plan?.grid_cells && plan.grid_cells.length > 0) {
      useMapStore.getState().setGridData(plan.grid_cells);
    }
    if (plan?.district) {
      useMapStore.getState().setRawDistrict(plan.district);
    }
    if (plan?.location_meta) {
      useMapStore.getState().setViewState({
        longitude: plan.location_meta.lon,
        latitude: plan.location_meta.lat,
        zoom: plan.location_meta.zoom || 15.5,
        pitch: 58,
        bearing: 22,
        transitionDuration: 1500
      });
    }
  }
}));

export default useAgentStore;
