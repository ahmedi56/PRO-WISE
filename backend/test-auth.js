const axios = require('axios');

async function testAuth() {
  console.log('--- Auth Test Suite ---');
  try {
    // Test 1: Valid Credentials
    const res1 = await axios.post('http://localhost:1337/api/auth/login', {
      email: 'admin@prowise.com',
      password: 'Admin123!'
    });
    console.log('✅ Test 1 Passed: Valid Login (No spaces)');

    // Test 2: Valid Credentials with trailing space
    const res2 = await axios.post('http://localhost:1337/api/auth/login', {
      email: 'admin@prowise.com ',
      password: 'Admin123!'
    });
    console.log('✅ Test 2 Passed: Valid Login (Trailing space handled)');

    // Test 3: Valid Credentials with leading and trailing spaces and uppercase
    const res3 = await axios.post('http://localhost:1337/api/auth/login', {
      email: '  Admin@PROWISE.COM   ',
      password: 'Admin123!'
    });
    console.log('✅ Test 3 Passed: Valid Login (Spaces & Uppercase handled)');

    // Test 4: Invalid Credentials (Wrong Password)
    try {
      await axios.post('http://localhost:1337/api/auth/login', {
        email: 'admin@prowise.com',
        password: 'WrongPassword!'
      });
      console.log('❌ Test 4 Failed: Expected Invalid Credentials error');
      process.exit(1);
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('✅ Test 4 Passed: Handled Wrong Password (401)');
      } else {
        console.log('❌ Test 4 Failed: Unexpected error type', e.message);
        process.exit(1);
      }
    }

    // Test 5: Invalid Credentials (Wrong Email)
    try {
      await axios.post('http://localhost:1337/api/auth/login', {
        email: 'wrong@email.com',
        password: 'Admin123!'
      });
      console.log('❌ Test 5 Failed: Expected Invalid Credentials error');
      process.exit(1);
    } catch (e) {
      if (e.response && e.response.status === 401) {
        console.log('✅ Test 5 Passed: Handled Wrong Email (401)');
      } else {
        console.log('❌ Test 5 Failed: Unexpected error type', e.message);
        process.exit(1);
      }
    }

    console.log('🎉 All Auth Tests Passed!');

  } catch (e) {
    console.error('❌ Test Setup Failed:', (e.response && e.response.data) || e.message);
    process.exit(1);
  }
}

testAuth();
