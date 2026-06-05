const axios = require('axios');

async function testLive() {
  console.log('Logging in to live Render backend as Super Admin...');
  try {
    const loginRes = await axios.post('https://prowise-backend.onrender.com/api/auth/login', {
      email: 'superadmin@prowise.com',
      password: 'Admin123!'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful! Token acquired.');

    console.log('Sending authorized test semantic search request...');
    const chatRes = await axios.post('https://prowise-backend.onrender.com/api/ai/search', {
      message: 'Hello, what is a processor?',
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('STATUS:', chatRes.status);
    console.log('RESPONSE:', JSON.stringify(chatRes.data, null, 2));
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
}

testLive();
