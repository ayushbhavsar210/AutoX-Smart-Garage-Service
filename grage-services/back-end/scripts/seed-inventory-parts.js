require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });
const { MongoClient } = require('mongodb');

const sourceParts = [
  { partName: 'Engine Oil Filter', category: 'Engine', purchasePrice: 180, sellingPrice: 300, stockQuantity: 25, minStock: 5, supplier: 'Bosch India', description: 'High quality engine oil filter' },
  { partName: 'Spark Plug', category: 'Engine', purchasePrice: 120, sellingPrice: 220, stockQuantity: 40, minStock: 10, supplier: 'NGK India', description: 'Standard spark plug for petrol vehicles' },
  { partName: 'Timing Belt', category: 'Engine', purchasePrice: 850, sellingPrice: 1200, stockQuantity: 15, minStock: 4, supplier: 'Gates India', description: 'Engine timing belt' },
  { partName: 'Engine Mount', category: 'Engine', purchasePrice: 900, sellingPrice: 1400, stockQuantity: 10, minStock: 3, supplier: 'SKF India', description: 'Engine mounting support' },
  { partName: 'Piston Ring Set', category: 'Engine', purchasePrice: 1200, sellingPrice: 1800, stockQuantity: 8, minStock: 2, supplier: 'Mahle India', description: 'Engine piston ring set' },

  { partName: 'Brake Pad Set', category: 'Brake', purchasePrice: 850, sellingPrice: 1200, stockQuantity: 20, minStock: 5, supplier: 'TVS Brake Systems', description: 'Front brake pad set' },
  { partName: 'Brake Disc', category: 'Brake', purchasePrice: 1500, sellingPrice: 2200, stockQuantity: 12, minStock: 3, supplier: 'Bosch India', description: 'Front brake disc' },
  { partName: 'Brake Shoe', category: 'Brake', purchasePrice: 600, sellingPrice: 950, stockQuantity: 18, minStock: 5, supplier: 'Rane India', description: 'Rear brake shoe set' },
  { partName: 'Brake Caliper', category: 'Brake', purchasePrice: 2200, sellingPrice: 3000, stockQuantity: 6, minStock: 2, supplier: 'Bosch India', description: 'Brake caliper assembly' },
  { partName: 'Brake Booster', category: 'Brake', purchasePrice: 3500, sellingPrice: 4500, stockQuantity: 5, minStock: 1, supplier: 'Lucas India', description: 'Brake booster unit' },

  { partName: 'Headlight Bulb', category: 'Electrical', purchasePrice: 90, sellingPrice: 180, stockQuantity: 50, minStock: 10, supplier: 'Philips India', description: 'Halogen headlight bulb' },
  { partName: 'Car Horn', category: 'Electrical', purchasePrice: 350, sellingPrice: 550, stockQuantity: 20, minStock: 5, supplier: 'Bosch India', description: 'Dual tone horn' },
  { partName: 'Starter Motor', category: 'Electrical', purchasePrice: 4200, sellingPrice: 5500, stockQuantity: 5, minStock: 1, supplier: 'Lucas India', description: 'Starter motor assembly' },
  { partName: 'Alternator', category: 'Electrical', purchasePrice: 4800, sellingPrice: 6200, stockQuantity: 4, minStock: 1, supplier: 'Bosch India', description: 'Car alternator' },
  { partName: 'Ignition Coil', category: 'Electrical', purchasePrice: 1200, sellingPrice: 1800, stockQuantity: 12, minStock: 3, supplier: 'Denso India', description: 'Ignition coil unit' },

  { partName: 'Engine Oil 5W30', category: 'Oil & Fluids', purchasePrice: 650, sellingPrice: 850, stockQuantity: 60, minStock: 15, supplier: 'Castrol India', description: 'Synthetic engine oil' },
  { partName: 'Brake Fluid', category: 'Oil & Fluids', purchasePrice: 180, sellingPrice: 300, stockQuantity: 40, minStock: 10, supplier: 'Shell India', description: 'Brake hydraulic fluid' },
  { partName: 'Coolant', category: 'Cooling', purchasePrice: 200, sellingPrice: 350, stockQuantity: 35, minStock: 8, supplier: 'Prestone India', description: 'Engine coolant liquid' },
  { partName: 'Gear Oil', category: 'Oil & Fluids', purchasePrice: 350, sellingPrice: 500, stockQuantity: 25, minStock: 5, supplier: 'Castrol India', description: 'Transmission gear oil' },
  { partName: 'Power Steering Oil', category: 'Oil & Fluids', purchasePrice: 300, sellingPrice: 450, stockQuantity: 20, minStock: 5, supplier: 'Shell India', description: 'Power steering fluid' },

  { partName: 'Air Filter', category: 'Filters', purchasePrice: 250, sellingPrice: 450, stockQuantity: 30, minStock: 8, supplier: 'Mann Filter', description: 'Engine air filter' },
  { partName: 'Cabin Filter', category: 'Filters', purchasePrice: 220, sellingPrice: 400, stockQuantity: 25, minStock: 6, supplier: 'Bosch India', description: 'Cabin AC filter' },
  { partName: 'Fuel Filter', category: 'Filters', purchasePrice: 300, sellingPrice: 500, stockQuantity: 20, minStock: 5, supplier: 'Bosch India', description: 'Fuel filtration unit' },
  { partName: 'Oil Filter Premium', category: 'Filters', purchasePrice: 350, sellingPrice: 600, stockQuantity: 15, minStock: 4, supplier: 'Mann Filter', description: 'Premium oil filter' },
  { partName: 'Hydraulic Filter', category: 'Filters', purchasePrice: 420, sellingPrice: 650, stockQuantity: 10, minStock: 3, supplier: 'Fleetguard', description: 'Hydraulic oil filter' },

  { partName: 'Shock Absorber', category: 'Suspension', purchasePrice: 2200, sellingPrice: 3000, stockQuantity: 10, minStock: 3, supplier: 'Monroe India', description: 'Rear shock absorber' },
  { partName: 'Control Arm', category: 'Suspension', purchasePrice: 1800, sellingPrice: 2600, stockQuantity: 8, minStock: 2, supplier: 'SKF India', description: 'Front suspension control arm' },
  { partName: 'Ball Joint', category: 'Suspension', purchasePrice: 400, sellingPrice: 650, stockQuantity: 20, minStock: 5, supplier: 'Rane India', description: 'Suspension ball joint' },
  { partName: 'Stabilizer Link', category: 'Suspension', purchasePrice: 350, sellingPrice: 600, stockQuantity: 18, minStock: 5, supplier: 'Rane India', description: 'Stabilizer link rod' },
  { partName: 'Coil Spring', category: 'Suspension', purchasePrice: 1500, sellingPrice: 2100, stockQuantity: 12, minStock: 3, supplier: 'Jamna India', description: 'Suspension coil spring' },

  { partName: 'Clutch Plate', category: 'Transmission', purchasePrice: 1800, sellingPrice: 2600, stockQuantity: 10, minStock: 3, supplier: 'Valeo India', description: 'Clutch friction plate' },
  { partName: 'Clutch Pressure Plate', category: 'Transmission', purchasePrice: 2200, sellingPrice: 3200, stockQuantity: 8, minStock: 2, supplier: 'Valeo India', description: 'Clutch pressure plate' },
  { partName: 'Gearbox Mount', category: 'Transmission', purchasePrice: 950, sellingPrice: 1400, stockQuantity: 10, minStock: 3, supplier: 'SKF India', description: 'Gearbox mounting' },
  { partName: 'Drive Shaft', category: 'Transmission', purchasePrice: 3500, sellingPrice: 4500, stockQuantity: 6, minStock: 2, supplier: 'GKN India', description: 'Drive shaft assembly' },
  { partName: 'CV Joint', category: 'Transmission', purchasePrice: 1600, sellingPrice: 2400, stockQuantity: 8, minStock: 2, supplier: 'SKF India', description: 'Constant velocity joint' },

  { partName: 'Silencer', category: 'Exhaust', purchasePrice: 2200, sellingPrice: 3000, stockQuantity: 7, minStock: 2, supplier: 'Tenneco India', description: 'Car exhaust silencer' },
  { partName: 'Catalytic Converter', category: 'Exhaust', purchasePrice: 5200, sellingPrice: 7000, stockQuantity: 4, minStock: 1, supplier: 'Bosal India', description: 'Emission catalytic converter' },
  { partName: 'Exhaust Pipe', category: 'Exhaust', purchasePrice: 1200, sellingPrice: 1800, stockQuantity: 9, minStock: 2, supplier: 'Tenneco India', description: 'Exhaust pipe assembly' },

  { partName: 'Radiator', category: 'Cooling', purchasePrice: 3500, sellingPrice: 4500, stockQuantity: 6, minStock: 2, supplier: 'Subros India', description: 'Engine radiator' },
  { partName: 'Radiator Fan', category: 'Cooling', purchasePrice: 1500, sellingPrice: 2200, stockQuantity: 10, minStock: 3, supplier: 'Subros India', description: 'Radiator cooling fan' },
  { partName: 'Thermostat Valve', category: 'Cooling', purchasePrice: 450, sellingPrice: 700, stockQuantity: 18, minStock: 5, supplier: 'Mahle India', description: 'Engine thermostat valve' },

  { partName: 'Car Tyre 14 inch', category: 'Tyres', purchasePrice: 3200, sellingPrice: 4000, stockQuantity: 20, minStock: 5, supplier: 'MRF India', description: 'Radial tubeless tyre' },
  { partName: 'Car Tyre 15 inch', category: 'Tyres', purchasePrice: 3600, sellingPrice: 4500, stockQuantity: 16, minStock: 4, supplier: 'Apollo Tyres', description: 'Tubeless radial tyre' },
  { partName: 'Wheel Rim', category: 'Tyres', purchasePrice: 2500, sellingPrice: 3200, stockQuantity: 12, minStock: 3, supplier: 'Steelbird India', description: 'Alloy wheel rim' },
  { partName: 'Wheel Bearing', category: 'Tyres', purchasePrice: 650, sellingPrice: 950, stockQuantity: 25, minStock: 6, supplier: 'SKF India', description: 'Wheel bearing unit' },

  { partName: 'Car Battery 12V', category: 'Battery', purchasePrice: 4200, sellingPrice: 5000, stockQuantity: 14, minStock: 3, supplier: 'Amaron India', description: 'Maintenance free battery' },
  { partName: 'Heavy Duty Battery', category: 'Battery', purchasePrice: 5200, sellingPrice: 6500, stockQuantity: 10, minStock: 2, supplier: 'Exide India', description: 'High capacity battery' },
  { partName: 'Battery Terminal', category: 'Battery', purchasePrice: 120, sellingPrice: 250, stockQuantity: 40, minStock: 10, supplier: 'Bosch India', description: 'Battery connector terminal' },
];

