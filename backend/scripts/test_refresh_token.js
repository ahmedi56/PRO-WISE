const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:1337/api';

async function runTest() {
  console.log('--- Starting Refresh Token Verification ---');

  try {
    // 1. Login as Super Admin to get a token for user management
    console.log('\n1. Logging in as Super Admin...');
    const superLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@prowise.com', password: 'Admin123!' })
    });
    const superAuth = await superLoginRes.json();
    if (!superLoginRes.ok) throw new Error(`Super Admin login failed: ${JSON.stringify(superAuth)}`);
    const superToken = superAuth.token;

    // 2. Create a test company
    console.log('\n2. Creating a test company...');
    const companyRes = await fetch(`${BASE_URL}/companies`);
    const companies = await companyRes.json();
    let companyId = companies.length > 0 ? companies[0].id : null;
    
    if (!companyId) {
        // This shouldn't happen with seeded data, but for robustness:
        throw new Error('No company found to associate with test user.');
    }
    console.log(`   Using company ID: ${companyId}`);

    // 3. Register a new test Company Admin
    const testEmail = `token-test-${Date.now()}@example.com`;
    console.log(`\n3. Registering a new Company Admin: ${testEmail}...`);
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Token Test User',
        email: testEmail,
        password: 'TestPassword123!',
        roleName: 'company_admin',
        companyId: companyId
      })
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    const userId = registerData.userId;

    // 4. Activate the new user (since company admins are pending by default)
    console.log(`\n4. Activating user ${userId}...`);
    const activateRes = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${superToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: 'active' })
    });
    if (!activateRes.ok) throw new Error(`Activation failed: ${await activateRes.text()}`);

    // 5. Login as the new Company Admin
    console.log(`\n5. Logging in as ${testEmail}...`);
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'TestPassword123!' })
    });
    const loginAuth = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginAuth)}`);
    const { token, refreshToken } = loginAuth;
    
    const decodedLogin = jwt.decode(token);
    console.log('   Login Token companyId:', decodedLogin.companyId);
    if (!decodedLogin.companyId) {
      throw new Error('Initial login token missing companyId');
    }

    // 6. Refresh the token
    console.log('\n6. Refreshing token...');
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const refreshData = await refreshRes.json();
    if (!refreshRes.ok) throw new Error(`Refresh failed: ${JSON.stringify(refreshData)}`);
    const { token: newToken } = refreshData;
    
    const decodedRefresh = jwt.decode(newToken);
    console.log('   Refreshed Token companyId:', decodedRefresh.companyId);
    
    if (decodedRefresh.companyId !== decodedLogin.companyId) {
      throw new Error(`CompanyId mismatch! Expected ${decodedLogin.companyId}, got ${decodedRefresh.companyId}`);
    }
    console.log('   SUCCESS: companyId persists in refreshed token.');

    // 7. Verify tenant-isolated access with refreshed token
    console.log('\n7. Verifying tenant-isolated access with refreshed token...');
    // We try to list products in manage mode, which uses req.user.companyId
    const productsRes = await fetch(`${BASE_URL}/products?manage=true`, {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
    
    if (productsRes.status === 200) {
      const productsData = await productsRes.json();
      console.log(`   SUCCESS: Accessed tenant products (Found ${productsData.data?.length || 0} products)`);
    } else {
      const err = await productsRes.json();
      throw new Error(`Access failed with status ${productsRes.status}: ${JSON.stringify(err)}`);
    }

    // Cleanup
    console.log('\n8. Cleaning up test user...');
    await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superToken}` }
    });

    console.log('\n--- Refresh Token Verification Passed! ---');

  } catch (err) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(err.message);
    process.exit(1);
  }
}

runTest();
