const fetch = require('node-fetch');
const BASE_URL = 'http://127.0.0.1:1337/api';

async function verifyBehavior() {
  try {
    console.log('--- Behavior Verification Script ---');

    // 1. Register a Regular User (Client)
    console.log('\n1. Registering Regular User (Client)...');
    const clientEmail = `client_${Date.now()}@example.com`;
    const clientRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Client',
        email: clientEmail,
        password: 'Password123!',
        roleName: 'client'
      })
    });
    const clientData = await clientRes.json();
    console.log(`   Status: ${clientRes.status}, User Status: ${clientData.status}`);
    if (clientData.status !== 'active') {
      console.error('   FAILED: Client should be active by default.');
    } else {
      console.log('   SUCCESS: Client is active.');
    }

    // 2. Register an Administrator
    console.log('\n2. Registering Administrator...');
    const adminEmail = `admin_${Date.now()}@example.com`;

    // Need a company first
    const companiesRes = await fetch(`${BASE_URL}/companies`);
    const companies = await companiesRes.json();
    const companyId = companies.length > 0 ? companies[0].id : null;

    const adminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: adminEmail,
        password: 'Password123!',
        roleName: 'administrator',
        companyId: companyId
      })
    });
    const adminData = await adminRes.json();
    console.log(`   Status: ${adminRes.status}, User Status: ${adminData.status}`);
    if (adminData.status !== 'pending') {
      console.error('   FAILED: Administrator should be pending by default.');
    } else {
      console.log('   SUCCESS: Administrator is pending.');
    }

    // 3. Super Admin Approval
    console.log('\n3. Super Admin Approving the Admin...');
    const superLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@prowise.com', password: 'Admin123!' })
    });
    const { token: superToken } = await superLoginRes.json();

    const approveRes = await fetch(`${BASE_URL}/users/${adminData.userId}/validate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${superToken}`,
        'Content-Type': 'application/json'
      }
    });
    const approveData = await approveRes.json();
    const newStatus = approveData.user ? approveData.user.status : undefined;
    console.log(`   Approve Response: ${approveRes.status}, New Status: ${newStatus}`);
    if (newStatus !== 'active') {
      console.error('   FAILED: Admin should now be active.');
    } else {
      console.log('   SUCCESS: Admin is now active.');
    }

    // 4. Super Admin Deletion
    console.log('\n4. Super Admin Deleting users...');
    const deleteClient = await fetch(`${BASE_URL}/users/${clientData.userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superToken}` }
    });
    console.log(`   Delete Client: ${deleteClient.status}`);

    const deleteAdmin = await fetch(`${BASE_URL}/users/${adminData.userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superToken}` }
    });
    console.log(`   Delete Admin: ${deleteAdmin.status}`);

    console.log('\n--- Verification Completed ---');

  } catch (err) {
    console.error('Verification Error:', err);
  }
}

verifyBehavior();
