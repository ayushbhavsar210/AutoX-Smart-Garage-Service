/**
 * Test Data Flow Script
 * Tests the complete booking and billing flow
 */

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testUserId = '';

// Test credentials
const testCredentials = {
  email: 'test@example.com',
  password: 'Test123!@#'
};

const log = (section, message, data = '') => {
  console.log(`\n📊 ${section}`);
  console.log(`   ${message}`);
  if (data) {
    console.log(`   ${JSON.stringify(data, null, 2).split('\n').join('\n   ')}`);
  }
};

const apiCall = async (method, endpoint, payload = null, headers = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      data,
      url
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
      url
    };
  }
};

const run = async () => {
  console.log('\n🚀 STARTING DATA FLOW TEST\n');
  console.log('=====================================\n');

  // Step 1: Try to register a test user
  log('Step 1', 'Attempting to register test user...');
  const registerRes = await apiCall('POST', '/auth/register', {
    name: 'Test Customer',
    email: testCredentials.email,
    password: testCredentials.password,
    phone: '+919876543210',
    role: 'customer'
  });
  log('Step 1 Result', `Status: ${registerRes.status}`, registerRes.data);

  // Step 2: Login
  log('Step 2', 'Logging in with test credentials...');
  const loginRes = await apiCall('POST', '/auth/login', testCredentials);
  log('Step 2 Result', `Status: ${loginRes.status}`, loginRes.data);

  if (!loginRes.success || !loginRes.data?.token) {
    console.log('❌ Login failed, cannot continue');
    return;
  }

  authToken = loginRes.data.token;
  const user = loginRes.data.data || loginRes.data.user;
  testUserId = user?.userId || user?._id;

  log('Authentication', `Token: ${authToken.substring(0, 20)}...`, `User ID: ${testUserId}`);

  // Step 3: Create a booking
  log('Step 3', 'Creating a test booking...');
  const bookingPayload = {
    serviceId: 1,
    serviceName: 'Oil Change',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Test booking',
    vehicleNumber: 'TN01AB1234',
    vehicleCompany: 'Maruti',
    vehicleModel: 'Swift',
    vehicleType: 'Car'
  };

  const bookingRes = await apiCall('POST', '/bookings', bookingPayload, {
    'Authorization': `Bearer ${authToken}`
  });
  log('Step 3 Result', `Status: ${bookingRes.status}`, bookingRes.data);

  if (!bookingRes.success) {
    console.log('⚠️ Booking creation failed');
  }

  // Step 4: Fetch my bookings
  log('Step 4', 'Fetching user bookings from /api/bookings/me...');
  const myBookingsRes = await apiCall('GET', '/api/bookings/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  log('Step 4 Result', `Status: ${myBookingsRes.status}`, myBookingsRes.data);

  if (myBookingsRes.data?.data) {
    log('Step 4 Data', `Found ${myBookingsRes.data.data.length} bookings`);
    myBookingsRes.data.data.forEach((booking, idx) => {
      console.log(`   [${idx + 1}] ID: ${booking.id}, Service: ${booking.serviceName}, Status: ${booking.status}`);
    });
  }

  // Step 5: Fetch service history
  log('Step 5', 'Fetching service history from /api/bookings/history/me...');
  const historyRes = await apiCall('GET', '/api/bookings/history/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  log('Step 5 Result', `Status: ${historyRes.status}`, historyRes.data);

  if (historyRes.data?.data) {
    log('Step 5 Data', `Found ${historyRes.data.data.length} completed services`);
  }

  // Step 6: Fetch billing/invoices
  log('Step 6', 'Fetching invoices from /api/billing/me...');
  const billingRes = await apiCall('GET', '/api/billing/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  log('Step 6 Result', `Status: ${billingRes.status}`, billingRes.data);

  if (billingRes.data?.data) {
    log('Step 6 Data', `Found ${billingRes.data.data.length} invoices`);
    billingRes.data.data.forEach((invoice, idx) => {
      console.log(`   [${idx + 1}] Invoice: ${invoice.invoiceNumber}, Amount: ${invoice.finalTotal}, Status: ${invoice.status}`);
    });
  }

  // Step 7: Test unauthenticated booking
  log('Step 7', 'Testing public booking creation (unauthenticated)...');
  const publicBookingRes = await apiCall('POST', '/api/bookings', {
    customerName: 'Guest User',
    customerEmail: 'guest@example.com',
    customerPhone: '+919876543210',
    serviceId: 1,
    serviceName: 'General Service',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    vehicleNumber: 'KA01CD5678',
    vehicleCompany: 'Honda',
    vehicleModel: 'City',
  });
  log('Step 7 Result', `Status: ${publicBookingRes.status}`, publicBookingRes.data);

  console.log('\n=====================================');
  console.log('✅ TEST COMPLETE\n');

  // Summary
  console.log('SUMMARY:');
  console.log(`  ✓ Login: ${loginRes.success ? '✅' : '❌'}`);
  console.log(`  ✓ Create Booking: ${bookingRes.success ? '✅' : '❌'}`);
  console.log(`  ✓ Get My Bookings: ${myBookingsRes.success ? '✅' : '❌'} (${myBookingsRes.data?.data?.length || 0} records)`);
  console.log(`  ✓ Get Service History: ${historyRes.success ? '✅' : '❌'} (${historyRes.data?.data?.length || 0} records)`);
  console.log(`  ✓ Get Billing: ${billingRes.success ? '✅' : '❌'} (${billingRes.data?.data?.length || 0} records)`);
  console.log(`  ✓ Public Booking: ${publicBookingRes.success ? '✅' : '❌'}`);
  console.log('\n');
};

run().catch(console.error);
