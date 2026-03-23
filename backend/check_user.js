const fetch = require('node-fetch');

const BASE_URL = 'http://127.0.0.1:1337/api';

async function checkUser() {
  try {
    const superLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@prowise.com', password: 'Admin123!' })
    });
    const superLoginData = await superLoginRes.json();
    const superToken = superLoginData.token;

    const allUsersRes = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${superToken}` }
    });
    const allUsers = await allUsersRes.json();
    const testAdmin = allUsers.find(u => u.email === 'admin@prowise.com');

    console.log('Test Admin Data:', JSON.stringify(testAdmin, null, 2));

  } catch (e) {
    console.error(e);
  }
}

checkUser();
