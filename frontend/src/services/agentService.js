import api from './api';

export const agentService = {
  /**
   * Sends a message to the agent.
   * If streaming is needed, we would use EventSource / fetch with getReader() here.
   */
  sendMessage: async (messageContent, demoMode = true) => {
    const response = await api.post('/agent/chat', {
      message: messageContent,
      demoMode
    });
    return response.data;
  }
};
