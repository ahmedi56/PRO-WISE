/**
 * backfill-embeddings.js
 * 
 * Usage: node scripts/backfill-embeddings.js [--force]
 * 
 * Purpose: Reliably regenerate embeddings for products that are missing them.
 * This script calls the robust backend endpoint to guarantee access to the database
 * and services.
 */

const http = require('http');

const force = process.argv.includes('--force');

console.log('==================================================');
console.log('Starting embedding backfill via API...');
console.log(`Mode: ${force ? 'FORCE REGENERATE ALL' : 'MISSING ONLY'}`);
console.log('Ensure you have run `npm run dev` to start the backend and Python service.');
console.log('==================================================\n');

const req = http.request({
  host: '127.0.0.1',
  port: 1337,
  path: `/api/products/backfill-embeddings?force=${force}`,
  method: 'POST'
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log(`\nFinished embedding backfill.`);
        console.log(`Message: ${response.message}`);
        console.log(`Success: ${response.successCount}`);
        console.log(`Failed:  ${response.failCount}`);
        console.log('==================================================');
        process.exit(response.failCount === 0 ? 0 : 1);
      } catch(e) {
        console.error('Invalid JSON response:', data);
        process.exit(1);
      }
    } else {
      console.error(`Received HTTP ${res.statusCode}:`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n[!] Error connecting to API: ${e.message}`);
  console.error(`Are you sure the backend is running at http://127.0.0.1:1337?`);
  process.exit(1);
});

req.end();
