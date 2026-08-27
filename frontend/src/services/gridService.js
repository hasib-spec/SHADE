import api from './api';

export const gridService = {
  getGrid: async (district = "Maryvale", hour = 15.0) => {
    const response = await api.get('/grid', {
      params: { district, hour }
    });
    return response.data;
  },

  getHotspots: async (district = "Maryvale", limit = 10) => {
    const response = await api.get('/hotspots', {
      params: { district, limit }
    });
    return response.data;
  },

  getCellDetails: async (cellId) => {
    const response = await api.get(`/grid?district=Maryvale`);
    const cells = response.data || [];
    return cells.find(c => c.id === cellId) || null;
  }
};

export default gridService;
