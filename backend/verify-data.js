const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'prowise';

async function main() {
  try {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    const db = client.db(dbName);

    const roles = await db.collection('role').find({}).toArray();
    console.log('Found roles:', roles.length);
    roles.forEach(r => console.log(` - ${r.name} (${r._id})`));

    const users = await db.collection('user').find({}).toArray();
    console.log('Found users:', users.length);
    users.forEach(u => console.log(` - ${u.username} (${u.email}) [Role: ${u.role}]`));

    if (roles.length >= 3 && users.length >= 1) {
      console.log('\nVERIFICATION SUCCESS: Database seeded correctly.');
    } else {
      console.log('\nVERIFICATION WARNING: Data missing.');
    }

    return 'done';
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await client.close();
  }
}

main();
