const { MongoClient, ServerApiVersion } = require('mongodb');

let db;
let client;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const shouldRetrySrvLookupFailure = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === 'ECONNREFUSED' && message.includes('querysrv');
};

const shouldRetryTransientConnectionFailure = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    shouldRetrySrvLookupFailure(error) ||
    message.includes('server selection timed out') ||
    message.includes('timed out after') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('network timeout')
  );
};

const ensureCommonIndexes = async () => {
  if (!db) return;

  await Promise.allSettled([
    db.collection('bookings').createIndexes([
      { key: { status: 1, createdAt: -1 }, name: 'bookings_status_createdAt' },
      { key: { scheduledAt: 1, createdAt: -1 }, name: 'bookings_scheduledAt_createdAt' },
      { key: { userId: 1, createdAt: -1 }, name: 'bookings_userId_createdAt' },
      { key: { email: 1, createdAt: -1 }, name: 'bookings_email_createdAt' },
      { key: { paymentStatus: 1, paymentDate: -1 }, name: 'bookings_paymentStatus_paymentDate' },
      { key: { transactionId: 1 }, name: 'bookings_transactionId' },
      { key: { razorpayPaymentId: 1 }, name: 'bookings_razorpayPaymentId' },
      { key: { razorpayOrderId: 1 }, name: 'bookings_razorpayOrderId' },
    ]),
    db.collection('service_payments').createIndexes([
      { key: { status: 1, createdAt: -1 }, name: 'servicePayments_status_createdAt' },
      { key: { email: 1, createdAt: -1 }, name: 'servicePayments_email_createdAt' },
      { key: { razorpay_order_id: 1 }, name: 'servicePayments_razorpayOrderId' },
      { key: { razorpay_payment_id: 1 }, name: 'servicePayments_razorpayPaymentId' },
      { key: { booking_id: 1 }, name: 'servicePayments_bookingId' },
    ]),
    db.collection('payments').createIndexes([
      { key: { status: 1, createdAt: -1 }, name: 'payments_status_createdAt' },
      { key: { userId: 1, createdAt: -1 }, name: 'payments_userId_createdAt' },
      { key: { paymentId: 1 }, name: 'payments_paymentId' },
    ]),
    db.collection('users').createIndex({ createdAt: -1 }, { name: 'users_createdAt' }),
    db.collection('reviews').createIndex({ createdAt: -1 }, { name: 'reviews_createdAt' }),
  ]);
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it in back-end/.env');
  }

  const isSrvConnection = String(uri).toLowerCase().startsWith('mongodb+srv://');
  const useTls = toBool(process.env.MONGODB_TLS, isSrvConnection);
  const allowInvalidTlsCerts = toBool(process.env.MONGODB_TLS_ALLOW_INVALID_CERTS, false);
  const serverSelectionTimeoutMS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 30000);
  const connectTimeoutMS = Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 15000);
  const socketTimeoutMS = Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000);
  const ipFamily = Number(process.env.MONGODB_IP_FAMILY || 0);

  const clientOptions = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS,
    connectTimeoutMS,
    socketTimeoutMS,
  };

  if (ipFamily === 4 || ipFamily === 6) {
    clientOptions.family = ipFamily;
  }

  if (useTls) {
    clientOptions.tls = true;
    clientOptions.tlsAllowInvalidCertificates = allowInvalidTlsCerts;
  }

  const maxRetries = Number(process.env.MONGODB_CONNECT_RETRIES || 3);
  let lastError;


  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      client = new MongoClient(uri, clientOptions);
      await client.connect();
      lastError = null;
      break;
    } catch (error) {
      lastError = error;

      if (client) {
        try {
          await client.close();
        } catch (_) {
          // Ignore close errors from partially initialized clients.
        }
      }

      if (!shouldRetryTransientConnectionFailure(error) || attempt >= maxRetries) {
        break;
      }

      const retryDelayMs = attempt * 1500;
      console.warn(
        `MongoDB SRV lookup failed (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelayMs}ms...`
      );
      await wait(retryDelayMs);
    }
  }

  if (lastError) {
    throw lastError;
  }

  const configuredDbName = String(process.env.MONGODB_DB_NAME || '').trim();
  db = configuredDbName ? client.db(configuredDbName) : client.db();
  console.log(`MongoDB Connected (DB: ${db.databaseName})`);

  ensureCommonIndexes().catch((error) => {
    console.warn('Index warmup failed:', error?.message || error);
  });
};

const getDB = () => db;

module.exports = { connectDB, getDB };