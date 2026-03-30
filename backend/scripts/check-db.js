const { MongoClient } = require('mongodb');

async function main() {
  const url = 'mongodb://127.0.0.1:27017/prowise';
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db();
    const products = await db.collection('product').find({}).toArray();
    
    console.log(`Total products: ${products.length}`);
    products.forEach(p => {
      console.log(`- ${p.name}: Status=${p.status}, HasEmbedding=${!!p.embedding}, EmbeddingSize=${p.embedding ? p.embedding.length : 0}`);
    });
  } finally {
    await client.close();
  }
}

main().catch(console.error);
