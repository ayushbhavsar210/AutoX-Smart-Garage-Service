const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://milesh2309_db_user:Autox123@autox.uqz8fgn.mongodb.net/AutoX';

async function run() {
  const client = await MongoClient.connect(uri);
  const db = client.db('AutoX');

  // Add phone: '' to all users missing the phone field
  const result = await db.collection('users').updateMany(
    { phone: { $exists: false } },
    { $set: { phone: '' } }
  );
  console.log('Updated', result.modifiedCount, 'users to have empty phone field');

  // Delete test user
  const del = await db.collection('users').deleteOne({ email: /phonetest_/ });
  console.log('Deleted test user:', del.deletedCount);

  // Show all users with phone field
  const users = await db.collection('users').find({}, { projection: { name: 1, fullName: 1, phone: 1, userId: 1 } }).toArray();
  console.log('\nAll users phone status:');
  users.forEach(u => console.log(`  ${u.userId || 'N/A'} - ${u.name || u.fullName || 'unnamed'} - phone: "${u.phone || '(missing)'}"`));

  await client.close();
}

run().catch(console.error);
