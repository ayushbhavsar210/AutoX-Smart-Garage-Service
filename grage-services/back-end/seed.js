require('dotenv').config();
const mongoose = require('mongoose');

const models = require('./models/index');
const {
  User,
  Vehicle,
  Service,
  Booking,
  Mechanic,
  Assignment,
  BillingRecord,
  Payment,
} = models;

const requiredModelMap = {
  User,
  Vehicle,
  Service,
  Booking,
  Mechanic,
  Assignment,
  BillingRecord,
  Payment,
};

const missingModels = Object.entries(requiredModelMap)
  .filter(([, model]) => !model)
  .map(([name]) => name);

if (missingModels.length > 0) {
  console.error(`❌ Seed blocked: missing model exports in models/index.js -> ${missingModels.join(', ')}`);
  process.exit(1);
}

const isDevelopment = process.env.NODE_ENV === 'development';
const mongoUri = process.env.MONGODB_URI;

if (!isDevelopment) {
  console.error('❌ Seed blocked: NODE_ENV must be development.');
  process.exit(1);
}

if (!mongoUri) {
  console.error('❌ Seed blocked: MONGODB_URI is missing.');
  process.exit(1);
}

const now = Date.now();
const suffix = String(now).slice(-6);

const seedKeys = {
  adminEmail: `admin.seed.${suffix}@autox.dev`,
  customer1Email: `customer1.seed.${suffix}@autox.dev`,
  customer2Email: `customer2.seed.${suffix}@autox.dev`,
  vehicle1Plate: `SEED-GJ01-${suffix}`,
  vehicle2Plate: `SEED-GJ02-${suffix}`,
  serviceCodes: [
    `SEED-GEN-${suffix}`,
    `SEED-OIL-${suffix}`,
    `SEED-BRK-${suffix}`,
  ],
  mechanicCode: `SEED-MEC-${suffix}`,
  bookingNo1: `SEED-BKG-${suffix}-01`,
  bookingNo2: `SEED-BKG-${suffix}-02`,
  invoiceNumber: `SEED-INV-${suffix}`,
  paymentId: `SEED-PAY-${suffix}`,
};

async function connectDb() {
  await mongoose.connect(mongoUri);
  console.log(`✅ MongoDB connected for seeding | DB: ${mongoose.connection.name}`);
}

async function safeCleanup() {
  console.log('🧹 Cleaning only seed-pattern test records...');

  await Promise.all([
    User.deleteMany({
      email: {
        $in: [seedKeys.adminEmail, seedKeys.customer1Email, seedKeys.customer2Email],
      },
    }),
    Vehicle.deleteMany({
      plate: { $in: [seedKeys.vehicle1Plate, seedKeys.vehicle2Plate] },
    }),
    Service.deleteMany({
      serviceCode: { $in: seedKeys.serviceCodes },
    }),
    Booking.deleteMany({
      bookingNo: { $in: [seedKeys.bookingNo1, seedKeys.bookingNo2] },
    }),
    Mechanic.deleteMany({
      mechanicCode: seedKeys.mechanicCode,
    }),
    BillingRecord.deleteMany({
      invoiceNumber: seedKeys.invoiceNumber,
    }),
    Payment.deleteMany({
      paymentId: seedKeys.paymentId,
    }),
  ]);

  await Assignment.deleteMany({
    notes: { $regex: '^SEED_ASSIGNMENT_NOTE_' },
  });

  console.log('✅ Safe cleanup finished');
}

async function createUsers() {
  const admin = new User({
    fullName: 'AutoX Seed Admin',
    email: seedKeys.adminEmail,
    phone: '9000000001',
    role: 'admin',
    isActive: true,
  });
  await admin.setPassword('Admin@12345');
  await admin.save();

  const customer1 = new User({
    fullName: 'Seed Customer One',
    email: seedKeys.customer1Email,
    phone: '9000000002',
    role: 'customer',
    isActive: true,
  });
  await customer1.setPassword('Customer@123');
  await customer1.save();

  const customer2 = new User({
    fullName: 'Seed Customer Two',
    email: seedKeys.customer2Email,
    phone: '9000000003',
    role: 'customer',
    isActive: true,
  });
  await customer2.setPassword('Customer@123');
  await customer2.save();

  console.log('👤 Admin created:', admin._id.toString(), admin.email);
  console.log('👤 Customer1 created:', customer1._id.toString(), customer1.email);
  console.log('👤 Customer2 created:', customer2._id.toString(), customer2.email);

  return { admin, customer1, customer2 };
}

async function createVehicles(customer1, customer2) {
  const vehicle1 = await Vehicle.create({
    userId: customer1._id,
    plate: seedKeys.vehicle1Plate,
    make: 'Honda',
    model: 'City',
    year: 2022,
    color: 'White',
    fuelType: 'Petrol',
    odometerKm: 25000,
    isPrimary: true,
  });

  const vehicle2 = await Vehicle.create({
    userId: customer2._id,
    plate: seedKeys.vehicle2Plate,
    make: 'Hyundai',
    model: 'i20',
    year: 2021,
    color: 'Blue',
    fuelType: 'Petrol',
    odometerKm: 32000,
    isPrimary: true,
  });

  console.log('🚗 Vehicle1 created:', vehicle1._id.toString(), '->', customer1._id.toString());
  console.log('🚗 Vehicle2 created:', vehicle2._id.toString(), '->', customer2._id.toString());

  return { vehicle1, vehicle2 };
}

