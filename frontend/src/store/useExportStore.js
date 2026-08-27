import { create } from 'zustand';

const useExportStore = create((set) => ({
  lastGeoJSON: null,
  setLastGeoJSON: (geojson) => set({ lastGeoJSON: geojson }),
  
  lastSMSAlerts: null,
  setLastSMSAlerts: (sms) => set({ lastSMSAlerts: sms }),
  
  exportHistory: [],
  addToHistory: (exportAction) => set((state) => ({ 
    exportHistory: [exportAction, ...state.exportHistory] 
  })),
}));

export default useExportStore;
