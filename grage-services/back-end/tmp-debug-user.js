require('dotenv').config();
const { MongoClient } = require('mongodb');
(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'autox');
    const email = 'ayushbhavsar70@gmail.com';

    const user = await db.collection('users').findOne({ email: { $regex: '^' + email.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '$', $options: 'i' } });
    console.log('USER:', user ? { _id: String(user._id), userId: user.userId, email: user.email, name: user.name, fullName: user.fullName, phone: user.phone } : null);

    if (!user) return;

    const filters = {
      $or: [
        { userId: user.userId },
        { userId: String(user.userId) },
        { user_id: user.userId },
        { user_id: String(user.userId) },
        { userid: user.userId },
        { userid: String(user.userId) },
        { userObjectId: String(user._id) },
        { userId: String(user._id) },
        { user_id: String(user._id) },
        { email: { $regex: '^' + email.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '$', $options: 'i' } }
      ]
    };

    const bookings = await db.collection('bookings').find(filters).limit(10).toArray();
    console.log('BOOKINGS_COUNT:', bookings.length);
    bookings.forEach((b, i) => console.log(i+1, {id:b.id, userId:b.userId, user_id:b.user_id, userObjectId:b.userObjectId, email:b.email, serviceName:b.serviceName, status:b.status, scheduledAt:b.scheduledAt}));

    const vehicles = await db.collection('vehicles').find(filters).limit(10).toArray();
    console.log('VEHICLES_COUNT:', vehicles.length);
    vehicles.forEach((v, i) => console.log(i+1, {id:v.id, userId:v.userId, user_id:v.user_id, userid:v.userid, plate:v.plate, vehicle_number:v.vehicle_number, email:v.email}));
  } finally {
    await client.close();
  }
})();
