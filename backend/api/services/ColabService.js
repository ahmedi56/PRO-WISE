
const axios = require('axios');

module.exports = {
  isAvailable: function() {
    return !!process.env.COLAB_URL;
  },

  /**
   * Standard generation (waiting for full response)
   */
  generateText: async function(prompt) {
    if (!this.isAvailable()) {
      return { success: false, message: 'Colab not configured.' };
    }

    const baseUrl = process.env.COLAB_URL.replace(/\/$/, '');
    // Only wrap if not already wrapped
    const mistralPrompt = prompt.includes('[INST]') ? prompt : `[INST] ${prompt} [/INST]`;

    try {
      const response = await axios.post(`${baseUrl}/generate`, { prompt: mistralPrompt }, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        timeout: 30000 
      });

      if (response.data && response.data.response) {
        let text = response.data.response;
        // Strip out the prompt leakage
        if (text.includes('[/INST]')) {
          text = text.split('[/INST]').pop().trim();
        }
        return { success: true, data: text };
      }
      throw new Error('Invalid response format');
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /**
   * NEW: Streaming generation
   */
  generateStream: async function(prompt) {
    if (!this.isAvailable()) throw new Error('Colab not configured');
    
    const baseUrl = process.env.COLAB_URL.replace(/\/$/, '');
    const mistralPrompt = prompt.includes('[INST]') ? prompt : `[INST] ${prompt} [/INST]`;

    const response = await axios({
      method: 'post',
      url: `${baseUrl}/stream`,
      data: { prompt: mistralPrompt },
      responseType: 'stream',
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    return response.data;
  }

};
