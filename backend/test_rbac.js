// Using native fetch (supported in Node.js 18+)

const BASE_URL = 'http://127.0.0.1:1337/api';

async function runTest() {
  console.log('--- Starting RBAC Verification Tests ---');

  try {
    // 1. Initial Setup: Activate test admin if needed
    console.log('\n1. Initial Setup: Ensuring test admin is active...');
    const superLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@prowise.com', password: 'Admin123!' })
    });
    const superLoginData = await superLoginRes.json();
    if (!superLoginRes.ok) {throw new Error('Super Admin Login failed');}
    const superToken = superLoginData.token;

    const allUsersRes = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${superToken}` }
    });
    const allUsers = await allUsersRes.json();
    const testAdmin = allUsers.find(u => u.email === 'admin@prowise.com');

    if (testAdmin) {
      console.log(`   Updating test admin user (ID: ${testAdmin.id}) to active and assigning company...`);

      // Get a company
      const companiesRes = await fetch(`${BASE_URL}/companies`);
      const companies = await companiesRes.json();
      const companyId = companies.length > 0 ? companies[0].id : null;

      if (companyId) {
        const updateRes = await fetch(`${BASE_URL}/users/${testAdmin.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${superToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active', company: companyId })
        });
        if (!updateRes.ok) {
          const err = await updateRes.json();
          console.error('Failed to update test admin:', err);
        }
      } else {
        console.error('No companies found to assign to test admin.');
      }
    }

    // 2. Login as Admin
    console.log('\n2. Logging in as Admin (admin@prowise.com)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@prowise.com', password: 'Admin123!' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {throw new Error('Login failed');}
    const token = loginData.token;
    console.log('   Success. Permissions for this user:', loginData.user.role.permissions || 'None');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Test Allowed Action: View Products
    console.log('\n2. Testing Allowed: GET /api/products...');
    const productsRes = await fetch(`${BASE_URL}/products`, { headers });
    console.log(`   Status: ${productsRes.status} (Expected: 200)`);

    // 3. Test Allowed Action: Create Product (products.manage)
    console.log('\n3. Testing Allowed: POST /api/products...');
    const createRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'RBAC Test Product', manufacturer: 'Test Corp' })
    });
    const createdProduct = await createRes.json();
    console.log(`   Status: ${createRes.status} (Expected: 200/201)`);
    const productId = createdProduct.id;

    // 4. Test Allowed Action: Update Product (products.update)
    console.log('\n4. Testing Allowed: PUT /api/products/:id...');
    const updateRes = await fetch(`${BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'RBAC Test Product Updated' })
    });
    console.log(`   Status: ${updateRes.status} (Expected: 200)`);

    // 5. Test Blocked Action: GET /api/users (Admin shouldn't have users.manage)
    console.log('\n5. Testing Blocked: GET /api/users...');
    const usersRes = await fetch(`${BASE_URL}/users`, { headers });
    console.log(`   Status: ${usersRes.status} (Expected: 403)`);
    if (usersRes.status === 200) {console.error('   !!! ERROR: Should have been blocked!');}

    // 6. Test Blocked Action: POST /api/categories
    console.log('\n6. Testing Blocked: POST /api/categories...');
    const catRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Should Fail' })
    });
    console.log(`   Status: ${catRes.status} (Expected: 403)`);

    // 7. Test New Restriction Route: GET /api/analytics (Allowed)
    console.log('\n7. Testing Allowed: GET /api/analytics...');
    const analyticsRes = await fetch(`${BASE_URL}/analytics`, { headers });
    console.log(`   Status: ${analyticsRes.status} (Expected: 200)`);
    const analyticsData = await analyticsRes.json();
    console.log('   Response:', analyticsData.message);

    // 8. Test New Restriction Route: POST /api/guides/upload (Allowed)
    console.log('\n8. Testing Allowed: POST /api/guides/upload...');
    const uploadRes = await fetch(`${BASE_URL}/guides/upload`, {
      method: 'POST',
      headers
    });
    console.log(`   Status: ${uploadRes.status} (Expected: 200)`);

    // Clean up
    if (productId) {
      await fetch(`${BASE_URL}/products/${productId}`, { method: 'DELETE', headers });
    }

    console.log('\n--- RBAC Verification Completed ---');

  } catch (err) {
    console.error('\n!!! TEST ERROR !!!');
    console.error(err.message);
  }
}

runTest();
