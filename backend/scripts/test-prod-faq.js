const axios = require('axios');

const BASE_URL = 'https://prowise-backend.onrender.com/api';

async function getOrCreateUserToken(email, username, password, roleName = 'client') {
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    return { token: loginRes.data.token, userId: loginRes.data.user.id, user: loginRes.data.user };
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 404) {
      console.log(`   User ${email} not found. Registering...`);
      await axios.post(`${BASE_URL}/auth/register`, {
        name: username,
        username,
        email,
        password,
        roleName
      });
      console.log(`   Registration successful for ${email}. Logging in...`);
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password });
      return { token: loginRes.data.token, userId: loginRes.data.user.id, user: loginRes.data.user };
    } else {
      throw err;
    }
  }
}

async function ensureTechnician(techEmail, techUsername, password, superAdminToken) {
  const { token, userId, user } = await getOrCreateUserToken(techEmail, techUsername, password, 'client');
  if (user.isTechnician && user.technicianStatus === 'approved') {
    return token;
  }
  
  console.log(`   User ${techEmail} is not an approved technician yet. Submitting upgrade request...`);
  try {
    await axios.post(`${BASE_URL}/users/technician/request`, {
      headline: 'FAQ Audit Expert',
      bio: 'Automated test account for production auditing',
      city: 'Tunis',
      governorate: 'Tunis',
      phone: '+21699887766',
      skills: ['Air Filter Cleaning', 'Industrial Maintenance'],
      experienceYears: 5
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   Upgrade request submitted.');
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.message?.includes('already')) {
      console.log('   Application already pending.');
    } else {
      throw err;
    }
  }

  console.log('   Approving technician upgrade via Super Admin...');
  await axios.put(`${BASE_URL}/users/${userId}/technician/approve`, {
    verificationNotes: 'Approved for automated testing'
  }, {
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  console.log('   Technician upgrade approved successfully.');

  const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: techEmail, password });
  return loginRes.data.token;
}

async function runProdFaqTest() {
  console.log('🏁 Starting Deployed Production FAQ Workflow Test...');
  console.log(`Target Backend: ${BASE_URL}\n`);

  try {
    console.log('🔑 Authenticating roles...');
    
    // Super Admin login (needed to approve technician)
    let superAdminToken;
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'superadmin@prowise.com',
        password: 'Admin123!'
      });
      superAdminToken = res.data.token;
      console.log('   [✓] Super Admin Authenticated successfully');
    } catch (e) {
      console.error('   [✗] Super Admin Authentication failed:', e.message);
      return;
    }

    // Customer setup
    let customerToken, customerId;
    try {
      const res = await getOrCreateUserToken('customer_faq_test@gmail.com', 'customer_faq', 'Admin123!');
      customerToken = res.token;
      customerId = res.userId;
      console.log('   [✓] Customer Authenticated successfully');
    } catch (e) {
      console.error('   [✗] Customer setup failed:', e.message);
      return;
    }

    // Technician setup
    let technicianToken;
    try {
      technicianToken = await ensureTechnician('tech_faq_test@gmail.com', 'tech_faq', 'Admin123!', superAdminToken);
      console.log('   [✓] Technician Authenticated successfully');
    } catch (e) {
      console.error('   [✗] Technician setup failed:', e.message);
      return;
    }

    // Company Admin login
    let adminToken;
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'amir@gmail.com',
        password: 'Admin123!'
      });
      adminToken = res.data.token;
      console.log('   [✓] Company Admin Authenticated successfully');
    } catch (e) {
      console.error('   [✗] Company Admin Authentication failed:', e.message);
      return;
    }

    // Get a product for testing
    let productId;
    try {
      const res = await axios.get(`${BASE_URL}/products?limit=1`);
      const product = res.data.data ? res.data.data[0] : res.data[0];
      productId = product.id;
      console.log(`   [✓] Product found: "${product.name}" (ID: ${product.id})\n`);
    } catch (e) {
      console.error('   [✗] Failed to fetch products:', e.message);
      return;
    }

    // --- TEST 1: Customer submits question ---
    console.log('[TEST 1] Customer creates an FAQ Question');
    let createdFaqId;
    try {
      const res = await axios.post(
        `${BASE_URL}/content`,
        {
          title: 'How do I clean the air filter?',
          description: 'Does it require soap or detergent?',
          type: 'faq',
          product: productId,
          answer: 'TRESPASSING CUSTOMER ANSWER' // should be stripped by controller
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      createdFaqId = res.data.id;
      console.log('   [✓] Question created successfully.');
      console.log('       - Title:', res.data.title);
      console.log('       - Answer (Stripped?):', res.data.answer === null ? 'YES (null)' : `NO (got: ${res.data.answer})`);
      console.log('       - Status (Pending?):', res.data.status);
      console.log('       - Assigned Company ID:', res.data.company);
      console.log('       - CreatedBy ID:', res.data.createdBy);
    } catch (e) {
      console.error('   [✗] Question creation failed:', e.response?.data || e.message);
      return;
    }

    // --- TEST 2: Customer tries to self-answer their question ---
    console.log('\n[TEST 2] Customer attempts to self-answer/moderate FAQ');
    try {
      await axios.put(
        `${BASE_URL}/content/${createdFaqId}`,
        { answer: 'Customer self-answer' },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.log('   [✗] FAIL: Customer was allowed to answer question.');
    } catch (e) {
      console.log('   [✓] SUCCESS: Customer update blocked (Forbidden):', e.response?.data?.error || e.response?.data?.message || e.message);
    }

    // --- TEST 3: Technician answers the question ---
    console.log('\n[TEST 3] Technician answers the question');
    try {
      const res = await axios.put(
        `${BASE_URL}/content/${createdFaqId}`,
        { answer: 'Clean it with mild soap and lukewarm water.' },
        { headers: { Authorization: `Bearer ${technicianToken}` } }
      );
      console.log('   [✓] FAQ Answered successfully by Technician.');
      console.log('       - Answer stored:', res.data.answer);
      console.log('       - AnsweredBy ID:', res.data.answeredBy);
      console.log('       - Status (Approved?):', res.data.status);
    } catch (e) {
      console.error('   [✗] Technician answering failed:', e.response?.data || e.message);
    }

    // --- TEST 4: Customer tries to edit/moderate the answer ---
    console.log('\n[TEST 4] Customer tries to edit the answer');
    try {
      await axios.put(
        `${BASE_URL}/content/${createdFaqId}`,
        { answer: 'Different customer answer' },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.log('   [✗] FAIL: Customer was allowed to edit the answer.');
    } catch (e) {
      console.log('   [✓] SUCCESS: Customer edit blocked (Forbidden):', e.response?.data?.error || e.response?.data?.message || e.message);
    }

    // --- TEST 5: Original Technician updates their own answer ---
    console.log('\n[TEST 5] Original Technician updates their own answer');
    try {
      const res = await axios.put(
        `${BASE_URL}/content/${createdFaqId}`,
        { answer: 'Clean it with mild soap and lukewarm water, then air dry completely.' },
        { headers: { Authorization: `Bearer ${technicianToken}` } }
      );
      console.log('   [✓] Answer updated successfully by original Technician.');
      console.log('       - New Answer:', res.data.answer);
    } catch (e) {
      console.error('   [✗] Technician update failed:', e.response?.data || e.message);
    }

    // --- TEST 6: Company Admin modifies everything ---
    console.log('\n[TEST 6] Company Admin edits the FAQ question and answer');
    try {
      const res = await axios.put(
        `${BASE_URL}/content/${createdFaqId}`,
        {
          title: 'Official Air Filter Cleaning Guide',
          description: 'What is the correct way to wash the air filter?',
          answer: 'Use mild soap, rinse with clean water, and air dry completely.'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('   [✓] FAQ updated successfully by Company Admin.');
      console.log('       - New Title:', res.data.title);
      console.log('       - New Description:', res.data.description);
      console.log('       - New Answer:', res.data.answer);
    } catch (e) {
      console.error('   [✗] Company Admin edit failed:', e.response?.data || e.message);
    }

    // --- TEST 7: Customer attempts to delete answered FAQ ---
    console.log('\n[TEST 7] Customer attempts to delete answered FAQ');
    try {
      await axios.delete(
        `${BASE_URL}/content/${createdFaqId}`,
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      console.log('   [✗] FAIL: Customer allowed to delete answered FAQ.');
    } catch (e) {
      console.log('   [✓] SUCCESS: Customer delete blocked (Forbidden):', e.response?.data?.error || e.response?.data?.message || e.message);
    }

    // --- TEST 8: Company Admin deletes the FAQ ---
    console.log('\n[TEST 8] Company Admin deletes the FAQ');
    try {
      await axios.delete(
        `${BASE_URL}/content/${createdFaqId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('   [✓] FAQ deleted successfully by Company Admin.');
    } catch (e) {
      console.error('   [✗] FAQ deletion failed:', e.response?.data || e.message);
    }

    console.log('\n🌟 Deployed Production FAQ Workflow Test Completed Successfully!');

  } catch (err) {
    console.error('\n[Fatal Error]:', err.message);
  }
}

runProdFaqTest();
