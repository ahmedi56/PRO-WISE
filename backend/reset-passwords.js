const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  try {
    await client.connect();
    const db = client.db('prowise');

    // Hash the new password we want to assign
    const newHash = await bcrypt.hash('Password123!', 10);

    // Update all users except the admin
    const result = await db.collection('user').updateMany(
            { email: { $ne: 'admin@prowise.com' } },
            { $set: { password: newHash } }
    );

    console.log(`Successfully updated ${result.modifiedCount} users to password 'Password123!'`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

run();
