const { getDB } = require('../config/db');

const defaultSettings = {
  businessName: 'Auto Service Garage',
  currency: 'INR',
  timezone: 'IST',
  workingHours: { start: '09:00', end: '18:00' },
  notifications: { emailNotifications: true, smsNotifications: true, pushNotifications: true },
  bookingSettings: { bookingBuffer: 30, maxBookingsPerDay: 20, cancellationPolicy: '24 hours', bookingConfirmation: true }
};

const defaultCompanyInfo = {
  name: 'Auto Service Garage',
  email: 'support@autoservice.com',
  phone: '+91-9876543210',
  website: 'www.autoservice.com',
  description: 'Professional automotive service center',
  gstNo: 'XXX123456XXX',
  legalName: 'Auto Service Pvt Ltd'
};

const getNextLocationId = async (db) => {
  const [last] = await db.collection('locations').find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  return (last?.id || 0) + 1;
};

exports.getSettings = async (req, res, next) => {
  try {
    const db = getDB();
    let settings = await db.collection('settings').findOne({ key: 'system' });

    if (!settings) {
      settings = { key: 'system', ...defaultSettings, updatedAt: new Date().toISOString() };
      await db.collection('settings').insertOne(settings);
    }

    const { _id, key, ...data } = settings;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const db = getDB();
    const updates = req.body;

    await db.collection('settings').updateOne(
      { key: 'system' },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    const settings = await db.collection('settings').findOne({ key: 'system' });
    const { _id, key, ...data } = settings;

    return res.json({ success: true, message: 'Settings updated successfully', data });
  } catch (error) {
    return next(error);
  }
};

exports.getCompanyInfo = async (req, res, next) => {
  try {
    const db = getDB();
    let companyInfo = await db.collection('settings').findOne({ key: 'company_info' });

    if (!companyInfo) {
      companyInfo = { key: 'company_info', ...defaultCompanyInfo, updatedAt: new Date().toISOString() };
      await db.collection('settings').insertOne(companyInfo);
    }

    const { _id, key, ...data } = companyInfo;
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.manageLocation = async (req, res, next) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, address, city, latitude, longitude } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'name and address are required' });
    }

    if (id) {
      const locationId = Number(id);
      const result = await db.collection('locations').updateOne(
        { id: locationId },
        {
          $set: {
            name,
            address,
            city,
            latitude,
            longitude,
            updatedAt: new Date().toISOString()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const location = await db.collection('locations').findOne({ id: locationId });
      return res.json({ message: 'Location updated', location });
    }

    const newLocation = {
      id: await getNextLocationId(db),
      name,
      address,
      city,
      latitude,
      longitude,
      createdAt: new Date().toISOString()
    };

    await db.collection('locations').insertOne(newLocation);
    return res.status(201).json(newLocation);
  } catch (error) {
    return next(error);
  }
};

exports.getLocations = async (req, res, next) => {
  try {
    const db = getDB();
    const locations = await db.collection('locations').find().sort({ id: 1 }).toArray();
    return res.json(locations);
  } catch (error) {
    return next(error);
  }
};

exports.getServiceRates = async (req, res, next) => {
  try {
    const db = getDB();
    const serviceRates = await db.collection('service_rates').find().sort({ id: 1 }).toArray();
    return res.json(serviceRates);
  } catch (error) {
    return next(error);
  }
};

exports.updateServiceRates = async (req, res, next) => {
  try {
    const db = getDB();
    const { serviceRateUpdates } = req.body;

    if (!serviceRateUpdates || !Array.isArray(serviceRateUpdates)) {
      return res.status(400).json({ error: 'serviceRateUpdates array is required' });
    }

    for (const update of serviceRateUpdates) {
      await db.collection('service_rates').updateOne(
        { id: Number(update.id) },
        {
          $set: {
            ...update,
            id: Number(update.id),
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
    }

    const rates = await db.collection('service_rates').find().sort({ id: 1 }).toArray();
    return res.json({ message: 'Service rates updated', rates });
  } catch (error) {
    return next(error);
  }
};
