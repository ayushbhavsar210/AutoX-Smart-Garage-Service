/**
 * Comprehensive Seed Script — populates ALL collections used by controllers
 * Uses the native MongoDB driver (same as controllers) to ensure field-name consistency.
 *
 * Usage:  node seed-all.js
 */
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI missing in .env');
  process.exit(1);
}

// ── helpers ────────────────────────────────────────────────────
const iso = (daysOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n) => String(n).padStart(4, '0');

// ── seed data ──────────────────────────────────────────────────
async function run() {
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    tls: true,
    tlsAllowInvalidCertificates: true,
  });

  try {
    await client.connect();
    const db = client.db('AutoX');
    console.log('✅ Connected to AutoX');

    // ─── 0. DROP conflicting Mongoose-created unique indexes ──
    const indexDrops = [
      ['services', 'serviceCode_1'],
      ['mechanics', 'mechanicCode_1'],
      ['breakdown_calls', 'ticketNo_1'],
      ['repairs', 'repairNo_1'],
      ['inventory', 'sku_1'],
      ['modifications', 'modCode_1'],
      ['packages', 'packageCode_1'],
      ['bookings', 'bookingNo_1'],
      ['vehicles', 'plate_1'],
      ['vehicles', 'userId_1_plate_1'],
      ['billing_records', 'invoiceNumber_1'],
      ['payments', 'paymentId_1'],
    ];
    for (const [col, idx] of indexDrops) {
      try { await db.collection(col).dropIndex(idx); } catch (_) { /* index may not exist */ }
    }
    console.log('🗑️  Conflicting indexes cleaned');

    // ─── 1. USERS ───────────────────────────────────────────
    const usersData = [
      { userId: 1, name: 'Admin AutoX', email: 'admin@autox.com', password: 'admin123', phone: '9876543210', role: 'admin', isActive: true, createdAt: iso(-90) },
      { userId: 2, name: 'Rajesh Patel', email: 'rajesh.patel@gmail.com', password: 'pass123', phone: '9876543211', role: 'customer', isActive: true, createdAt: iso(-80) },
      { userId: 3, name: 'Priya Sharma', email: 'priya.sharma@gmail.com', password: 'pass123', phone: '9876543212', role: 'customer', isActive: true, createdAt: iso(-75) },
      { userId: 4, name: 'Amit Kumar', email: 'amit.kumar@gmail.com', password: 'pass123', phone: '9876543213', role: 'customer', isActive: true, createdAt: iso(-60) },
      { userId: 5, name: 'Sneha Gupta', email: 'sneha.gupta@gmail.com', password: 'pass123', phone: '9876543214', role: 'customer', isActive: true, createdAt: iso(-55) },
      { userId: 6, name: 'Vikram Singh', email: 'vikram.singh@gmail.com', password: 'pass123', phone: '9876543215', role: 'customer', isActive: true, createdAt: iso(-45) },
      { userId: 7, name: 'Anita Desai', email: 'anita.desai@gmail.com', password: 'pass123', phone: '9876543216', role: 'customer', isActive: true, createdAt: iso(-40) },
      { userId: 8, name: 'Karan Mehta', email: 'karan.mehta@gmail.com', password: 'pass123', phone: '9876543217', role: 'customer', isActive: true, createdAt: iso(-30) },
      { userId: 9, name: 'Deepak Joshi', email: 'deepak.joshi@gmail.com', password: 'pass123', phone: '9876543218', role: 'mechanic', isActive: true, createdAt: iso(-85) },
      { userId: 10, name: 'Manish Verma', email: 'manish.verma@gmail.com', password: 'pass123', phone: '9876543219', role: 'customer', isActive: false, createdAt: iso(-20) },
      { userId: 11, name: 'Neha Reddy', email: 'neha.reddy@gmail.com', password: 'pass123', phone: '9876543220', role: 'customer', isActive: true, createdAt: iso(-15) },
      { userId: 12, name: 'Suresh Nair', email: 'suresh.nair@gmail.com', password: 'pass123', phone: '9876543221', role: 'customer', isActive: true, createdAt: iso(-10) },
    ];
    await db.collection('users').deleteMany({ userId: { $gte: 1, $lte: 12 } });
    await db.collection('users').insertMany(usersData);
    console.log(`👤 Users seeded: ${usersData.length}`);

    // ─── 2. SERVICES ────────────────────────────────────────
    const servicesData = [
      { id: 1, serviceCode: 'SVC-GEN-001', name: 'General Service', basePrice: 2499, description: 'Complete vehicle health check and basic maintenance', category: 'maintenance', active: true, icon: '🔧', features: ['Oil check', 'Brake inspection', 'Fluid top-up'], estimatedDurationMinutes: 120, createdAt: iso(-100) },
      { id: 2, serviceCode: 'SVC-OIL-002', name: 'Engine Oil Change', basePrice: 1499, description: 'Premium engine oil and filter replacement', category: 'maintenance', active: true, icon: '🛢️', features: ['Synthetic oil', 'Filter replacement', 'Level check'], estimatedDurationMinutes: 60, createdAt: iso(-100) },
      { id: 3, serviceCode: 'SVC-BRK-003', name: 'Brake Pad Replacement', basePrice: 3499, description: 'Front and rear brake pad replacement with inspection', category: 'repair', active: true, icon: '🛑', features: ['Pad replacement', 'Rotor inspection', 'Fluid change'], estimatedDurationMinutes: 150, createdAt: iso(-100) },
      { id: 4, serviceCode: 'SVC-AC-004', name: 'AC Service & Gas Refill', basePrice: 1999, description: 'Complete AC system check and refrigerant refill', category: 'maintenance', active: true, icon: '❄️', features: ['Gas refill', 'Filter clean', 'Leak check'], estimatedDurationMinutes: 90, createdAt: iso(-100) },
      { id: 5, serviceCode: 'SVC-WHL-005', name: 'Wheel Alignment & Balancing', basePrice: 999, description: '4-wheel computerised alignment with balancing', category: 'maintenance', active: true, icon: '🎯', features: ['4-wheel alignment', 'Balancing', 'Tire rotation'], estimatedDurationMinutes: 60, createdAt: iso(-100) },
      { id: 6, serviceCode: 'SVC-BAT-006', name: 'Battery Replacement', basePrice: 4999, description: 'Battery health check and replacement if needed', category: 'repair', active: true, icon: '🔋', features: ['Battery test', 'Terminal cleaning', 'New battery'], estimatedDurationMinutes: 45, createdAt: iso(-100) },
      { id: 7, serviceCode: 'SVC-PNT-007', name: 'Full Body Paint', basePrice: 25000, description: 'Complete exterior repaint with primer and clear coat', category: 'body', active: true, icon: '🎨', features: ['Sanding', 'Primer', 'Base coat', 'Clear coat'], estimatedDurationMinutes: 2880, createdAt: iso(-100) },
      { id: 8, serviceCode: 'SVC-DNT-008', name: 'Denting & Painting', basePrice: 5999, description: 'Minor dent repair and touch-up painting', category: 'body', active: true, icon: '🔨', features: ['Dent removal', 'Filler', 'Color match paint'], estimatedDurationMinutes: 480, createdAt: iso(-100) },
      { id: 9, serviceCode: 'SVC-WSH-009', name: 'Car Wash & Detailing', basePrice: 799, description: 'Premium wash with interior and exterior detailing', category: 'cleaning', active: true, icon: '🧼', features: ['Foam wash', 'Vacuum', 'Dashboard polish', 'Tire shine'], estimatedDurationMinutes: 90, createdAt: iso(-95) },
      { id: 10, serviceCode: 'SVC-CLT-010', name: 'Clutch Replacement', basePrice: 8999, description: 'Clutch plate and pressure plate replacement', category: 'repair', active: true, icon: '⚙️', features: ['Clutch plate', 'Pressure plate', 'Release bearing'], estimatedDurationMinutes: 360, createdAt: iso(-95) },
    ];
    await db.collection('services').deleteMany({ $or: [{ id: { $gte: 1, $lte: 10 } }, { serviceCode: { $regex: /^SVC-/ } }] });
    await db.collection('services').insertMany(servicesData);
    console.log(`🛠️  Services seeded: ${servicesData.length}`);

    // ─── 3. MECHANICS ───────────────────────────────────────
    const mechanicsData = [
      { id: 1, mechanicCode: 'MEC-001', name: 'Ramesh Yadav', expertise: 'Engine, Transmission', phone: '9898000001', experience: '8 yrs', status: 'Available', rating: 4.8, assignedJobs: 2, createdAt: iso(-90) },
      { id: 2, mechanicCode: 'MEC-002', name: 'Sunil Chauhan', expertise: 'Brakes, Suspension', phone: '9898000002', experience: '6 yrs', status: 'Available', rating: 4.5, assignedJobs: 1, createdAt: iso(-88) },
      { id: 3, mechanicCode: 'MEC-003', name: 'Manoj Tiwari', expertise: 'Electrical, AC', phone: '9898000003', experience: '10 yrs', status: 'On Job', rating: 4.9, assignedJobs: 3, createdAt: iso(-85) },
      { id: 4, mechanicCode: 'MEC-004', name: 'Ajay Pandey', expertise: 'Body Work, Painting', phone: '9898000004', experience: '5 yrs', status: 'Available', rating: 4.3, assignedJobs: 0, createdAt: iso(-80) },
      { id: 5, mechanicCode: 'MEC-005', name: 'Deepak Sharma', expertise: 'Engine, Oil Change', phone: '9898000005', experience: '12 yrs', status: 'On Leave', rating: 4.7, assignedJobs: 0, createdAt: iso(-75) },
      { id: 6, mechanicCode: 'MEC-006', name: 'Ravi Prasad', expertise: 'Wheel, Tyre, Alignment', phone: '9898000006', experience: '4 yrs', status: 'Available', rating: 4.2, assignedJobs: 1, createdAt: iso(-70) },
    ];
    await db.collection('mechanics').deleteMany({ id: { $gte: 1, $lte: 6 } });
    await db.collection('mechanics').insertMany(mechanicsData);
    console.log(`👨‍🔧 Mechanics seeded: ${mechanicsData.length}`);

    // ─── 4. VEHICLES ────────────────────────────────────────
    const vehiclesData = [
      { id: 1, userId: 2, make: 'Honda', model: 'City', year: 2022, plate: 'GJ01AB1234', createdAt: iso(-70) },
      { id: 2, userId: 3, make: 'Hyundai', model: 'i20', year: 2021, plate: 'GJ05CD5678', createdAt: iso(-65) },
      { id: 3, userId: 4, make: 'Maruti', model: 'Swift', year: 2023, plate: 'GJ03EF9012', createdAt: iso(-55) },
      { id: 4, userId: 5, make: 'Tata', model: 'Nexon', year: 2022, plate: 'GJ01GH3456', createdAt: iso(-50) },
      { id: 5, userId: 6, make: 'Toyota', model: 'Innova', year: 2020, plate: 'GJ06IJ7890', createdAt: iso(-40) },
      { id: 6, userId: 7, make: 'Kia', model: 'Seltos', year: 2023, plate: 'GJ01KL2345', createdAt: iso(-35) },
      { id: 7, userId: 8, make: 'Mahindra', model: 'XUV700', year: 2024, plate: 'GJ05MN6789', createdAt: iso(-25) },
      { id: 8, userId: 11, make: 'MG', model: 'Hector', year: 2023, plate: 'GJ01OP1234', createdAt: iso(-12) },
      { id: 9, userId: 12, make: 'Skoda', model: 'Slavia', year: 2022, plate: 'GJ03QR5678', createdAt: iso(-8) },
    ];
    await db.collection('vehicles').deleteMany({ id: { $gte: 1, $lte: 9 } });
    await db.collection('vehicles').insertMany(vehiclesData);
    console.log(`🚗 Vehicles seeded: ${vehiclesData.length}`);

    // ─── 5. BOOKINGS ────────────────────────────────────────
    const bookingsData = [
      { id: 1, bookingNo: 'BK-0001', userId: 2, serviceId: 1, serviceName: 'General Service', customerName: 'Rajesh Patel', email: 'rajesh.patel@gmail.com', phone: '9876543211', vehicleNumber: 'GJ01AB1234', date: '15/02/2026', timeSlot: '10:00 AM', notes: 'Regular maintenance', amount: 2499, status: 'completed', scheduledAt: iso(-25), createdAt: iso(-30) },
      { id: 2, bookingNo: 'BK-0002', userId: 3, serviceId: 2, serviceName: 'Engine Oil Change', customerName: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '9876543212', vehicleNumber: 'GJ05CD5678', date: '18/02/2026', timeSlot: '11:30 AM', notes: 'Synthetic oil preferred', amount: 1499, status: 'completed', scheduledAt: iso(-22), createdAt: iso(-27) },
      { id: 3, bookingNo: 'BK-0003', userId: 4, serviceId: 3, serviceName: 'Brake Pad Replacement', customerName: 'Amit Kumar', email: 'amit.kumar@gmail.com', phone: '9876543213', vehicleNumber: 'GJ03EF9012', date: '22/02/2026', timeSlot: '09:00 AM', notes: 'Squeaking noise when braking', amount: 3499, status: 'completed', scheduledAt: iso(-18), createdAt: iso(-23) },
      { id: 4, bookingNo: 'BK-0004', userId: 5, serviceId: 4, serviceName: 'AC Service & Gas Refill', customerName: 'Sneha Gupta', email: 'sneha.gupta@gmail.com', phone: '9876543214', vehicleNumber: 'GJ01GH3456', date: '25/02/2026', timeSlot: '02:00 PM', notes: 'AC not cooling', amount: 1999, status: 'in-progress', scheduledAt: iso(-15), createdAt: iso(-20) },
      { id: 5, bookingNo: 'BK-0005', userId: 6, serviceId: 5, serviceName: 'Wheel Alignment & Balancing', customerName: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '9876543215', vehicleNumber: 'GJ06IJ7890', date: '28/02/2026', timeSlot: '10:00 AM', notes: 'Car pulling to the left', amount: 999, status: 'scheduled', scheduledAt: iso(-10), createdAt: iso(-15) },
      { id: 6, bookingNo: 'BK-0006', userId: 7, serviceId: 1, serviceName: 'General Service', customerName: 'Anita Desai', email: 'anita.desai@gmail.com', phone: '9876543216', vehicleNumber: 'GJ01KL2345', date: '02/03/2026', timeSlot: '11:00 AM', notes: '20,000 km service', amount: 2499, status: 'scheduled', scheduledAt: iso(-5), createdAt: iso(-10) },
      { id: 7, bookingNo: 'BK-0007', userId: 8, serviceId: 6, serviceName: 'Battery Replacement', customerName: 'Karan Mehta', email: 'karan.mehta@gmail.com', phone: '9876543217', vehicleNumber: 'GJ05MN6789', date: '05/03/2026', timeSlot: '03:00 PM', notes: 'Battery draining overnight', amount: 4999, status: 'pending', scheduledAt: iso(-2), createdAt: iso(-7) },
      { id: 8, bookingNo: 'BK-0008', userId: 11, serviceId: 9, serviceName: 'Car Wash & Detailing', customerName: 'Neha Reddy', email: 'neha.reddy@gmail.com', phone: '9876543220', vehicleNumber: 'GJ01OP1234', date: '08/03/2026', timeSlot: '09:30 AM', notes: 'Full interior detailing', amount: 799, status: 'pending', scheduledAt: iso(1), createdAt: iso(-3) },
      { id: 9, bookingNo: 'BK-0009', userId: 12, serviceId: 10, serviceName: 'Clutch Replacement', customerName: 'Suresh Nair', email: 'suresh.nair@gmail.com', phone: '9876543221', vehicleNumber: 'GJ03QR5678', date: '10/03/2026', timeSlot: '10:00 AM', notes: 'Clutch slipping at high RPM', amount: 8999, status: 'pending', scheduledAt: iso(3), createdAt: iso(-1) },
      { id: 10, bookingNo: 'BK-0010', userId: 2, serviceId: 8, serviceName: 'Denting & Painting', customerName: 'Rajesh Patel', email: 'rajesh.patel@gmail.com', phone: '9876543211', vehicleNumber: 'GJ01AB1234', date: '12/03/2026', timeSlot: '11:00 AM', notes: 'Small dent on rear bumper', amount: 5999, status: 'pending', scheduledAt: iso(5), createdAt: iso(0) },
    ];
    await db.collection('bookings').deleteMany({ id: { $gte: 1, $lte: 10 } });
    await db.collection('bookings').insertMany(bookingsData);
    console.log(`📅 Bookings seeded: ${bookingsData.length}`);

    // ─── 6. ASSIGNMENTS ─────────────────────────────────────
    const assignmentsData = [
      { id: 1, bookingId: 1, mechanicId: 1, mechanicName: 'Ramesh Yadav', customerName: 'Rajesh Patel', customer: 'Rajesh Patel', vehicle: 'Honda City', service: 'General Service', notes: 'Complete service check', job: 'Full inspection + oil change', status: 'completed', estimatedDuration: '2 hrs', progress: [{ stage: 'assigned', completed: true }, { stage: 'in-progress', completed: true }, { stage: 'completed', completed: true }], createdAt: iso(-28) },
      { id: 2, bookingId: 2, mechanicId: 5, mechanicName: 'Deepak Sharma', customerName: 'Priya Sharma', customer: 'Priya Sharma', vehicle: 'Hyundai i20', service: 'Engine Oil Change', notes: 'Use synthetic oil', job: 'Oil + filter replacement', status: 'completed', estimatedDuration: '1 hr', progress: [{ stage: 'assigned', completed: true }, { stage: 'completed', completed: true }], createdAt: iso(-25) },
      { id: 3, bookingId: 3, mechanicId: 2, mechanicName: 'Sunil Chauhan', customerName: 'Amit Kumar', customer: 'Amit Kumar', vehicle: 'Maruti Swift', service: 'Brake Pad Replacement', notes: 'Front + rear pads', job: 'Brake pad swap + rotor check', status: 'completed', estimatedDuration: '2.5 hrs', progress: [{ stage: 'assigned', completed: true }, { stage: 'in-progress', completed: true }, { stage: 'completed', completed: true }], createdAt: iso(-20) },
      { id: 4, bookingId: 4, mechanicId: 3, mechanicName: 'Manoj Tiwari', customerName: 'Sneha Gupta', customer: 'Sneha Gupta', vehicle: 'Tata Nexon', service: 'AC Service & Gas Refill', notes: 'Check for leaks', job: 'AC gas refill + filter clean', status: 'in-progress', estimatedDuration: '1.5 hrs', progress: [{ stage: 'assigned', completed: true }, { stage: 'in-progress', completed: true }], createdAt: iso(-14) },
      { id: 5, bookingId: 5, mechanicId: 6, mechanicName: 'Ravi Prasad', customerName: 'Vikram Singh', customer: 'Vikram Singh', vehicle: 'Toyota Innova', service: 'Wheel Alignment & Balancing', notes: 'Computerised alignment', job: '4-wheel alignment + balance', status: 'assigned', estimatedDuration: '1 hr', progress: [{ stage: 'assigned', completed: true }], createdAt: iso(-9) },
      { id: 6, bookingId: 6, mechanicId: 1, mechanicName: 'Ramesh Yadav', customerName: 'Anita Desai', customer: 'Anita Desai', vehicle: 'Kia Seltos', service: 'General Service', notes: '20k km milestone service', job: 'Full inspection', status: 'assigned', estimatedDuration: '2 hrs', progress: [{ stage: 'assigned', completed: true }], createdAt: iso(-4) },
    ];
    await db.collection('assignments').deleteMany({ id: { $gte: 1, $lte: 6 } });
    await db.collection('assignments').insertMany(assignmentsData);
    console.log(`🔗 Assignments seeded: ${assignmentsData.length}`);

    // ─── 7. BILLING RECORDS ─────────────────────────────────
    const billingData = [
      { invoiceNumber: 'INV-0001', userId: 2, amount: 2499, currency: 'INR', status: 'paid', verified: true, serviceName: 'General Service', paymentMethod: 'UPI', createdAt: iso(-25), verifiedAt: iso(-24) },
      { invoiceNumber: 'INV-0002', userId: 3, amount: 1499, currency: 'INR', status: 'paid', verified: true, serviceName: 'Engine Oil Change', paymentMethod: 'Cash', createdAt: iso(-22), verifiedAt: iso(-21) },
      { invoiceNumber: 'INV-0003', userId: 4, amount: 3499, currency: 'INR', status: 'paid', verified: true, serviceName: 'Brake Pad Replacement', paymentMethod: 'Card', createdAt: iso(-18), verifiedAt: iso(-17) },
      { invoiceNumber: 'INV-0004', userId: 5, amount: 1999, currency: 'INR', status: 'pending', verified: false, serviceName: 'AC Service & Gas Refill', paymentMethod: 'UPI', createdAt: iso(-15) },
      { invoiceNumber: 'INV-0005', userId: 6, amount: 999, currency: 'INR', status: 'pending', verified: false, serviceName: 'Wheel Alignment & Balancing', paymentMethod: 'Cash', createdAt: iso(-10) },
      { invoiceNumber: 'INV-0006', userId: 7, amount: 2499, currency: 'INR', status: 'pending', verified: false, serviceName: 'General Service', paymentMethod: 'Card', createdAt: iso(-5) },
      { invoiceNumber: 'INV-0007', userId: 8, amount: 4999, currency: 'INR', status: 'issued', verified: false, serviceName: 'Battery Replacement', paymentMethod: 'UPI', createdAt: iso(-2) },
      { invoiceNumber: 'INV-0008', userId: 2, amount: 5999, currency: 'INR', status: 'issued', verified: false, serviceName: 'Denting & Painting', paymentMethod: 'Cash', createdAt: iso(0) },
    ];
    await db.collection('billing_records').deleteMany({ invoiceNumber: { $in: billingData.map(b => b.invoiceNumber) } });
    await db.collection('billing_records').insertMany(billingData);
    console.log(`🧾 Billing records seeded: ${billingData.length}`);

    // ─── 8. PAYMENTS ────────────────────────────────────────
    const paymentsData = [
      { paymentId: 'PAY-0001', userId: 2, bookingId: 1, amount: 2499, method: 'upi', status: 'completed', createdAt: iso(-25) },
      { paymentId: 'PAY-0002', userId: 3, bookingId: 2, amount: 1499, method: 'cash', status: 'completed', createdAt: iso(-22) },
      { paymentId: 'PAY-0003', userId: 4, bookingId: 3, amount: 3499, method: 'card', status: 'completed', createdAt: iso(-18) },
      { paymentId: 'PAY-0004', userId: 5, bookingId: 4, amount: 1999, method: 'upi', status: 'initiated', createdAt: iso(-15) },
    ];
    await db.collection('payments').deleteMany({ paymentId: { $in: paymentsData.map(p => p.paymentId) } });
    await db.collection('payments').insertMany(paymentsData);
    console.log(`💳 Payments seeded: ${paymentsData.length}`);

    // ─── 9. BREAKDOWN CALLS ─────────────────────────────────
    const breakdownData = [
      { id: 1, ticketNo: 'BRK-0001', userId: 2, customerName: 'Rajesh Patel', vehicleId: 1, vehicleModel: 'Honda City', vehicleNumber: 'GJ01AB1234', location: 'SG Highway, Ahmedabad', description: 'Engine overheating on highway', phone: '9876543211', status: 'resolved', assignedMechanicId: 1, assignedMechanicName: 'Ramesh Yadav', amount: 1500, latitude: 23.0225, longitude: 72.5714, createdAt: iso(-35) },
      { id: 2, ticketNo: 'BRK-0002', userId: 4, customerName: 'Amit Kumar', vehicleId: 3, vehicleModel: 'Maruti Swift', vehicleNumber: 'GJ03EF9012', location: 'Ring Road, Rajkot', description: 'Flat tyre — spare unavailable', phone: '9876543213', status: 'resolved', assignedMechanicId: 6, assignedMechanicName: 'Ravi Prasad', amount: 800, latitude: 22.3039, longitude: 70.8022, createdAt: iso(-28) },
      { id: 3, ticketNo: 'BRK-0003', userId: 6, customerName: 'Vikram Singh', vehicleId: 5, vehicleModel: 'Toyota Innova', vehicleNumber: 'GJ06IJ7890', location: 'SP Ring Road, Ahmedabad', description: 'Car not starting — battery issue', phone: '9876543215', status: 'assigned', assignedMechanicId: 3, assignedMechanicName: 'Manoj Tiwari', amount: 2000, latitude: 23.0469, longitude: 72.5300, createdAt: iso(-5) },
      { id: 4, ticketNo: 'BRK-0004', userId: 8, customerName: 'Karan Mehta', vehicleId: 7, vehicleModel: 'Mahindra XUV700', vehicleNumber: 'GJ05MN6789', location: 'Dumas Road, Surat', description: 'Strange noise from engine bay', phone: '9876543217', status: 'open', assignedMechanicId: null, assignedMechanicName: null, amount: null, latitude: 21.1702, longitude: 72.8311, createdAt: iso(-1) },
      { id: 5, ticketNo: 'BRK-0005', userId: 11, customerName: 'Neha Reddy', vehicleId: 8, vehicleModel: 'MG Hector', vehicleNumber: 'GJ01OP1234', location: 'CG Road, Ahmedabad', description: 'Radiator leak — coolant warning', phone: '9876543220', status: 'open', assignedMechanicId: null, assignedMechanicName: null, amount: null, latitude: 23.0258, longitude: 72.5620, createdAt: iso(0) },
    ];
    await db.collection('breakdown_calls').deleteMany({ id: { $gte: 1, $lte: 5 } });
    await db.collection('breakdown_calls').insertMany(breakdownData);
    console.log(`🚨 Breakdown calls seeded: ${breakdownData.length}`);

    // ─── 10. REPAIRS ────────────────────────────────────────
    const repairsData = [
      { repairId: 'RP-0001', repairNo: 'RPR-0001', userId: 2, name: 'Rajesh Patel', phone: '9876543211', email: 'rajesh.patel@gmail.com', vehicle: 'Honda City', registration: 'GJ01AB1234', preferredDate: '20/02/2026', preferredTime: '10:00 AM', pickupDrop: true, issue: 'Engine misfiring at idle', status: 'delivered', eta: '2 days', lastUpdate: 'Vehicle delivered to customer', createdAt: iso(-30) },
      { repairId: 'RP-0002', repairNo: 'RPR-0002', userId: 4, name: 'Amit Kumar', phone: '9876543213', email: 'amit.kumar@gmail.com', vehicle: 'Maruti Swift', registration: 'GJ03EF9012', preferredDate: '25/02/2026', preferredTime: '11:00 AM', pickupDrop: false, issue: 'Suspension noise over bumps', status: 'ready', eta: '1 day', lastUpdate: 'Ready for pickup', createdAt: iso(-20) },
      { repairId: 'RP-0003', repairNo: 'RPR-0003', userId: 5, name: 'Sneha Gupta', phone: '9876543214', email: 'sneha.gupta@gmail.com', vehicle: 'Tata Nexon', registration: 'GJ01GH3456', preferredDate: '01/03/2026', preferredTime: '02:00 PM', pickupDrop: true, issue: 'Power steering fluid leak', status: 'in-progress', eta: '3 days', lastUpdate: 'Parts ordered', createdAt: iso(-12) },
      { repairId: 'RP-0004', repairNo: 'RPR-0004', userId: 7, name: 'Anita Desai', phone: '9876543216', email: 'anita.desai@gmail.com', vehicle: 'Kia Seltos', registration: 'GJ01KL2345', preferredDate: '05/03/2026', preferredTime: '09:30 AM', pickupDrop: false, issue: 'Check engine light on', status: 'diagnosis', eta: null, lastUpdate: 'Diagnostic scan scheduled', createdAt: iso(-5) },
      { repairId: 'RP-0005', repairNo: 'RPR-0005', userId: 12, name: 'Suresh Nair', phone: '9876543221', email: 'suresh.nair@gmail.com', vehicle: 'Skoda Slavia', registration: 'GJ03QR5678', preferredDate: '10/03/2026', preferredTime: '10:00 AM', pickupDrop: true, issue: 'Clutch plate worn out', status: 'received', eta: null, lastUpdate: 'Request received', createdAt: iso(-1) },
      { repairId: 'RP-0006', repairNo: 'RPR-0006', userId: 8, name: 'Karan Mehta', phone: '9876543217', email: 'karan.mehta@gmail.com', vehicle: 'Mahindra XUV700', registration: 'GJ05MN6789', preferredDate: '12/03/2026', preferredTime: '03:00 PM', pickupDrop: false, issue: 'Windshield crack replacement', status: 'pending', eta: null, lastUpdate: 'Request received', createdAt: iso(0) },
    ];
    await db.collection('repairs').deleteMany({ repairId: { $in: repairsData.map(r => r.repairId) } });
    await db.collection('repairs').insertMany(repairsData);
    console.log(`🔩 Repairs seeded: ${repairsData.length}`);

    // ─── 11. MODIFICATIONS ──────────────────────────────────
    const modificationsData = [
      { id: 1, modCode: 'MOD-001', customer: 'Rajesh Patel', vehicle: 'Honda City', modType: 'Alloy Wheels', description: '16-inch alloy wheel upgrade', estimatedCost: '₹18,000', duration: '3 hrs', phone: '9876543211', assignedTo: 'Ajay Pandey', status: 'Completed', progress: 100, createdAt: iso(-40) },
      { id: 2, modCode: 'MOD-002', customer: 'Vikram Singh', vehicle: 'Toyota Innova', modType: 'LED Headlights', description: 'Projector LED headlight conversion', estimatedCost: '₹12,000', duration: '2 hrs', phone: '9876543215', assignedTo: 'Manoj Tiwari', status: 'In Progress', progress: 60, createdAt: iso(-15) },
      { id: 3, modCode: 'MOD-003', customer: 'Karan Mehta', vehicle: 'Mahindra XUV700', modType: 'Roof Rack', description: 'Heavy-duty aluminium roof rack', estimatedCost: '₹8,500', duration: '1.5 hrs', phone: '9876543217', assignedTo: 'Ajay Pandey', status: 'Pending', progress: 0, createdAt: iso(-8) },
      { id: 4, modCode: 'MOD-004', customer: 'Neha Reddy', vehicle: 'MG Hector', modType: 'Dashcam Installation', description: 'Dual-channel dashcam with GPS', estimatedCost: '₹6,000', duration: '1 hr', phone: '9876543220', assignedTo: 'Manoj Tiwari', status: 'Pending', progress: 0, createdAt: iso(-3) },
      { id: 5, modCode: 'MOD-005', customer: 'Priya Sharma', vehicle: 'Hyundai i20', modType: 'Wrap & Tint', description: 'Full body vinyl wrap (matte black) + window tint', estimatedCost: '₹35,000', duration: '2 days', phone: '9876543212', assignedTo: 'Ajay Pandey', status: 'In Progress', progress: 30, createdAt: iso(-10) },
      { id: 6, modCode: 'MOD-006', customer: 'Amit Kumar', vehicle: 'Maruti Swift', modType: 'Exhaust Upgrade', description: 'Performance exhaust with resonator delete', estimatedCost: '₹15,000', duration: '4 hrs', phone: '9876543213', assignedTo: 'Ramesh Yadav', status: 'Completed', progress: 100, createdAt: iso(-25) },
    ];
    await db.collection('modifications').deleteMany({ id: { $gte: 1, $lte: 6 } });
    await db.collection('modifications').insertMany(modificationsData);
    console.log(`🔧 Modifications seeded: ${modificationsData.length}`);

    // ─── 12. CONTACT SUBMISSIONS ────────────────────────────
    const contactsData = [
      { name: 'Rajesh Patel', email: 'rajesh.patel@gmail.com', phone: '9876543211', service: 'General Service', message: 'I want to know the cost of 30,000 km service for Honda City.', status: 'replied', createdAt: iso(-45) },
      { name: 'Sneha Gupta', email: 'sneha.gupta@gmail.com', phone: '9876543214', service: 'AC Service', message: 'My car AC is blowing warm air. Can I get a quote for repair?', status: 'replied', createdAt: iso(-30) },
      { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '9876543215', service: 'Body Work', message: 'Need dent repair quotation for Toyota Innova — minor fender dent.', status: 'new', createdAt: iso(-10) },
      { name: 'Neha Reddy', email: 'neha.reddy@gmail.com', phone: '9876543220', service: 'Modification', message: 'Do you install aftermarket audio systems? Looking for 7-inch touchscreen.', status: 'new', createdAt: iso(-5) },
      { name: 'Suresh Nair', email: 'suresh.nair@gmail.com', phone: '9876543221', service: 'Breakdown Assist', message: 'What is the response time for roadside breakdown assistance in Surat?', status: 'new', createdAt: iso(-2) },
      { name: 'Manish Verma', email: 'manish.verma@gmail.com', phone: '9876543219', service: 'General Inquiry', message: 'Are you open on Sundays? What are your working hours?', status: 'replied', createdAt: iso(-20) },
    ];
    await db.collection('contact_submissions').deleteMany({ email: { $in: contactsData.map(c => c.email) } });
    await db.collection('contact_submissions').insertMany(contactsData);
    console.log(`📬 Contact submissions seeded: ${contactsData.length}`);

    // ─── 13. NOTIFICATIONS ──────────────────────────────────
    const notificationsData = [
      { id: 1, userId: 2, title: 'Booking Confirmed', message: 'Your booking BK-0001 for General Service has been confirmed.', type: 'booking', read: true, createdAt: iso(-30) },
      { id: 2, userId: 2, title: 'Service Completed', message: 'Your General Service has been completed. Please collect your vehicle.', type: 'service', read: true, createdAt: iso(-25) },
      { id: 3, userId: 3, title: 'Booking Confirmed', message: 'Your booking BK-0002 for Engine Oil Change has been confirmed.', type: 'booking', read: true, createdAt: iso(-27) },
      { id: 4, userId: 4, title: 'Payment Received', message: 'Payment of ₹3,499 for Brake Pad Replacement has been received.', type: 'billing', read: true, createdAt: iso(-18) },
      { id: 5, userId: 5, title: 'Booking Confirmed', message: 'Your booking BK-0004 for AC Service has been confirmed.', type: 'booking', read: false, createdAt: iso(-20) },
      { id: 6, userId: 6, title: 'Breakdown Assigned', message: 'Mechanic Manoj Tiwari has been assigned for your breakdown call.', type: 'service', read: false, createdAt: iso(-5) },
      { id: 7, userId: 7, title: 'Booking Reminder', message: 'Reminder: Your General Service is scheduled for tomorrow at 11:00 AM.', type: 'booking', read: false, createdAt: iso(-6) },
      { id: 8, userId: 8, title: 'New Offer', message: '20% off on Car Wash & Detailing this weekend! Book now.', type: 'marketing', read: false, createdAt: iso(-3) },
      { id: 9, userId: 1, title: 'Low Stock Alert', message: 'Brake Pads stock is below minimum level. Please reorder.', type: 'system', read: false, createdAt: iso(-2) },
      { id: 10, userId: 1, title: 'New Breakdown Call', message: 'New breakdown call received from Karan Mehta — Dumas Road, Surat.', type: 'system', read: false, createdAt: iso(-1) },
      { id: 11, userId: 11, title: 'Welcome to AutoX', message: 'Welcome! Your account has been created successfully.', type: 'system', read: true, createdAt: iso(-15) },
      { id: 12, userId: 12, title: 'Repair Request Received', message: 'Your repair request RP-0005 has been received. We will contact you shortly.', type: 'service', read: false, createdAt: iso(-1) },
    ];
    await db.collection('notifications').deleteMany({ id: { $gte: 1, $lte: 12 } });
    await db.collection('notifications').insertMany(notificationsData);
    console.log(`🔔 Notifications seeded: ${notificationsData.length}`);

    // ─── 14. PACKAGES ───────────────────────────────────────
    const packagesData = [
      { packageId: 'PKG-0001', packageCode: 'PKG-SLV-001', userId: 2, name: 'Silver Care', price: '₹4,999/yr', validity: '1 Year', totalServices: 6, servicesUsed: 2, nextDue: '15/08/2026', status: 'Active', subscribedAt: iso(-60), createdAt: iso(-60) },
      { packageId: 'PKG-0002', packageCode: 'PKG-GLD-002', userId: 3, name: 'Gold Care', price: '₹8,999/yr', validity: '1 Year', totalServices: 12, servicesUsed: 3, nextDue: '10/07/2026', status: 'Active', subscribedAt: iso(-75), createdAt: iso(-75) },
      { packageId: 'PKG-0003', packageCode: 'PKG-SLV-003', userId: 5, name: 'Silver Care', price: '₹4,999/yr', validity: '1 Year', totalServices: 6, servicesUsed: 1, nextDue: '20/09/2026', status: 'Active', subscribedAt: iso(-45), createdAt: iso(-45) },
      { packageId: 'PKG-0004', packageCode: 'PKG-PLT-004', userId: 6, name: 'Platinum Care', price: '₹14,999/yr', validity: '1 Year', totalServices: 24, servicesUsed: 5, nextDue: '01/06/2026', status: 'Active', subscribedAt: iso(-40), createdAt: iso(-40) },
      { packageId: 'PKG-0005', packageCode: 'PKG-GLD-005', userId: 10, name: 'Gold Care', price: '₹8,999/yr', validity: '1 Year', totalServices: 12, servicesUsed: 12, nextDue: '—', status: 'Expired', subscribedAt: iso(-400), createdAt: iso(-400) },
    ];
    await db.collection('packages').deleteMany({ packageId: { $in: packagesData.map(p => p.packageId) } });
    await db.collection('packages').insertMany(packagesData);
    console.log(`📦 Packages seeded: ${packagesData.length}`);

    // ─── 15. INVENTORY ──────────────────────────────────────
    const inventoryData = [
      { id: 1, sku: 'INV-OIL-001', name: 'Engine Oil 5W-30 (4L)', category: 'Lubricants', purchasePrice: 1200, sellingPrice: 1499, price: 1499, stock: 25, minStock: 10, supplier: 'Castrol India', description: 'Fully synthetic engine oil', active: true, createdAt: iso(-60) },
      { id: 2, sku: 'INV-BRK-002', name: 'Brake Pads (Front Pair)', category: 'Brakes', purchasePrice: 800, sellingPrice: 1200, price: 1200, stock: 8, minStock: 10, supplier: 'Bosch Auto Parts', description: 'Ceramic brake pads', active: true, createdAt: iso(-60) },
      { id: 3, sku: 'INV-FLT-003', name: 'Air Filter', category: 'Filters', purchasePrice: 250, sellingPrice: 450, price: 450, stock: 30, minStock: 15, supplier: 'Mann Filter', description: 'High-flow air filter', active: true, createdAt: iso(-55) },
      { id: 4, sku: 'INV-FLT-004', name: 'Cabin Filter', category: 'Filters', purchasePrice: 300, sellingPrice: 550, price: 550, stock: 20, minStock: 10, supplier: 'Mann Filter', description: 'Anti-bacterial cabin filter', active: true, createdAt: iso(-55) },
      { id: 5, sku: 'INV-IGN-005', name: 'Spark Plug (Set of 4)', category: 'Ignition', purchasePrice: 600, sellingPrice: 999, price: 999, stock: 15, minStock: 8, supplier: 'NGK India', description: 'Iridium spark plugs', active: true, createdAt: iso(-50) },
      { id: 6, sku: 'INV-FLD-006', name: 'Coolant (1L)', category: 'Fluids', purchasePrice: 180, sellingPrice: 350, price: 350, stock: 40, minStock: 15, supplier: 'Motul', description: 'Pre-mixed coolant', active: true, createdAt: iso(-50) },
      { id: 7, sku: 'INV-ACC-007', name: 'Wiper Blades (Pair)', category: 'Accessories', purchasePrice: 200, sellingPrice: 399, price: 399, stock: 18, minStock: 10, supplier: 'Bosch Auto Parts', description: 'Frameless wiper blades', active: true, createdAt: iso(-45) },
      { id: 8, sku: 'INV-ELC-008', name: 'Battery 12V 65Ah', category: 'Electrical', purchasePrice: 3500, sellingPrice: 4999, price: 4999, stock: 5, minStock: 5, supplier: 'Amaron', description: 'Maintenance-free battery', active: true, createdAt: iso(-40) },
      { id: 9, sku: 'INV-TRN-009', name: 'Clutch Plate Kit', category: 'Transmission', purchasePrice: 4000, sellingPrice: 5999, price: 5999, stock: 3, minStock: 3, supplier: 'Valeo India', description: 'Complete clutch kit', active: true, createdAt: iso(-35) },
      { id: 10, sku: 'INV-ELC-010', name: 'Headlight Bulb H4', category: 'Electrical', purchasePrice: 150, sellingPrice: 299, price: 299, stock: 0, minStock: 10, supplier: 'Osram', description: 'Halogen headlight bulb', active: true, createdAt: iso(-30) },
      { id: 11, sku: 'INV-AC-011', name: 'AC Refrigerant R134a', category: 'AC Parts', purchasePrice: 500, sellingPrice: 850, price: 850, stock: 12, minStock: 5, supplier: 'Honeywell', description: 'AC gas canister 500g', active: true, createdAt: iso(-25) },
      { id: 12, sku: 'INV-FLD-012', name: 'Brake Fluid DOT4 (500ml)', category: 'Fluids', purchasePrice: 200, sellingPrice: 380, price: 380, stock: 22, minStock: 10, supplier: 'Motul', description: 'High-performance brake fluid', active: true, createdAt: iso(-20) },
    ];
    await db.collection('inventory').deleteMany({ id: { $gte: 1, $lte: 12 } });
    await db.collection('inventory').insertMany(inventoryData);
    console.log(`📦 Inventory seeded: ${inventoryData.length}`);

    // ─── 16. STOCK HISTORY ──────────────────────────────────
    const stockHistoryData = [
      { id: 1, partId: 1, partName: 'Engine Oil 5W-30 (4L)', action: 'Added', quantityChange: 30, stockAfter: 30, note: 'Initial stock', createdAt: iso(-60) },
      { id: 2, partId: 1, partName: 'Engine Oil 5W-30 (4L)', action: 'Used in Service', quantityChange: -2, stockAfter: 28, note: 'Used for Rajesh Patel — General Service', serviceId: 1, customerName: 'Rajesh Patel', createdAt: iso(-25) },
      { id: 3, partId: 1, partName: 'Engine Oil 5W-30 (4L)', action: 'Used in Service', quantityChange: -1, stockAfter: 27, note: 'Used for Priya Sharma — Oil Change', serviceId: 2, customerName: 'Priya Sharma', createdAt: iso(-22) },
      { id: 4, partId: 1, partName: 'Engine Oil 5W-30 (4L)', action: 'Used in Service', quantityChange: -2, stockAfter: 25, note: 'Used for Anita Desai — General Service', serviceId: 1, customerName: 'Anita Desai', createdAt: iso(-10) },
      { id: 5, partId: 2, partName: 'Brake Pads (Front Pair)', action: 'Added', quantityChange: 15, stockAfter: 15, note: 'Initial stock', createdAt: iso(-60) },
      { id: 6, partId: 2, partName: 'Brake Pads (Front Pair)', action: 'Used in Service', quantityChange: -1, stockAfter: 14, note: 'Used for Amit Kumar — Brake Pad Replacement', serviceId: 3, customerName: 'Amit Kumar', createdAt: iso(-18) },
      { id: 7, partId: 2, partName: 'Brake Pads (Front Pair)', action: 'Adjusted', quantityChange: -6, stockAfter: 8, note: 'Stock count correction after audit', createdAt: iso(-5) },
      { id: 8, partId: 8, partName: 'Battery 12V 65Ah', action: 'Added', quantityChange: 8, stockAfter: 8, note: 'New batch received', createdAt: iso(-40) },
      { id: 9, partId: 8, partName: 'Battery 12V 65Ah', action: 'Used in Service', quantityChange: -3, stockAfter: 5, note: 'Breakdown calls — battery replacements', createdAt: iso(-10) },
      { id: 10, partId: 10, partName: 'Headlight Bulb H4', action: 'Added', quantityChange: 20, stockAfter: 20, note: 'Initial stock', createdAt: iso(-30) },
      { id: 11, partId: 10, partName: 'Headlight Bulb H4', action: 'Used in Service', quantityChange: -20, stockAfter: 0, note: 'High demand — all used', createdAt: iso(-5) },
      { id: 12, partId: 11, partName: 'AC Refrigerant R134a', action: 'Added', quantityChange: 15, stockAfter: 15, note: 'New stock', createdAt: iso(-25) },
      { id: 13, partId: 11, partName: 'AC Refrigerant R134a', action: 'Used in Service', quantityChange: -3, stockAfter: 12, note: 'Used for AC services', createdAt: iso(-14) },
    ];
    await db.collection('stock_history').deleteMany({ id: { $gte: 1, $lte: 13 } });
    await db.collection('stock_history').insertMany(stockHistoryData);
    console.log(`📊 Stock history seeded: ${stockHistoryData.length}`);

    // ─── 17. SETTINGS ───────────────────────────────────────
    const settingsDoc = {
      key: 'system',
      businessName: 'AutoX Garage Services',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      workingHours: { start: '09:00', end: '19:00' },
      notifications: { emailNotifications: true, smsNotifications: true, pushNotifications: false },
      bookingSettings: { bookingBuffer: 30, maxBookingsPerDay: 20, cancellationPolicy: '24 hours before scheduled time', bookingConfirmation: true },
      updatedAt: iso(0),
    };
    await db.collection('settings').updateOne({ key: 'system' }, { $set: settingsDoc }, { upsert: true });

    const companyDoc = {
      key: 'company_info',
      name: 'AutoX Garage Services',
      email: 'info@autoxgarage.com',
      phone: '9876500000',
      website: 'https://autoxgarage.com',
      description: 'Premium car service & repair center in Ahmedabad',
      gstNo: '24ABCDE1234F1Z5',
      legalName: 'AutoX Automobile Services Pvt Ltd',
      updatedAt: iso(0),
    };
    await db.collection('settings').updateOne({ key: 'company_info' }, { $set: companyDoc }, { upsert: true });
    console.log(`⚙️  Settings seeded`);

    // ─── 18. REVIEWS (for analytics) ────────────────────────
    const reviewsData = [
      { userId: 2, bookingId: 1, rating: 5, comment: 'Excellent service, very thorough!', createdAt: iso(-24) },
      { userId: 3, bookingId: 2, rating: 4, comment: 'Quick oil change. Good work.', createdAt: iso(-21) },
      { userId: 4, bookingId: 3, rating: 5, comment: 'Brake pads replaced perfectly. No noise now.', createdAt: iso(-16) },
      { userId: 6, bookingId: 5, rating: 4, comment: 'Good alignment work', createdAt: iso(-8) },
      { userId: 7, bookingId: 6, rating: 3, comment: 'Service was fine but took longer than expected.', createdAt: iso(-3) },
    ];
    await db.collection('reviews').deleteMany({ bookingId: { $in: reviewsData.map(r => r.bookingId) } });
    await db.collection('reviews').insertMany(reviewsData);
    console.log(`⭐ Reviews seeded: ${reviewsData.length}`);

    console.log('\n🎉 All collections seeded successfully!');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

run();
