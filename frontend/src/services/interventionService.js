import api from './api';

export const interventionService = {
  simulateIntervention: async (request) => {
    // request: { cellIds: [], type: 'SHADE_SAIL' }
    const response = await api.post('/interventions/simulate', request);
    return response.data;
  },

  optimizeBudget: async (budgetRequest) => {
    // budgetRequest: { budget: 50000, targetGroup: 'elderly' }
    const response = await api.post('/interventions/optimize', budgetRequest);
    return response.data;
  }
};
