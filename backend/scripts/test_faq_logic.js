const Sails = require('sails').constructor;
const mySailsApp = new Sails();
require('dotenv').config();

mySailsApp.load({
  hooks: { grunt: false, views: false, pubsub: false, session: false, http: false },
  log: { level: 'error' }
}, async (err) => {
  if (err) { process.exit(1); }

  console.log('\n--- Testing Hybrid FAQ Logic ---');
  
  try {
    // Simulate a Customer user
    const customer = await sails.models.user.findOne({ email: 'client@pro-wise.com' });
    if (!customer) {
        console.log('Customer test user not found. Skipping detailed check.');
    } else {
        const product = await sails.models.product.findOne();
        
        // Mock a request object
        const req = {
            user: { id: customer.id, role: 'customer' },
            body: {
                title: 'How do I overclock this?',
                description: 'I want more power.',
                type: 'faq',
                product: product.id,
                answer: 'TRESPASSING ANSWER' // Should be stripped
            }
        };

        // Mock global models for the controller execution
        global.Product = sails.models.product;
        global.Content = sails.models.content;
        global.Role = sails.models.role;
        global.Notification = sails.models.notification;
        global.User = sails.models.user;
        global.logAction = async () => {}; // Stub logAction

        const res = {
            badRequest: (d) => console.log('BAD REQUEST:', d),
            notFound: (d) => console.log('NOT FOUND:', d),
            serverError: (d) => console.log('SERVER ERROR:', d),
            ok: (d) => {
                console.log('[✓] FAQ Created by Customer.');
                console.log('    Answer Stripped:', d.answer === null ? 'YES' : 'NO');
                console.log('    Assigned Company:', d.company ? 'YES' : 'NO');
                console.log('    Status:', d.status);
            }
        };

        const contentController = require('../api/controllers/ContentController.js');
        await contentController.create(req, res);
    }

  } catch (e) {
    console.error('\n[Fatal Error]:', e.message);
  }

  mySailsApp.lower();
});
