const axios = require('axios');

async function verifyUploadDisabled() {
    console.log('--- Verifying Guide Upload Disabled ---');
    try {
        // We don't even need to login for a 501 if the controller handles it first, 
        // but let's assume we need to hit the endpoint.
        // Actually, the route might be protected, so let's just check the logic.
        
        const response = await axios.post('http://127.0.0.1:1337/api/guides/upload').catch(err => err.response);
        
        console.log('Status code:', response.status);
        console.log('Response body:', response.data);

        if (response.status === 501) {
            console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: Backend correctly returns 501 Not Implemented.');
        } else {
            console.log('\x1b[31m%s\x1b[0m', 'FAILURE: Unexpected status code.');
            process.exit(1);
        }
    } catch (err) {
        console.error('Verification failed:', err.message);
        process.exit(1);
    }
}

verifyUploadDisabled();
