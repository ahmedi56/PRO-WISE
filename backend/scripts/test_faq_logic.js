const Sails = require('sails').constructor;
const mySailsApp = new Sails();
const rc = require('sails/accessible/rc');
require('dotenv').config();

const config = rc('sails');
config.hooks = {
  grunt: false,
  views: false,
  pubsub: false,
  session: false,
  http: false,
  sockets: false,
  orm: require('sails-hook-orm')
};
config.log = { level: 'error' };

mySailsApp.load(config, async (err) => {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  console.log('\n--- Testing Comprehensive FAQ Logic & Permissions ---');
  
  try {
    // 1. Resolve users for testing
    const users = await sails.models.user.find();
    if (!users || users.length === 0) {
      console.error('No users found in database for testing.');
      mySailsApp.lower();
      return;
    }
    const customer = users[0];
    const technician = users[1] || users[0];
    const companyAdmin = users[2] || users[0];

    const products = await sails.models.product.find().limit(1);
    const product = products[0];
    if (!product) {
      console.error('No products found for testing.');
      mySailsApp.lower();
      return;
    }

    console.log(`Roles resolved:
      - Customer: ${customer.email} (ID: ${customer.id})
      - Technician: ${technician.email} (ID: ${technician.id})
      - Company Admin: ${companyAdmin.email} (ID: ${companyAdmin.id})
      - Product: ${product.name} (ID: ${product.id}, Company: ${product.company})
    `);

    // Global mocks for controllers
    global.Product = sails.models.product;
    global.Content = sails.models.content;
    global.Role = sails.models.role;
    global.Notification = sails.models.notification;
    global.User = sails.models.user;
    global.logAction = async () => {};

    const contentController = require('../api/controllers/ContentController.js');
    let createdFaqId = null;

    // --- STEP 1: Customer Creates Question ---
    console.log('\n[TEST 1] Customer submits a question');
    const req1 = {
      user: { id: customer.id, role: 'customer' },
      body: {
        title: 'How do I clean the air filter?',
        description: 'Does it require soap?',
        type: 'faq',
        product: product.id,
        answer: 'SHOULD BE STRIPPED'
      }
    };
    
    let resData1 = null;
    const res1 = {
      badRequest: (d) => console.log('   ❌ BAD REQUEST:', d),
      ok: (d) => {
        resData1 = d;
        createdFaqId = d.id;
        console.log('   ✅ OK: FAQ Question Created');
        console.log('      - Title:', d.title);
        console.log('      - Description:', d.description);
        console.log('      - Answer (Stripped?):', d.answer === null ? 'YES' : 'NO');
        console.log('      - Status (Pending?):', d.status);
        console.log('      - Assigned Company ID:', d.company);
        console.log('      - Question Field populated:', d.question === d.description ? 'YES' : 'NO');
      }
    };
    await contentController.create(req1, res1);

    if (!createdFaqId) throw new Error('Failed to create FAQ in Test 1');

    // --- STEP 2: Customer tries to answer own question (Should fail / be stripped or blocked) ---
    console.log('\n[TEST 2] Customer attempts to update with an answer');
    const req2 = {
      user: { id: customer.id, role: 'customer' },
      params: { id: createdFaqId },
      body: { answer: 'My own customer answer' }
    };
    const res2 = {
      forbidden: (d) => console.log('   ✅ FORBIDDEN (Expected):', d.error),
      ok: (d) => console.log('   ❌ OK (Unexpected): Customer answered question', d)
    };
    await contentController.update(req2, res2);

    // --- STEP 3: Technician answers the question ---
    console.log('\n[TEST 3] Technician answers the question');
    const req3 = {
      user: { id: technician.id, role: 'technician' },
      params: { id: createdFaqId },
      body: { answer: 'Clean it with mild soap and water.' }
    };
    const res3 = {
      badRequest: (d) => console.log('   ❌ BAD REQUEST:', d),
      forbidden: (d) => console.log('   ❌ FORBIDDEN:', d),
      ok: (d) => {
        console.log('   ✅ OK: Technician Answered Question');
        console.log('      - Answer:', d.answer);
        console.log('      - AnsweredBy:', d.answeredBy);
        console.log('      - Status (Approved?):', d.status);
      }
    };
    await contentController.update(req3, res3);

    // --- STEP 4: Another Technician tries to edit the answer (Should fail) ---
    console.log('\n[TEST 4] Another user / technician attempts to edit the answer');
    const req4 = {
      user: { id: 'some-other-tech-id', role: 'technician' },
      params: { id: createdFaqId },
      body: { answer: 'Clean it with dry cloth instead.' }
    };
    const res4 = {
      forbidden: (d) => console.log('   ✅ FORBIDDEN (Expected):', d.error),
      ok: (d) => console.log('   ❌ OK (Unexpected): Other technician edited answer', d)
    };
    await contentController.update(req4, res4);

    // --- STEP 5: Original Technician edits their own answer ---
    console.log('\n[TEST 5] Original Technician edits their own answer');
    const req5 = {
      user: { id: technician.id, role: 'technician' },
      params: { id: createdFaqId },
      body: { answer: 'Clean it with mild soap and lukewarm water, then air dry.' }
    };
    const res5 = {
      badRequest: (d) => console.log('   ❌ BAD REQUEST:', d),
      forbidden: (d) => console.log('   ❌ FORBIDDEN:', d),
      ok: (d) => {
        console.log('   ✅ OK: Technician Updated Own Answer');
        console.log('      - New Answer:', d.answer);
      }
    };
    await contentController.update(req5, res5);

    // --- STEP 6: Company Admin modifies everything ---
    console.log('\n[TEST 6] Company Admin edits the question and the answer');
    const req6 = {
      user: { id: companyAdmin.id, role: 'company_admin', companyId: product.company },
      params: { id: createdFaqId },
      body: { 
        title: 'Cleaning Air Filter Instructions',
        description: 'How to clean the integrated filter?',
        answer: 'Use mild soap, water, and air dry.'
      }
    };
    const res6 = {
      forbidden: (d) => console.log('   ❌ FORBIDDEN:', d),
      ok: (d) => {
        console.log('   ✅ OK: Company Admin Edited FAQ');
        console.log('      - New Title:', d.title);
        console.log('      - New Description:', d.description);
        console.log('      - New Answer:', d.answer);
        console.log('      - Question field updated:', d.question === d.description ? 'YES' : 'NO');
      }
    };
    await contentController.update(req6, res6);

    // --- STEP 7: Customer attempts to delete the answered FAQ (Should fail) ---
    console.log('\n[TEST 7] Customer attempts to delete answered FAQ');
    const req7 = {
      user: { id: customer.id, role: 'customer' },
      params: { id: createdFaqId }
    };
    const res7 = {
      forbidden: (d) => console.log('   ✅ FORBIDDEN (Expected):', d.error),
      ok: (d) => console.log('   ❌ OK (Unexpected): Customer deleted answered FAQ', d)
    };
    await contentController.delete(req7, res7);

    // --- Cleanup ---
    console.log('\nCleaning up created FAQ...');
    await sails.models.content.destroyOne({ id: createdFaqId });
    console.log('Test completed successfully.');

  } catch (e) {
    console.error('\n[Fatal Error]:', e.stack);
  }

  mySailsApp.lower();
});