const prefixMap = {
  Engine: 'ENG',
  Brake: 'BRK',
  Electrical: 'ELE',
  'Oil & Fluids': 'OIL',
  Cooling: 'CLG',
  Filters: 'FLT',
  Suspension: 'SUS',
  Transmission: 'TRN',
  Exhaust: 'EXH',
  Tyres: 'TYR',
  Battery: 'BAT',
};

const counters = new Map();
const buildSku = (category) => {
  const prefix = prefixMap[category] || 'PRT';
  const current = (counters.get(prefix) || 0) + 1;
  counters.set(prefix, current);
  return `INV-${prefix}-${String(current).padStart(3, '0')}`;
};

const mapPartToDoc = (part, index, nextId) => {
  const sku = buildSku(part.category);
  const sellingPrice = Number(part.sellingPrice || 0);
  const purchasePrice = Number(part.purchasePrice || 0);
  const stock = Number(part.stockQuantity || 0);
  const minStock = Number(part.minStock || 5);

  return {
    sku,
    id: nextId + index,
    name: String(part.partName || '').trim(),
    category: String(part.category || '').trim(),
    purchasePrice,
    sellingPrice,
    price: sellingPrice,
    stock,
    minStock,
    supplier: String(part.supplier || '').trim(),
    description: String(part.description || '').trim(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in back-end/.env');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(process.env.MONGODB_DB_NAME || undefined);
    const inventory = db.collection('inventory');

    const maxDoc = await inventory.find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
    const nextId = (maxDoc[0]?.id || 0) + 1;
    const now = new Date().toISOString();

    const ops = sourceParts.map((part, index) => {
      const doc = mapPartToDoc(part, index, nextId);
      return {
        updateOne: {
          filter: { sku: doc.sku },
          update: {
            $set: {
              name: doc.name,
              category: doc.category,
              purchasePrice: doc.purchasePrice,
              sellingPrice: doc.sellingPrice,
              price: doc.price,
              stock: doc.stock,
              minStock: doc.minStock,
              supplier: doc.supplier,
              description: doc.description,
              active: doc.active,
              updatedAt: now,
            },
            $setOnInsert: {
              id: doc.id,
              sku: doc.sku,
              createdAt: now,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await inventory.bulkWrite(ops, { ordered: false });
    console.log(`Inserted ${result.upsertedCount || 0} new parts and updated ${result.modifiedCount || 0} parts.`);
    console.log('Inventory parts are ready for the frontend Manage Inventory page.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Inventory seed failed:', error.message);
  process.exitCode = 1;
});
