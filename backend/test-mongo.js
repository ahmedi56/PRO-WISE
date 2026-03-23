const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/prowise';
  console.log('Attempting to connect to:', uri);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected successfully to server');
    await client.db('prowise').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
