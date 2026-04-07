/**
 * reset-user-password.js
 * 
 * Usage: node reset-user-password.js <email> <newPassword>
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function run() {
  const email = process.argv[2] || 'sami@gmail.com';
  const newPassword = process.argv[3] || 'Sami123!';
  const url = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/prowise';

  if (!email || !newPassword) {
    console.error('Usage: node reset-user-password.js <email> <newPassword>');
    process.exit(1);
  }

  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db();
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await db.collection('user').updateOne({ email }, { $set: { password: hash } });
    
    if (result.matchedCount > 0) {
      console.log(`SUCCESS: Password for [${email}] has been reset to: ${newPassword}`);
    } else {
      console.log(`ERROR: User [${email}] not found.`);
    }
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await client.close();
  }
}

run();
