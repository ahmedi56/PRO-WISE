const axios = require('axios');

// ─── CONFIGURATION ────────────────────────────────────────────────────────
const getApiKey = () => process.env.GROQ_API_KEY;
const getModel = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

module.exports = {

  /**
   * Check if the service is properly configured.
   */
  isAvailable: function() {
    const available = !!getApiKey();
    if (!available) {
      sails.log.error('GrokService: No API key found in environment (GROQ_API_KEY).');
    }
    return available;
  },

  /**
   * Generate content using Groq API (OpenAI-compatible).
   */
  generateText: async function(prompt, options = {}) {
    if (!this.isAvailable()) {
      return { success: false, message: 'No Groq API key configured.', code: 'MISSING_API_KEY' };
    }
    
    const isJson = options.responseMimeType === 'application/json';
    const modelName = options.model || getModel();

    try {
      const payload = {
        model: modelName,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxOutputTokens ?? 1000,
      };

      if (isJson) {
        payload.response_format = { type: 'json_object' };
        if (!prompt.toLowerCase().includes('json')) {
          payload.messages[0].content += '\n\nIMPORTANT: Return ONLY a valid JSON object.';
        }
      }

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000 // Groq is fast, 20s is plenty
      });

      const result = response.data;
      const text = result.choices[0].message.content;

      return {
        success: true,
        data: isJson ? this._parseSafeJson(text) : text,
        metadata: {
          model: modelName,
          usage: result.usage
        }
      };
    } catch (err) {
      const status = err.response ? err.response.status : 'NETWORK_ERROR';
      const errorMsg = (err.response && err.response.data && err.response.data.error && err.response.data.error.message) || err.message;
      
      sails.log.error(`GroqService: API error (${status}):`, errorMsg);
      
      return {
        success: false,
        message: errorMsg,
        code: 'GROQ_ERROR',
        status: status
      };
    }
  },

  _parseSafeJson: function(text) {
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch { /* ignore */ }
      }
      sails.log.error('GroqService: JSON parse failed:', text);
      return { raw: text, error: 'JSON_PARSE_FAILED' };
    }
  }

};
