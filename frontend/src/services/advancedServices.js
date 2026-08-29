import api from './api';

export const routingService = {
  /**
   * Fetches cool route comparison.
   * Supports both object params and positional arguments.
   */
  getCoolPath: async (start_lat_or_params, start_lon, end_lat, end_lon, district = "Maryvale", hour = 15.0) => {
    let params = {};
    if (typeof start_lat_or_params === 'object' && start_lat_or_params !== null) {
      params = start_lat_or_params;
    } else {
      params = {
        start_lat: start_lat_or_params !== undefined ? start_lat_or_params : 33.4910,
        start_lon: start_lon !== undefined ? start_lon : -112.1810,
        end_lat: end_lat !== undefined ? end_lat : 33.4975,
        end_lon: end_lon !== undefined ? end_lon : -112.1730,
        district: district || "Maryvale",
        hour: hour !== undefined ? hour : 15.0
      };
    }
    const response = await api.get('/routing/cool-path', { params });
    return response.data;
  }
};

export const correlationService = {
  getHealthStudy: async (district = "Maryvale", budget = 50000.0, hour = 15.0) => {
    const params = typeof district === 'object' && district !== null 
      ? district 
      : { district, budget, hour };
    const response = await api.get('/correlation/health-impact', { params });
    return response.data;
  }
};
