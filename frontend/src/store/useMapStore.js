import { create } from 'zustand';
import { gridService } from '../services/gridService';

export const useMapStore = create((set, get) => ({
  gridData: [],
  selectedDistrict: 'Maryvale',
  currentLocationMeta: {
    name: 'Maryvale, Phoenix, AZ',
    lat: 33.4942,
    lon: -112.1771,
    zoom: 14.5
  },
  selectedHour: 15,
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
  setCurrentLocationMeta: (meta) => set({ currentLocationMeta: meta }),
  
  setSelectedHour: async (hour) => {
    set({ selectedHour: hour });
    const { selectedDistrict, currentLocationMeta } = get();
    try {
      const data = await gridService.getGrid(
        selectedDistrict, 
        hour, 
        currentLocationMeta?.lat, 
        currentLocationMeta?.lon
      );
      if (data && data.length > 0) {
        set({ gridData: data });
      }
    } catch (e) {
      console.warn("Could not re-fetch hourly grid data:", e);
    }
  },

  setRawDistrict: (district, meta = null) => {
    set({ 
      selectedDistrict: district,
      currentLocationMeta: meta || { name: district, lat: meta?.lat, lon: meta?.lon }
    });
  },

  setSelectedDistrict: async (district, customLat = null, customLon = null) => {
    set({ selectedDistrict: district });
    
    let coords = { longitude: -112.1771, latitude: 33.4942, zoom: 14.5, pitch: 50, bearing: 15 };
    if (district.toLowerCase() === 'arcadia') {
      coords = { longitude: -111.9540, latitude: 33.4980, zoom: 14.5, pitch: 50, bearing: 15 };
    } else if (customLat !== null && customLon !== null) {
      coords = { longitude: customLon, latitude: customLat, zoom: 15.5, pitch: 58, bearing: 22 };
    }

    set({ 
      viewState: coords,
      currentLocationMeta: {
        name: district,
        lat: coords.latitude,
        lon: coords.longitude,
        zoom: coords.zoom
      }
    });

    try {
      const data = await gridService.getGrid(district, get().selectedHour, customLat, customLon);
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
