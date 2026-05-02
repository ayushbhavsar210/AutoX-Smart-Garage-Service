#!/usr/bin/env node
/**
 * Check MongoDB for booking data
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/garage_services';
const configuredDbName = String(process.env.MONGODB_DB_NAME || '').trim();

async function checkDatabase() {
  let client;
  try {
    client = new MongoClient(connStr);
    await client.connect();
    const db = configuredDbName ? client.db(configuredDbName) : client.db();

    console.log('📊 Checking Garage Services Database...\n');

    // Check collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Available collections (${collections.length}):`);
    collections.forEach(c => console.log(`   - ${c.name}`));
    console.log('');

    // Check bookings collection
    if (collections.find(c => c.name === 'bookings')) {
      const bookingsCount = await db.collection('bookings').countDocuments();
      console.log(`📅 Bookings Collection: ${bookingsCount} records`);
      
      if (bookingsCount > 0) {
        const samples = await db.collection('bookings').find().limit(3).toArray();
        console.log('Sample records:');
        samples.forEach((b, i) => {
          console.log(`  [${i+1}] ID: ${b.id || b._id}, User: ${b.userId}, Status: ${b.status}, Service: ${b.serviceName}`);
        });
      }
      console.log('');
    }

    // Check users collection
    if (collections.find(c => c.name === 'users')) {
      const usersCount = await db.collection('users').countDocuments();
      console.log(`👥 Users Collection: ${usersCount} records`);
      
      const sample = await db.collection('users').findOne();
      if (sample) {
        console.log(`Sample user: ${sample.email} (userId: ${sample.userId})`);
      }
      console.log('');
    }

    // Check for bookings by specific user (if any user exists)
    if (collections.find(c => c.name === 'bookings')) {
      const sample = await db.collection('users').findOne();
      if (sample && sample.userId) {
        const userBookings = await db.collection('bookings')
          .find({ userId: sample.userId })
          .toArray();
        console.log(`📅 Sample user's bookings: ${userBookings.length}`);
        if (userBookings.length > 0) {
          userBookings.forEach(b => {
            console.log(`   - ${b.serviceName} (${b.status}) on ${b.scheduledAt || b.date}`);
          });
        }
      }
    }

    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

checkDatabase();
