#!/usr/bin/env node
/**
 * Test script to debug customer booking data flow
 * Tests the actual endpoints that CustomerDashboard calls
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';

// Mock auth token (you'll need to get a real one from login)
const MOCK_TOKEN = 'your-auth-token-here';

const apiCall = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${headers.token || MOCK_TOKEN}`,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function main() {
  console.log('🧪 Testing Customer Booking Endpoints...\n');

  // Step 1: Check what endpoints exist
  console.log('📋 STEP 1: Test /customer/bookings endpoint');
  console.log('Calling: GET /customer/bookings (requires auth)');
  try {
    const res = await apiCall('GET', '/customer/bookings', null, { token: MOCK_TOKEN });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
    console.log('');
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('📋 STEP 2: Test /customer/service-history endpoint');
  console.log('Calling: GET /customer/service-history (requires auth)');
  try {
    const res = await apiCall('GET', '/customer/service-history', null, { token: MOCK_TOKEN });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
    console.log('');
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('📋 STEP 3: Test /api/bookings/me endpoint (alias)');
  console.log('Calling: GET /api/bookings/me (requires auth)');
  try {
    const res = await apiCall('GET', '/api/bookings/me', null, { token: MOCK_TOKEN });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
    console.log('');
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('📋 STEP 4: Test /api/bookings/history/me endpoint (alias)');
  console.log('Calling: GET /api/bookings/history/me (requires auth)');
  try {
    const res = await apiCall('GET', '/api/bookings/history/me', null, { token: MOCK_TOKEN });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
    console.log('');
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\n✅ Test complete. Check output above for issues.');
}

main().catch(console.error);
