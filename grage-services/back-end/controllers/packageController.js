const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

let packageIndexesEnsured = false;

const ensurePackageCollections = async (db) => {
  if (packageIndexesEnsured) return;

  await db.collection('packages').createIndex({ packageId: 1 }, { unique: true });
  await db.collection('packages').createIndex({ name: 1 });
  await db.collection('packages').createIndex({ status: 1 });
  await db.collection('packages').createIndex({ createdAt: -1 });

  await db.collection('user_packages').createIndex({ userId: 1, packageId: 1 }, { unique: true });
  await db.collection('user_packages').createIndex({ userId: 1, status: 1 });

  packageIndexesEnsured = true;
};

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'inactive' ? 'inactive' : 'active';
};

const normalizeFeatures = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toPriceNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildPackageFilter = (rawId) => {
  if (ObjectId.isValid(rawId)) {
    return { _id: new ObjectId(rawId) };
  }
  return { packageId: String(rawId) };
};

const listAllPackages = async (req, res, next) => {
  try {
    const db = getDB();
    await ensurePackageCollections(db);

    const status = req.query?.status ? normalizeStatus(req.query.status) : null;
    const filter = status ? { status } : {};

    const records = await db.collection('packages').find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    return next(error);
  }
};

const getPackageById = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = buildPackageFilter(req.params.id);
    const pkg = await db.collection('packages').findOne(filter);

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    return next(error);
  }
};

const createPackage = async (req, res, next) => {
  try {
    const db = getDB();
    await ensurePackageCollections(db);

    const { name, description, price, duration, features, status } = req.body;
    const now = new Date().toISOString();
    const packageCode = `PKG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const pkg = {
      packageId: packageCode,
      packageCode,
      name: String(name).trim(),
      description: String(description).trim(),
      price: toPriceNumber(price),
      duration: String(duration).trim(),
      features: normalizeFeatures(features),
      status: normalizeStatus(status),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('packages').insertOne(pkg);

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: { ...pkg, _id: result.insertedId },
    });
  } catch (error) {
    return next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = buildPackageFilter(req.params.id);

    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
    if (req.body.price !== undefined) updates.price = toPriceNumber(req.body.price);
    if (req.body.duration !== undefined) updates.duration = String(req.body.duration).trim();
    if (req.body.features !== undefined) updates.features = normalizeFeatures(req.body.features);
    if (req.body.status !== undefined) updates.status = normalizeStatus(req.body.status);
    updates.updatedAt = new Date().toISOString();

    const result = await db.collection('packages').updateOne(filter, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const pkg = await db.collection('packages').findOne(filter);
    return res.status(200).json({ success: true, message: 'Package updated successfully', data: pkg });
  } catch (error) {
    return next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = buildPackageFilter(req.params.id);

    const existing = await db.collection('packages').findOne(filter);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    await db.collection('packages').deleteOne({ _id: existing._id });
    await db.collection('user_packages').deleteMany({ packageId: existing.packageId });

    return res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const getMyPackages = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = Number(req.user.id);
    const records = await db.collection('user_packages').find({ userId }).sort({ createdAt: -1 }).toArray();

    return res.status(200).json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    return next(error);
  }
};

const subscribePackage = async (req, res, next) => {
  try {
    const db = getDB();
    await ensurePackageCollections(db);

    const userId = Number(req.user.id);
    const packageRef = String(req.body.packageId || '');

    let catalogPackage = null;
    if (packageRef) {
      catalogPackage = await db.collection('packages').findOne(
        ObjectId.isValid(packageRef)
          ? { _id: new ObjectId(packageRef) }
          : { packageId: packageRef }
      );
    }

    const fallbackName = req.body.name ? String(req.body.name).trim() : '';
    if (!catalogPackage && !fallbackName) {
      return res.status(400).json({ success: false, message: 'Valid package is required' });
    }

    const canonicalPackageId = catalogPackage?.packageId || packageRef || `PKG-${Date.now()}`;
    const existing = await db.collection('user_packages').findOne({ userId, packageId: canonicalPackageId, status: 'active' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have this package active' });
    }

    const now = new Date().toISOString();
    const features = catalogPackage?.features || normalizeFeatures(req.body.features);
    const duration = catalogPackage?.duration || req.body.duration || req.body.validity || 'per service';
    const price = catalogPackage?.price ?? toPriceNumber(req.body.price);

    const subscription = {
      userPackageId: `UPKG-${Date.now()}`,
      packageId: canonicalPackageId,
      catalogPackageId: catalogPackage?._id?.toString() || null,
      userId,
      name: catalogPackage?.name || fallbackName,
      description: catalogPackage?.description || String(req.body.description || ''),
      price,
      duration,
      features,
      status: 'active',
      subscribedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('user_packages').insertOne(subscription);

    return res.status(201).json({
      success: true,
      message: 'Package subscribed successfully',
      data: subscription,
    });
  } catch (error) {
    return next(error);
  }
};

const renewPackage = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = Number(req.user.id);
    const rawId = String(req.params.id);
    const { amount, paymentMethod } = req.body;
    const now = new Date().toISOString();

    const renewal = {
      renewalId: `REN-${Date.now()}`,
      packageId: rawId,
      userId,
      amount: Number(amount || 0),
      paymentMethod: paymentMethod || 'unknown',
      status: 'active',
      renewedAt: now,
    };

    await db.collection('package_renewals').insertOne(renewal);

    const filter = {
      userId,
      $or: [{ packageId: rawId }, { userPackageId: rawId }],
    };

    await db.collection('user_packages').updateOne(
      filter,
      {
        $set: {
          status: 'active',
          lastRenewedAt: now,
          updatedAt: now,
        },
      },
      { upsert: false }
    );

    return res.status(200).json({
      success: true,
      message: 'Package renewed successfully',
      data: renewal,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getMyPackages,
  subscribePackage,
  renewPackage,
};
