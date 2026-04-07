require('dotenv').config();
const { MongoClient } = require('mongodb');

async function findProducts() {
  const uri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/prowise';
  console.log('Connecting to:', uri);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();

    console.log('Scanning all databases for products...');
    let totalFound = 0;

    for (const dbInfo of result.databases) {
      const db = client.db(dbInfo.name);
      
      try {
        const collections = await db.listCollections().toArray();
        for (const coll of collections) {
          if (coll.name === 'product' || coll.name === 'products') {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`Database: [${dbInfo.name}] -> Collection: [${coll.name}] -> Count: ${count}`);
            if (count > 0) {
              const sample = await db.collection(coll.name).findOne({});
              console.log(`Sample from ${dbInfo.name}.${coll.name}:`, JSON.stringify(sample).substring(0, 200));
            }
            totalFound += count;
          }
        }
      } catch (err) {
        console.error(`Could not read database ${dbInfo.name}:`, err.message);
      }
    }

    console.log(`\nTotal products found across all databases: ${totalFound}`);

  } finally {
    await client.close();
  }
}

findProducts().catch(console.error);
