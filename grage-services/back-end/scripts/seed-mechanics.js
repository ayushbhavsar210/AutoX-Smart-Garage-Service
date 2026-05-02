require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });
const { MongoClient } = require('mongodb');

const sourceMechanics = [
  { mechanicName: 'Ramesh Patel', phoneNo: '9876543210', expertise: 'Engine Repair', experience: '8 years', rating: 4.7, status: 'available' },
  { mechanicName: 'Suresh Yadav', phoneNo: '9865231470', expertise: 'Brake Service', experience: '6 years', rating: 4.5, status: 'busy' },
  { mechanicName: 'Mahesh Kumar', phoneNo: '9898123456', expertise: 'Oil Change', experience: '4 years', rating: 4.3, status: 'available' },
  { mechanicName: 'Jignesh Shah', phoneNo: '9825012345', expertise: 'Battery Replacement', experience: '5 years', rating: 4.6, status: 'off' },
  { mechanicName: 'Vikram Singh', phoneNo: '9812345678', expertise: 'Wheel Alignment', experience: '7 years', rating: 4.8, status: 'busy' },
  { mechanicName: 'Amit Chauhan', phoneNo: '9909123456', expertise: 'Suspension Repair', experience: '9 years', rating: 4.9, status: 'available' },
  { mechanicName: 'Ketan Desai', phoneNo: '9978123456', expertise: 'Clutch Repair', experience: '5 years', rating: 4.4, status: 'busy' },
  { mechanicName: 'Nilesh Parmar', phoneNo: '9925234567', expertise: 'AC Service', experience: '6 years', rating: 4.5, status: 'available' },
  { mechanicName: 'Rajesh Verma', phoneNo: '9811122233', expertise: 'Transmission Repair', experience: '10 years', rating: 4.8, status: 'off' },
  { mechanicName: 'Deepak Sharma', phoneNo: '9898989898', expertise: 'General Service', experience: '3 years', rating: 4.2, status: 'available' },
  { mechanicName: 'Manoj Solanki', phoneNo: '9870011223', expertise: 'Engine Diagnostics', experience: '7 years', rating: 4.6, status: 'busy' },
  { mechanicName: 'Prakash Joshi', phoneNo: '9911223344', expertise: 'Tyre Replacement', experience: '4 years', rating: 4.3, status: 'available' },
  { mechanicName: 'Harshad Patel', phoneNo: '9822334455', expertise: 'Electrical Repair', experience: '8 years', rating: 4.7, status: 'busy' },
  { mechanicName: 'Anil Mehta', phoneNo: '9900112233', expertise: 'Cooling System Repair', experience: '6 years', rating: 4.4, status: 'off' },
  { mechanicName: 'Mukesh Rana', phoneNo: '9988776655', expertise: 'Fuel System Repair', experience: '5 years', rating: 4.5, status: 'available' },
  { mechanicName: 'Bhavesh Prajapati', phoneNo: '9872233445', expertise: 'Engine Overhaul', experience: '11 years', rating: 4.9, status: 'busy' },
  { mechanicName: 'Kishan Thakur', phoneNo: '9819988776', expertise: 'Brake Oil Service', experience: '3 years', rating: 4.1, status: 'available' },
  { mechanicName: 'Yogesh Patel', phoneNo: '9922113344', expertise: 'Steering Repair', experience: '7 years', rating: 4.6, status: 'busy' },
  { mechanicName: 'Sanjay Kumar', phoneNo: '9877766554', expertise: 'Gearbox Repair', experience: '9 years', rating: 4.8, status: 'off' },
  { mechanicName: 'Tushar Shah', phoneNo: '9812233445', expertise: 'Radiator Service', experience: '5 years', rating: 4.4, status: 'available' },
  { mechanicName: 'Rahul Mishra', phoneNo: '9988001122', expertise: 'Car Washing', experience: '2 years', rating: 4.0, status: 'available' },
  { mechanicName: 'Devang Patel', phoneNo: '9876655443', expertise: 'Sensor Repair', experience: '6 years', rating: 4.5, status: 'busy' },
  { mechanicName: 'Ajay Solanki', phoneNo: '9811100223', expertise: 'Headlight Repair', experience: '4 years', rating: 4.3, status: 'available' },
  { mechanicName: 'Hemant Chauhan', phoneNo: '9900223344', expertise: 'Dent Inspection', experience: '8 years', rating: 4.7, status: 'off' },
  { mechanicName: 'Dhaval Patel', phoneNo: '9822998877', expertise: 'Full Car Inspection', experience: '10 years', rating: 4.9, status: 'busy' },
];

const toTitleStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'busy') return 'Busy';
  if (normalized === 'off') return 'Off';
  return 'Available';
};

const toYears = (value) => {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const toExpertiseArray = (value) => {
  return String(value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

const formatMechanicCode = (id) => `MEC-${String(id).padStart(3, '0')}`;

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in back-end/.env');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(process.env.MONGODB_DB_NAME || undefined);
    const mechanics = db.collection('mechanics');

    const [maxIdDoc] = await mechanics
      .find({ id: { $type: 'number' } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    let nextId = (maxIdDoc?.id || 0) + 1;
    let created = 0;
    let updated = 0;

    for (const item of sourceMechanics) {
      const phone = String(item.phoneNo || '').trim();
      const name = String(item.mechanicName || '').trim();
      if (!phone || !name) continue;

      const existing = await mechanics.findOne({ phone });
      const now = new Date().toISOString();
      const status = toTitleStatus(item.status);
      const yearsExperience = toYears(item.experience);
      const payload = {
        name,
        fullName: name,
        phone,
        expertise: toExpertiseArray(item.expertise),
        experience: String(item.experience || '').trim(),
        yearsExperience,
        rating: Number(item.rating || 0),
        status,
        availability: status === 'Available',
        assignedJobs: existing?.assignedJobs || 0,
        updatedAt: now,
      };

      if (existing) {
        await mechanics.updateOne({ _id: existing._id }, { $set: payload });
        updated += 1;
      } else {
        const id = nextId;
        nextId += 1;
        await mechanics.insertOne({
          ...payload,
          id,
          mechanicCode: formatMechanicCode(id),
          createdAt: now,
        });
        created += 1;
      }
    }

    const total = await mechanics.countDocuments();
    console.log(`Mechanics seed complete. Created: ${created}, Updated: ${updated}, Total: ${total}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Mechanics seed failed:', error.message);
  process.exitCode = 1;
});
