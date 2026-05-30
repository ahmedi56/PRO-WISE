const { MongoClient } = require('mongodb');

async function run() {
  const url = 'mongodb://127.0.0.1:27017/prowise';
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('prowise');

    // Find the ASUS company
    const company = await db.collection('company').findOne({ name: /asus/i });
    if (!company) {
      console.log('ASUS company not found in DB');
      return;
    }
    console.log('Found ASUS company with ID:', company._id);

    // Find all products by manufacturer "ASUS" or name containing "ASUS"
    const products = await db.collection('product').find({
      $or: [
        { manufacturer: /asus/i },
        { name: /asus/i }
      ]
    }).toArray();

    console.log(`Found ${products.length} ASUS products`);

    for (const p of products) {
      // Update company and status
      const result = await db.collection('product').updateOne(
        { _id: p._id },
        { $set: { company: company._id.toString(), status: 'published' } }
      );
      console.log(`Updated product ${p.name} (ID: ${p._id}) - matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    }

    console.log('DONE!');

  } finally {
    await client.close();
  }
}

run().catch(console.dir);
