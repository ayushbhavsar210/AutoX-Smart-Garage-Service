/**
 * Test New User with userId
 */

const BASE_URL = 'http://localhost:5000';
const newTestEmail = `test-${Date.now()}@example.com`;

const apiCall = async (method, endpoint, payload = null, headers = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers }
  };
  if (payload) options.body = JSON.stringify(payload);

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, success: response.ok, data };
  } catch (error) {
    return { status: 0, success: false, error: error.message };
  }
};

const run = async () => {
  console.log('\n\n🚀 TEST: New User userId Field\n');

  // Register new user
  console.log('📊 Registering new user with email:', newTestEmail);
  const registerRes = await apiCall('POST', '/auth/register', {
    name: 'New Test User',
    email: newTestEmail,
    password: 'Test123!@#',
    phone: '+919876543210',
    role: 'customer'
  });

  console.log('Response Status:', registerRes.status);
  const newUser = registerRes.data?.data || registerRes.data?.user;
  
  if (newUser) {
    console.log('\n✅ User Registered Successfully!');
    console.log('   ID:', newUser.id);
    console.log('   UserID:', newUser.userId);
    console.log('   Name:', newUser.name);
    console.log('   Email:', newUser.email);
    
    if (newUser.userId) {
      console.log('\n✅ SUCCESS: New user HAS userId field!');
    } else {
      console.log('\n❌ ISSUE: New user does NOT have userId field');
    }
  } else {
    console.log('❌ User registration failed:', registerRes.data);
  }
  
  console.log('\n');
};

run().catch(console.error);
