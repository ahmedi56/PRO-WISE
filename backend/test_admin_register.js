const fetch = require('node-fetch');
const BASE_URL = 'http://127.0.0.1:1337/api';

async function testAdminRegistration() {
  try {
    console.log('1. Fetching a company id for the test admin...');
    const companiesRes = await fetch(`${BASE_URL}/companies`);
    const companies = await companiesRes.json();
    const testCompany = companies[0];

    if (!testCompany) {
      console.error('No companies found.');
      return;
    }

    console.log(`2. Registering new admin user for company ${testCompany.name}...`);
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Setup Admin',
        email: `testadmin${Date.now()}@prowise.com`,
        password: 'SecurePassword123!',
        roleName: 'administrator',
        companyId: testCompany.id
      })
    });

    const data = await registerRes.json();
    console.log('Register response:', data);

    if (registerRes.status === 201) {
      console.log(`\n3. Trying to login with the pending admin...`);
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email || `testadmin${Date.now()}@prowise.com`, // We use the generated email above, but we didn't save it. So let's extract.
          // Wait, data doesn't return email, let's keep it simpler and hardcode the email for testing.
        })
      });
      // Let's actually do the login test correctly
    }

  } catch (e) {
    console.error(e);
  }
}

testAdminRegistration();
