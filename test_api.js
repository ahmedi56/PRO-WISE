// Quick API test script
const http = require('http');

const tests = [];

// Test 1: Health check
function testHealth() {
    return new Promise((resolve) => {
        http.get('http://localhost:3000/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = { test: 'Health Check', status: res.statusCode, response: JSON.parse(data) };
                console.log('Ã¢Å“â€¦ Health Check:', result.response);
                resolve(result);
            });
        }).on('error', (e) => {
            console.log('Ã¢ÂÅ’ Health Check Failed:', e.message);
            resolve({ test: 'Health Check', error: e.message });
        });
    });
}

// Test 2: Register
function testRegister() {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            username: 'testuser_' + Date.now(),
            email: 'test_' + Date.now() + '@example.com',
            password: 'password123'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log('Ã¢Å“â€¦ Register:', res.statusCode, body);
                resolve({ test: 'Register', status: res.statusCode, response: JSON.parse(body) });
            });
        });
        req.on('error', (e) => {
            console.log('Ã¢ÂÅ’ Register Failed:', e.message);
            resolve({ test: 'Register', error: e.message });
        });
        req.write(data);
        req.end();
    });
}

// Test 3: Login
function testLogin() {
    return new Promise((resolve) => {
        const data = JSON.stringify({ email: 'test_login@example.com', password: 'password123' });

        // First register
        const regData = JSON.stringify({ username: 'logintest', email: 'test_login@example.com', password: 'password123' });
        const regOptions = {
            hostname: 'localhost', port: 3000, path: '/api/auth/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': regData.length }
        };

        const regReq = http.request(regOptions, () => {
            // Now login
            const options = {
                hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    const parsed = JSON.parse(body);
                    console.log('Ã¢Å“â€¦ Login:', res.statusCode, parsed.token ? 'Token received!' : body);
                    resolve({ test: 'Login', status: res.statusCode, token: parsed.token });
                });
            });
            req.on('error', (e) => resolve({ test: 'Login', error: e.message }));
            req.write(data);
            req.end();
        });
        regReq.on('error', (e) => resolve({ test: 'Login', error: e.message }));
        regReq.write(regData);
        regReq.end();
    });
}

// Test 4: Get Profile (Protected)
async function testProfile(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log('Ã¢Å“â€¦ Profile (GET /auth/me):', res.statusCode, body);
                resolve({ test: 'Profile', status: res.statusCode, response: JSON.parse(body) });
            });
        });
        req.on('error', (e) => resolve({ test: 'Profile', error: e.message }));
        req.end();
    });
}

// Test 5: Users Profile endpoint
async function testUsersProfile(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost', port: 3000, path: '/api/users/profile', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log('Ã¢Å“â€¦ Users Profile (GET /users/profile):', res.statusCode, body);
                resolve({ test: 'Users Profile', status: res.statusCode, response: JSON.parse(body) });
            });
        });
        req.on('error', (e) => resolve({ test: 'Users Profile', error: e.message }));
        req.end();
    });
}

async function runTests() {
    console.log('\n========== API ENDPOINT TESTS ==========\n');

    await testHealth();
    await testRegister();
    const loginResult = await testLogin();

    if (loginResult.token) {
        await testProfile(loginResult.token);
        await testUsersProfile(loginResult.token);
    }

    console.log('\n========== TESTS COMPLETE ==========\n');
}

runTests();
