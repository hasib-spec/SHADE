import api from './api';

export const agentService = {
  /**
   * Sends a message to the agent.
   */
  sendMessage: async (messageContent, demoMode = false, allMessages = []) => {
    const payload = {
      messages: allMessages.length > 0 
        ? allMessages.map(m => ({ role: m.role || 'user', content: m.content || '' }))
        : [{ role: 'user', content: messageContent }],
      message: messageContent,
      demoMode: Boolean(demoMode)
    };
    
    const response = await api.post('/agent/chat', payload);
    return response.data;
  }
};
