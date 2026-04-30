const axios = require('axios');

const API_URL = 'http://127.0.0.1:1337/api';

async function runTests() {
  try {
    console.log('--- TESTING CONTENT WORKFLOW ---');

    console.log('1. Logging in as Company Admin...');
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@prowise.com',
      password: 'Admin123!'
    }).catch(e => e.response);

    if (adminLoginRes.status !== 200) {
      console.log('Failed to login as Company Admin', adminLoginRes.data);
      return;
    }
    const adminToken = adminLoginRes.data.token;
    console.log('Company Admin logged in successfully.');

    console.log('\n2. Creating new content as Company Admin...');
    const createRes = await axios.post(`${API_URL}/content`, {
      title: 'How to fix a screen',
      description: 'A detailed approach to fixing a shattered screen.',
      type: 'guide',
      steps: [{ title: 'Step 1' }],
      media: ['http://example.com/image.png']
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).catch(e => e.response);

    if (createRes.status !== 200) {
      console.log('Failed to create content:', createRes.data);
      return;
    }
    const contentId = createRes.data.id;
    console.log(`Content created successfully! ID: ${contentId}, Status: ${createRes.data.status}`);

    console.log('\n3. Submitting the content as Company Admin...');
    const submitRes = await axios.put(`${API_URL}/content/${contentId}/submit`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).catch(e => e.response);

    if (submitRes.status !== 200) {
      console.log('Failed to submit content:', submitRes.data);
      return;
    }
    console.log(`Content submitted! New Status: ${submitRes.data.status}`);

    console.log('\n4. Logging in as Super Admin...');
    const superAdminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@prowise.com',
      password: 'Admin123!'
    }).catch(e => e.response);

    if (superAdminLoginRes.status !== 200) {
      console.log('Failed to login as Super Admin', superAdminLoginRes.data);
      return;
    }
    const superAdminToken = superAdminLoginRes.data.token;
    console.log('Super Admin logged in successfully.');

    console.log('\n5. Getting pending content as Super Admin...');
    const pendingRes = await axios.get(`${API_URL}/content/pending`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    }).catch(e => e.response);

    if (pendingRes.status !== 200) {
      console.log('Failed to get pending content:', pendingRes.data);
      return;
    }
    console.log(`Found ${pendingRes.data.length} pending content items.`);

    console.log('\n6. Approving the content as Super Admin...');
    const approveRes = await axios.put(`${API_URL}/content/${contentId}/approve`, {}, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    }).catch(e => e.response);

    if (approveRes.status !== 200) {
      console.log('Failed to approve content:', approveRes.data);
      return;
    }
    console.log(`Content approved successfully! Status: ${approveRes.data.status}`);

    console.log('\n7. Fetching all contents to verify visibility rules...');
    const allRes = await axios.get(`${API_URL}/content`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).catch(e => e.response);
    
    if (allRes.status !== 200) {
      console.log('Failed to get all content:', allRes.data);
    } else {
      console.log(`Retrieved ${allRes.data.length} content items for admin.`);
      const testContent = allRes.data.find(c => c.id === contentId);
      console.log(`Verification: Test Content ID ${contentId} status is ${testContent ? testContent.status : 'missing'}`);
    }

    console.log('\n--- TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('An unexpected error occurred:', error.response ? error.response.data : error.message);
  }
}

runTests();