async function createServices() {
  const [service1, service2, service3] = await Service.create([
    {
      serviceCode: seedKeys.serviceCodes[0],
      name: 'General Inspection',
      description: 'Comprehensive vehicle health check',
      category: 'maintenance',
      basePrice: 999,
      estimatedDurationMinutes: 90,
      active: true,
    },
    {
      serviceCode: seedKeys.serviceCodes[1],
      name: 'Engine Oil Change',
      description: 'Premium oil and filter replacement',
      category: 'maintenance',
      basePrice: 1499,
      estimatedDurationMinutes: 60,
      active: true,
    },
    {
      serviceCode: seedKeys.serviceCodes[2],
      name: 'Brake Service',
      description: 'Brake pad and fluid diagnostics',
      category: 'repair',
      basePrice: 2199,
      estimatedDurationMinutes: 120,
      active: true,
    },
  ]);

  console.log('🛠️ Services created:', [service1._id, service2._id, service3._id].map((id) => id.toString()));

  return { service1, service2, service3 };
}

async function createBookings(customer1, customer2, vehicle1, vehicle2, service1, service2) {
  const booking1 = await Booking.create({
    bookingNo: seedKeys.bookingNo1,
    userId: customer1._id,
    vehicleId: vehicle1._id,
    serviceId: service1._id,
    customerName: customer1.fullName,
    email: customer1.email,
    phone: customer1.phone,
    vehicleNumber: vehicle1.plate,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    notes: 'Seed booking for customer 1',
    amount: service1.basePrice,
    status: 'scheduled',
  });

  const booking2 = await Booking.create({
    bookingNo: seedKeys.bookingNo2,
    userId: customer2._id,
    vehicleId: vehicle2._id,
    serviceId: service2._id,
    customerName: customer2.fullName,
    email: customer2.email,
    phone: customer2.phone,
    vehicleNumber: vehicle2.plate,
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    notes: 'Seed booking for customer 2',
    amount: service2.basePrice,
    status: 'pending',
  });

  console.log('📅 Booking1 created:', booking1._id.toString(), '-> user:', customer1._id.toString());
  console.log('📅 Booking2 created:', booking2._id.toString(), '-> user:', customer2._id.toString());

  return { booking1, booking2 };
}

async function createMechanicAndAssignment(booking1) {
  const mechanic = await Mechanic.create({
    mechanicCode: seedKeys.mechanicCode,
    fullName: 'Seed Mechanic One',
    phone: '9000000010',
    expertise: ['engine', 'brakes'],
    yearsExperience: 6,
    rating: 4.7,
    availability: true,
    status: 'active',
    assignedJobs: 1,
  });

  const assignment = await Assignment.create({
    bookingId: booking1._id,
    mechanicId: mechanic._id,
    notes: `SEED_ASSIGNMENT_NOTE_${suffix}`,
    status: 'assigned',
    progress: [{ status: 'assigned', note: 'Auto seeded assignment' }],
  });

  console.log('👨‍🔧 Mechanic created:', mechanic._id.toString());
  console.log('🔗 Assignment created:', assignment._id.toString(), 'booking:', booking1._id.toString(), 'mechanic:', mechanic._id.toString());

  return { mechanic, assignment };
}

async function createBillingAndPayment(customer1, booking1, service1) {
  const billingRecord = await BillingRecord.create({
    invoiceNumber: seedKeys.invoiceNumber,
    userId: customer1._id,
    bookingId: booking1._id,
    amount: service1.basePrice,
    currency: 'INR',
    status: 'issued',
    verified: false,
  });

  const payment = await Payment.create({
    paymentId: seedKeys.paymentId,
    userId: customer1._id,
    bookingId: booking1._id,
    invoiceId: billingRecord._id,
    amount: billingRecord.amount,
    method: 'upi',
    status: 'completed',
    gatewayProvider: 'razorpay',
    gatewayPaymentId: `rzp_${suffix}`,
    verifiedAt: new Date(),
  });

  console.log('🧾 BillingRecord created:', billingRecord._id.toString(), billingRecord.invoiceNumber);
  console.log('💳 Payment created:', payment._id.toString(), payment.paymentId, '-> invoice:', billingRecord._id.toString());

  return { billingRecord, payment };
}

async function seed() {
  try {
    await connectDb();
    await safeCleanup();

    const { customer1, customer2 } = await createUsers();
    const { vehicle1, vehicle2 } = await createVehicles(customer1, customer2);
    const { service1, service2 } = await createServices();
    const { booking1 } = await createBookings(customer1, customer2, vehicle1, vehicle2, service1, service2);
    await createMechanicAndAssignment(booking1);
    await createBillingAndPayment(customer1, booking1, service1);

    console.log('\n🎉 Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

seed();
