import api from './api';

export const exportService = {
  exportGeoJSON: async (planData) => {
    const response = await api.post('/export/geojson', planData);
    return response.data;
  },

  exportSMS: async (payload = { target_demographic: 'elderly' }) => {
    const response = await api.post('/export/sms', payload);
    return response.data;
  }
};
