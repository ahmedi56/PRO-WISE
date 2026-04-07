const axios = require('axios');

async function testApi() {
  try {
    console.log('Fetching products from local API...');
    const res = await axios.get('http://127.0.0.1:1337/api/products?manage=true');
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    const data = res.data;
    console.log('\nData type:', typeof data);
    console.log('Is Array?', Array.isArray(data));
    console.log('Length:', data.length || (data.data && data.data.length));
    
    if (data.length > 0) {
      console.log('Sample product:', JSON.stringify(data[0], null, 2));
    } else if (data.data && data.data.length > 0) {
      console.log('Sample product:', JSON.stringify(data.data[0], null, 2));
    } else {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    if (e.response) {
      console.error('API Error:', e.response.status, e.response.data);
    } else {
      console.error('Request failed:', e.message);
    }
  }
}

testApi();
