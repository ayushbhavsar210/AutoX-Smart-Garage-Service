/**
 * Debug: Check userId in database
 */

const BASE_URL = 'http://localhost:5000';
const { MongoClient } = require('mongodb');

const run = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('garage_services');
    
    console.log('\n📊 Checking users in database:\n');
    
    const users = await db.collection('users')
      .find({})
      .limit(5)
      .toArray();
    
    users.forEach((user, idx) => {
      console.log(`[${idx + 1}] ${user.email}`);
      console.log(`    _id: ${user._id}`);
      console.log(`    userId: ${user.userId}`);
      console.log(`    name: ${user.name}`);
      console.log('');
    });
    
  } finally {
    await client.close();
  }
};

run().catch(console.error);
