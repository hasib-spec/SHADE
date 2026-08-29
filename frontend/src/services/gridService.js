import api from './api';

export const gridService = {
  getGrid: async (district = "Maryvale", hour = 15.0, lat = null, lon = null) => {
    const params = { district, hour };
    if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
      params.lat = lat;
      params.lon = lon;
    }
    const response = await api.get('/grid', { params });
    return response.data;
  },

  getHotspots: async (district = "Maryvale", limit = 10) => {
    const response = await api.get('/hotspots', {
      params: { district, limit }
    });
    return response.data;
  },

  getCellDetails: async (cellId, district = "Maryvale") => {
    const response = await api.get('/grid', { params: { district } });
    const cells = response.data || [];
    return cells.find(c => c.id === cellId || c.cell_id === cellId) || null;
  }
};

export default gridService;
