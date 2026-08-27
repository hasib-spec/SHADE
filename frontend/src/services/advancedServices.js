import api from './api';

export const routingService = {
  getCoolPath: async (params = {}) => {
    const response = await api.get('/routing/cool-path', { params });
    return response.data;
  }
};

export const correlationService = {
  getHealthStudy: async (district = "Maryvale") => {
    const response = await api.get('/correlation/health-impact', { params: { district } });
    return response.data;
  }
};
