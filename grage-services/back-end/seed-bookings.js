#!/usr/bin/env node
/**
 * Seed test booking data for customer dashboard demo
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/garage_services';

async function seedBookings() {
  let client;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();

    console.log('🌱 Seeding test booking data...\n');

    // Get a sample user
    const user = await db.collection('users').findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const userId = user.userId || user.id;
    console.log(`👤 Using user: ${user.email} (userId: ${userId})`);

    // Get a sample service
    const service = await db.collection('services').findOne();
    const serviceId = service?._id || service?.id || 1;
    const serviceName = service?.name || service?.title || 'General Service';

    console.log(`🔧 Using service: ${serviceName}\n`);

    // Delete existing bookings for this user
    const deleteResult = await db.collection('bookings').deleteMany({ userId });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing bookings for this user`);

    // Get next booking ID
    const maxBooking = await db.collection('bookings').findOne({}, { sort: { id: -1 } });
    const nextId = (maxBooking?.id || 0) + 1;

    // Create test bookings
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const testBookings = [
      {
        id: nextId,
        userId,
        userObjectId: user._id,
        serviceId,
        serviceName,
        status: 'completed',
        scheduledAt: lastMonth.toISOString(),
        date: lastMonth.toISOString().split('T')[0],
        time: '10:00 AM',
        mechanicName: 'Raj Kumar',
        amount: 1500,
        createdAt: lastMonth.toISOString(),
      },
      {
        id: nextId + 1,
        userId,
        userObjectId: user._id,
        serviceId,
        serviceName,
        status: 'completed',
        scheduledAt: new Date(lastMonth.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        date: new Date(lastMonth.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '2:00 PM',
        mechanicName: 'Priya Singh',
        amount: 2500,
        createdAt: new Date(lastMonth.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: nextId + 2,
        userId,
        userObjectId: user._id,
        serviceId,
        serviceName,
        status: 'pending',
        scheduledAt: nextWeek.toISOString(),
        date: nextWeek.toISOString().split('T')[0],
        time: '11:00 AM',
        mechanicName: 'Vikram Patel',
        createdAt: now.toISOString(),
      },
      {
        id: nextId + 3,
        userId,
        userObjectId: user._id,
        serviceId,
        serviceName: 'Major Service',
        status: 'confirmed',
        scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:30 AM',
        mechanicName: 'Raj Kumar',
        createdAt: now.toISOString(),
      },
    ];

    const insertResult = await db.collection('bookings').insertMany(testBookings);
    console.log(`✅ Created ${insertResult.insertedIds.length} test bookings:\n`);

    testBookings.forEach((b, i) => {
      console.log(`  [${i+1}] ${b.serviceName} - ${b.status.toUpperCase()}`);
      console.log(`      📅 ${b.date} at ${b.time}`);
      console.log(`      👨‍🔧 ${b.mechanicName}`);
      if (b.amount) console.log(`      💰 ₹${b.amount}`);
      console.log('');
    });

    console.log('🎉 Booking data seeded successfully!');
    console.log('\nYou should now see:');
    console.log('  • 2 completed bookings in "Service History" tab');
    console.log('  • 2 upcoming bookings in "My Bookings" tab');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    if (client) await client.close();
  }
}

seedBookings();
