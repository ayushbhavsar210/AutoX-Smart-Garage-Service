/*
 Temporary API smoke test runner
 - Starts backend with TEST_MONGODB_URI (or MONGODB_URI) on TEST_PORT
 - Runs core API tests against that test DB
 - Drops test DB before run (and after run unless KEEP_TEST_DATA=true)
*/

const { spawn } = require('child_process');
const path = require('path');
const { MongoClient } = require('mongodb');

const backendDir = path.resolve(__dirname, '..');

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'AutoX_test';
const TEST_PORT = Number(process.env.TEST_PORT || 3101);
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const KEEP_TEST_DATA = String(process.env.KEEP_TEST_DATA || 'false').toLowerCase() === 'true';

function toTestDbUri(uri, dbName) {
  const url = new URL(uri);
  url.pathname = `/${dbName}`;
  return url.toString();
}

const sourceMongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
if (!sourceMongoUri) {
  console.error('❌ Missing TEST_MONGODB_URI (or MONGODB_URI) in environment.');
  process.exit(1);
}

const testMongoUri = toTestDbUri(sourceMongoUri, TEST_DB_NAME);

async function dropTestDb() {
  const client = new MongoClient(testMongoUri);
  try {
    await client.connect();
    await client.db(TEST_DB_NAME).dropDatabase();
    console.log(`🧹 Dropped test DB: ${TEST_DB_NAME}`);
  } finally {
    await client.close();
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(TEST_PORT),
      MONGODB_URI: testMongoUri,
      JWT_SECRET: process.env.JWT_SECRET || 'temp-test-secret',
    };

    const child = spawn('node', ['server.js'], {
      cwd: backendDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let settled = false;

    const onReady = (chunk) => {
      const text = chunk.toString();
      process.stdout.write(`[server] ${text}`);
      if (!settled && text.includes('Server running at')) {
        settled = true;
        resolve(child);
      }
    };

    child.stdout.on('data', onReady);
    child.stderr.on('data', (chunk) => {
      process.stderr.write(`[server:err] ${chunk.toString()}`);
    });

    child.on('exit', (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Server exited early with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Server startup timeout (20s)'));
      }
    }, 20000);
  });
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) return resolve();
    child.once('exit', () => resolve());
    child.kill();
    setTimeout(() => resolve(), 3000);
  });
}

async function apiCall({ name, method, route, body, token, expectStatus }) {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available. Use Node.js 18+');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  const text = await response.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_e) {
    json = { raw: text };
  }

  const passed = Array.isArray(expectStatus)
    ? expectStatus.includes(response.status)
    : response.status === expectStatus;

  return {
    name,
    method,
    route,
    status: response.status,
    passed,
    response: json,
  };
}

async function run() {
  const report = [];
  let server;

  try {
    console.log('🚀 Preparing temporary API test run...');
    await dropTestDb();

    server = await startServer();
    console.log(`✅ Server ready at ${BASE_URL}`);

    const unique = Date.now();
    const email = `temp.test.${unique}@autox.dev`;
    const password = 'Temp@12345';

    const register = await apiCall({
      name: 'Auth Register',
      method: 'POST',
      route: '/auth/register',
      body: { name: 'Temp API User', email, password },
      expectStatus: [200, 201],
    });
    report.push(register);

    const login = await apiCall({
      name: 'Auth Login',
      method: 'POST',
      route: '/auth/login',
      body: { email, password },
      expectStatus: 200,
    });
    report.push(login);

    const token = login.response?.token;

    const me = await apiCall({
      name: 'Auth Me',
      method: 'GET',
      route: '/auth/me',
      token,
      expectStatus: 200,
    });
    report.push(me);

    const createVehicle = await apiCall({
      name: 'Create Vehicle',
      method: 'POST',
      route: '/vehicles',
      token,
      body: {
        make: 'Honda',
        model: 'City',
        year: 2022,
        plate: `GJ01AB${String(unique).slice(-4)}`,
      },
      expectStatus: [200, 201],
    });
    report.push(createVehicle);

    const listVehicles = await apiCall({
      name: 'List Vehicles',
      method: 'GET',
      route: '/vehicles',
      token,
      expectStatus: 200,
    });
    report.push(listVehicles);

    const createBooking = await apiCall({
      name: 'Create Booking (Auth)',
      method: 'POST',
      route: '/bookings',
      token,
      body: {
        serviceId: 1,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Temporary API smoke test booking',
      },
      expectStatus: [200, 201],
    });
    report.push(createBooking);

    const listBookings = await apiCall({
      name: 'List My Bookings',
      method: 'GET',
      route: '/bookings',
      token,
      expectStatus: 200,
    });
    report.push(listBookings);

    const createPublicBooking = await apiCall({
      name: 'Create Booking (Public)',
      method: 'POST',
      route: '/api/bookings',
      body: {
        customerName: 'Guest User',
        email: `guest.${unique}@autox.dev`,
        phone: '9876543210',
        serviceId: 2,
        serviceName: 'General Service',
        vehicleNumber: 'GJ01XY1234',
        date: '2026-03-01',
        timeSlot: '10:00',
        notes: 'Guest booking by temporary script',
        amount: 500,
      },
      expectStatus: [200, 201],
    });
    report.push(createPublicBooking);

    const contact = await apiCall({
      name: 'Contact Submit',
      method: 'POST',
      route: '/api/contact',
      body: {
        name: 'Temp Contact',
        email: `contact.${unique}@autox.dev`,
        message: 'Temporary contact test',
      },
      expectStatus: [200, 201],
    });
    report.push(contact);

    const services = await apiCall({
      name: 'List Services',
      method: 'GET',
      route: '/services',
      expectStatus: 200,
    });
    report.push(services);

    const passedCount = report.filter((item) => item.passed).length;
    const failedCount = report.length - passedCount;

    console.log('\n📋 Temporary API Test Report');
    console.log('='.repeat(72));
    report.forEach((item, idx) => {
      const mark = item.passed ? '✅' : '❌';
      console.log(`${String(idx + 1).padStart(2, '0')}. ${mark} ${item.name} | ${item.method} ${item.route} | status=${item.status}`);
      if (!item.passed) {
        console.log(`    ↳ response: ${JSON.stringify(item.response)}`);
      }
    });
    console.log('='.repeat(72));
    console.log(`Total: ${report.length}, Passed: ${passedCount}, Failed: ${failedCount}`);

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`❌ Test run failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await stopServer(server);
    if (!KEEP_TEST_DATA) {
      try {
        await dropTestDb();
      } catch (cleanupErr) {
        console.error(`⚠️ Cleanup failed: ${cleanupErr.message}`);
      }
    } else {
      console.log(`ℹ️ KEEP_TEST_DATA=true, test DB kept: ${TEST_DB_NAME}`);
    }
  }
}

run();
