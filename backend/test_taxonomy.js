const fetch = require('node-fetch'); // Needs node-fetch v2 or handled by node 18 global fetch?
// Node 18 has global fetch.

const BASE_URL = 'http://127.0.0.1:1337/api';

async function main() {
  try {
    console.log('--- Testing Taxonomy API ---');

    // 1. Login as Super Admin
    console.log('1. Logging in as Super Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@prowise.com', password: 'Admin123!' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {throw new Error(`Login failed: ${JSON.stringify(loginData)}`);}
    const token = loginData.token;
    console.log('   Login successful. Token obtained.');

    // 2. List Guide Types
    console.log('\n2. Listing Guide Types...');
    const gtRes = await fetch(`${BASE_URL}/guidetypes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const gtData = await gtRes.json();
    if (!gtRes.ok) {throw new Error(`List Guide Types failed: ${JSON.stringify(gtData)}`);}
    console.log(`   Found ${gtData.length} guide types.`);
    gtData.forEach(gt => console.log(`   - ${gt.name} (${gt.icon})`));

    // 3. List Categories (Tree)
    console.log('\n3. Listing Categories (Tree View)...');
    const catRes = await fetch(`${BASE_URL}/categories?tree=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const catData = await catRes.json();
    if (!catRes.ok) {throw new Error(`List Categories failed: ${JSON.stringify(catData)}`);}
    console.log(`   Found ${catData.length} root categories.`);
    catData.forEach(c => {
      console.log(`   [L${c.level}] ${c.name} (${c.children ? c.children.length : 0} children)`);
      if (c.children) {
        c.children.forEach(child => console.log(`      - ${child.name} [Child]`)); // Note: populate is usually 1 level deep unless recursive
      }
    });

    // 4. Create Category
    console.log('\n4. Creating Test Category...');
    const createRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Taxonomy Category',
        summary: 'Unit test category',
        level: 0,
        visibility: 'private'
      })
    });
    const createdCat = await createRes.json();
    if (!createRes.ok) {throw new Error(`Create Category failed: ${JSON.stringify(createdCat)}`);}
    console.log(`   Created category: ${createdCat.name} (${createdCat.id}) slug=${createdCat.slug}`);

    // 5. Delete Category
    console.log('\n5. Deleting Test Category...');
    const deleteRes = await fetch(`${BASE_URL}/categories/${createdCat.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!deleteRes.ok) {
      const err = await deleteRes.json();
      throw new Error(`Delete failed: ${JSON.stringify(err)}`);
    }
    console.log('   Category deleted successfully.');

    console.log('\n--- VERIFICATION SUCCESSFUL ---');

  } catch (err) {
    console.error('\n!!! VERIFICATION FAILED !!!');
    console.error(err);
  }
}

main();
