import { create } from 'zustand';
import { gridService } from '../services/gridService';

export const useMapStore = create((set, get) => ({
  gridData: [],
  selectedDistrict: 'Maryvale',
  selectedCell: null,
  viewMode: '3d_hex', // '3d_hex' | '20m_cells' | '2m_plane'
  temperatureMode: 'air_temp', // 'air_temp' | 'mrt_perceived'
  currentPlan: null,
  interventionResults: null,
  isSimulating: false,
  sliderPosition: 50,
  viewState: {
    longitude: -112.1771,
    latitude: 33.4942,
    zoom: 14.5,
    pitch: 50,
    bearing: 15
  },
  
  setViewState: (viewState) => set({ viewState }),
  setGridData: (data) => set({ gridData: data }),
  setSelectedDistrict: async (district) => {
    set({ selectedDistrict: district });
    const coords = district.toLowerCase() === 'arcadia' 
      ? { longitude: -111.9540, latitude: 33.4980, zoom: 14.5, pitch: 50, bearing: 15 }
      : { longitude: -112.1771, latitude: 33.4942, zoom: 14.5, pitch: 50, bearing: 15 };
    set({ viewState: coords });
    try {
      const data = await gridService.getGrid(district);
      set({ gridData: data });
    } catch (e) {
      console.warn("Could not fetch grid data:", e);
    }
  },
  setSelectedCell: (cell) => set({ selectedCell: cell }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTemperatureMode: (mode) => set({ temperatureMode: mode }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setInterventionResults: (results) => set({ interventionResults: results }),
  setIsSimulating: (isSim) => set({ isSimulating: isSim }),
  setSliderPosition: (pos) => set({ sliderPosition: pos }),
}));

export default useMapStore;
