const axios = require('axios');

async function check() {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'dummy_key'}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', response.data);
  } catch (err) {
    console.log('Status:', err.response ? err.response.status : 'ERR');
    console.log('Data:', err.response ? JSON.stringify(err.response.data) : err.message);
  }
}
check();
