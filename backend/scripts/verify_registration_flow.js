const http = require('http');

async function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runVerify() {
    console.log('--- Verifying Registration Flow ---');
    
    const timestamp = Date.now();
    
    // 1. Client Registration
    console.log('\n1. Testing Client Registration...');
    const clientRes = await request({
        hostname: '127.0.0.1', port: 1337, path: '/api/auth/register', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'Normal Client',
        email: `client_${timestamp}@example.com`,
        password: 'Password123!',
        roleName: 'client'
    });
    console.log('Status:', clientRes.status);
    console.log('Result:', clientRes.body.successMessage || clientRes.body.message);
    if (clientRes.status === 201 && clientRes.body.status === 'active') {
        console.log('✅ Client is ACTIVE immediately.');
    } else {
        console.log('❌ Client registration failed or status incorrect:', clientRes.body.status);
    }

    // 2. Company Admin Registration
    console.log('\n2. Testing Company Admin Registration...');
    const adminRes = await request({
        hostname: '127.0.0.1', port: 1337, path: '/api/auth/register', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'Business Admin',
        email: `admin_${timestamp}@example.com`,
        password: 'Password123!',
        roleName: 'company_admin',
        companyId: 'new_request',
        newCompanyName: `Test Company ${timestamp}`,
        newCompanyDescription: 'Demo'
    });
    console.log('Status:', adminRes.status);
    console.log('Result:', adminRes.body.successMessage || adminRes.body.message);
    if (adminRes.status === 201 && adminRes.body.status === 'pending') {
        console.log('✅ Company Admin is PENDING.');
    } else {
        console.log('❌ Company Admin registration failed or status incorrect:', adminRes.body.status);
    }

    console.log('\n--- Verification Complete ---');
}

runVerify().catch(console.error);
