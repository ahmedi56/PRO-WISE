/**
 * trigger-trake7.js
 * 
 * Performs an API login as superadmin and triggers the forced embedding backfill.
 */

const axios = require('axios');

// Explicit IPv4 to avoid IPv6 resolution issues on some Windows setups
const BASE_URL = 'http://127.0.0.1:1337/api';

async function main() {
  try {
    console.log('Logging in as superadmin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@prowise.com',
      password: 'Admin123!'
    });

    const token = loginRes.data.token;
    console.log('Login successful. Token acquired.');

    console.log('Triggering forced AI settlement (Trake7)...');
    const backfillRes = await axios.post(`${BASE_URL}/products/backfill-embeddings?force=true`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 300000 // 5 minutes for re-indexing
    });

    console.log('\n--- Settlement Result ---');
    console.log(JSON.stringify(backfillRes.data, null, 2));

    if (backfillRes.data.failCount === 0) {
      console.log('\nAI Model Settlement completed PERFECTLY.');
    } else {
      console.log('\nAI Model Settlement completed with some errors.');
    }

  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

main();
