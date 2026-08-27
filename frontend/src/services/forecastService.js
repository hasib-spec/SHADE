import api from './api';

export const forecastService = {
  getForecast: async (lat, lon, hours = 24) => {
    const response = await api.get('/forecast', {
      params: { lat, lon, hours }
    });
    return response.data;
  }
};
