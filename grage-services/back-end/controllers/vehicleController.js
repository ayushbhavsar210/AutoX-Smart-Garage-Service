const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const getNextVehicleId = async (db) => {
  const [lastVehicle] = await db
    .collection('vehicles')
    .find({ id: { $type: 'number' } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  return (lastVehicle?.id || 0) + 1;
};

const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const vehicleNumberOf = (payload = {}) =>
  toText(payload.vehicle_number || payload.vehicleNumber || payload.plate).toUpperCase();

const vehicleCompanyOf = (payload = {}) =>
  toText(payload.vehicle_company || payload.vehicleCompany || payload.make);

const vehicleModelOf = (payload = {}) =>
  toText(payload.vehicle_model || payload.vehicleModel || payload.model);

const vehicleTypeOf = (payload = {}) => {
  const raw = toText(payload.vehicle_type || payload.vehicleType || payload.type, 'Car').toLowerCase();
  if (raw === 'bike') return 'Bike';
  return 'Car';
};

const customerNameOf = (payload = {}) =>
  toText(payload.customer_name || payload.customerName || payload.name);

const mobileOf = (payload = {}) =>
  toText(payload.mobile || payload.phone);

const toPublicRecord = (record = {}) => ({
  ...record,
  userid: record.userid ?? record.userId ?? record.user_id ?? null,
  plate: toText(record.plate || record.vehicle_number).toUpperCase(),
  vehicle_number: toText(record.vehicle_number || record.plate).toUpperCase(),
  vehicle_company: toText(record.vehicle_company || record.make),
  vehicle_model: toText(record.vehicle_model || record.model),
  vehicle_type: vehicleTypeOf(record),
  customer_name: customerNameOf(record),
  mobile: mobileOf(record),
  email: toText(record.email),
  added_by: toText(record.added_by || record.addedBy || 'user'),
  created_at: record.created_at || record.createdAt,
  user_id: record.user_id ?? record.userId ?? null,
  added_from: toText(record.added_by || record.addedBy || 'user'),
});

const resolveUserIdFromParamOrBody = (req) => {
  const raw = req.params.userId || req.query.userId || req.body.userId || req.body.user_id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const resolveQueryUserIdentity = (req) => ({
  userId: resolveUserIdFromParamOrBody(req),
  userObjectId: toText(req.query.userObjectId),
  email: toText(req.query.email).toLowerCase(),
  customerName: toText(req.query.customerName),
  mobile: toText(req.query.mobile),
});

const resolveAuthenticatedUserIdentity = (user = {}) => {
  const numericUserId = Number(user?.userId ?? user?.id);
  const objectIdText = toText(user?._id || user?.userObjectId || user?.id);

  return {
    userId: Number.isFinite(numericUserId) ? numericUserId : null,
    userObjectId: objectIdText,
  };
};

const buildAuthenticatedUserFilter = (user = {}) => {
  const { userId, userObjectId } = resolveAuthenticatedUserIdentity(user);
  const filters = [];
  const userEmail = toText(user?.email).toLowerCase();
  const userName = toText(user?.name || user?.fullName);
  const userPhone = toText(user?.phone);

  if (userId !== null) {
    filters.push(
      { user_id: userId },
      { userId: userId },
      { userid: userId },
      { user_id: String(userId) },
      { userId: String(userId) },
      { userid: String(userId) }
    );
  }

  if (userObjectId) {
    filters.push({ userObjectId }, { user_id: userObjectId }, { userId: userObjectId }, { userid: userObjectId });
  }

  if (userEmail) {
    filters.push({ email: { $regex: `^${escapeRegex(userEmail)}$`, $options: 'i' } });
  }

  if (userName) {
    filters.push({ customer_name: { $regex: `^${escapeRegex(userName)}$`, $options: 'i' } });
  }

  if (userPhone) {
    filters.push({ mobile: userPhone });
  }

  return filters.length ? { $or: filters } : null;
};

const buildVehicleMatchFilter = (req) => {
  if (req.user) {
    return buildAuthenticatedUserFilter(req.user);
  }

  const queryIdentity = resolveQueryUserIdentity(req);
  const filters = [];

  if (queryIdentity.userId !== null) {
    filters.push(
      { user_id: queryIdentity.userId },
      { userId: queryIdentity.userId },
      { userid: queryIdentity.userId },
      { user_id: String(queryIdentity.userId) },
      { userId: String(queryIdentity.userId) },
      { userid: String(queryIdentity.userId) }
    );
  }

  if (queryIdentity.userObjectId) {
    filters.push(
      { userObjectId: queryIdentity.userObjectId },
      { user_id: queryIdentity.userObjectId },
      { userId: queryIdentity.userObjectId },
      { userid: queryIdentity.userObjectId }
    );
  }

  if (queryIdentity.email) {
    filters.push({ email: { $regex: `^${escapeRegex(queryIdentity.email)}$`, $options: 'i' } });
  }

  if (queryIdentity.customerName) {
    filters.push({ customer_name: { $regex: `^${escapeRegex(queryIdentity.customerName)}$`, $options: 'i' } });
  }

  if (queryIdentity.mobile) {
    filters.push({ mobile: queryIdentity.mobile });
  }

  return filters.length ? { $or: filters } : null;
};

const buildUserFilter = (rawUserId) => {
  if (rawUserId === null || rawUserId === undefined || rawUserId === '') return null;

  const n = Number(rawUserId);
  if (Number.isFinite(n)) {
    return {
      $or: [
        { user_id: n },
        { userId: n },
        { userid: n },
        { user_id: String(n) },
        { userId: String(n) },
        { userid: String(n) },
      ],
    };
  }

  const asText = toText(rawUserId);
  if (ObjectId.isValid(asText) && String(new ObjectId(asText)) === asText) {
    return {
      $or: [{ userObjectId: asText }, { user_id: asText }, { userId: asText }, { userid: asText }],
    };
  }

  return { $or: [{ user_id: asText }, { userId: asText }, { userid: asText }] };
};

const buildVehicleDocument = async (db, payload = {}, options = {}) => {
  const { forcedAddedBy, fallbackUser = null } = options;

  const vehicleNumber = vehicleNumberOf(payload);
  if (!vehicleNumber) {
    throw new Error('vehicle_number is required');
  }

  const userId = payload.user_id ?? payload.userId ?? fallbackUser?.userId ?? null;
  const userObjectId = toText(payload.userObjectId || fallbackUser?._id || '');
  const legacyUserId =
    userId !== null && userId !== undefined && userId !== ''
      ? userId
      : userObjectId || null;

  return {
    id: await getNextVehicleId(db),
    user_id: userId,
    userId,
    userid: legacyUserId,
    userObjectId,
    plate: vehicleNumber,
    customer_name: customerNameOf(payload) || toText(fallbackUser?.name || fallbackUser?.fullName || fallbackUser?.email),
    mobile: mobileOf(payload) || toText(fallbackUser?.phone),
    email: toText(payload.email || fallbackUser?.email),
    vehicle_number: vehicleNumber,
    vehicle_company: vehicleCompanyOf(payload),
    vehicle_model: vehicleModelOf(payload),
    vehicle_type: vehicleTypeOf(payload),
    added_by: toText(forcedAddedBy || payload.added_by || payload.addedBy || 'user'),
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
};

const upsertVehicleRecord = async (db, payload = {}, options = {}) => {
  const vehicleNumber = vehicleNumberOf(payload);
  if (!vehicleNumber) return null;

  const userId = payload.user_id ?? payload.userId ?? options?.fallbackUser?.userId ?? null;
  const userObjectId = toText(payload.userObjectId || options?.fallbackUser?._id || '');
  const legacyUserId =
    userId !== null && userId !== undefined && userId !== ''
      ? userId
      : userObjectId || null;

  const filter = { $or: [{ vehicle_number: vehicleNumber }, { plate: vehicleNumber }] };

  const existing = await db.collection('vehicles').findOne(filter);

  if (existing) {
    const updateFields = {
      customer_name: customerNameOf(payload) || existing.customer_name || customerNameOf(existing),
      mobile: mobileOf(payload) || existing.mobile || mobileOf(existing),
      vehicle_company: vehicleCompanyOf(payload) || existing.vehicle_company || vehicleCompanyOf(existing),
      vehicle_model: vehicleModelOf(payload) || existing.vehicle_model || vehicleModelOf(existing),
      vehicle_type: vehicleTypeOf(payload || existing),
      plate: vehicleNumber,
      userid: legacyUserId ?? existing.userid ?? existing.userId ?? existing.user_id ?? null,
      updatedAt: new Date().toISOString(),
      added_by: toText(payload.added_by || payload.addedBy || existing.added_by || existing.addedBy || options?.forcedAddedBy || 'user'),
    };

    await db.collection('vehicles').updateOne({ _id: existing._id }, { $set: updateFields });
    return db.collection('vehicles').findOne({ _id: existing._id });
  }

  const newDoc = await buildVehicleDocument(db, payload, options);
  await db.collection('vehicles').insertOne(newDoc);
  return newDoc;
};

const getVehicles = async (req, res, next) => {
  try {
    const db = getDB();
    const queryUserId = resolveUserIdFromParamOrBody(req);
    const filter = req.user
      ? buildVehicleMatchFilter(req) || {}
      : (Number.isFinite(queryUserId)
          ? buildUserFilter(queryUserId) || {}
          : buildVehicleMatchFilter(req) || {});
    const records = await db.collection('vehicles').find(filter).sort({ id: -1 }).toArray();

    return res.status(200).json({ success: true, data: records.map(toPublicRecord) });
  } catch (error) {
    return next(error);
  }
};

const getAllVehicles = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = {};

    if (req.query.vehicleNumber) {
      filter.vehicle_number = { $regex: toText(req.query.vehicleNumber), $options: 'i' };
    }

    if (req.query.customerName) {
      filter.customer_name = { $regex: toText(req.query.customerName), $options: 'i' };
    }

    const records = await db.collection('vehicles').find(filter).sort({ created_at: -1, id: -1 }).toArray();
    return res.status(200).json({ success: true, data: records.map(toPublicRecord), count: records.length });
  } catch (error) {
    return next(error);
  }
};

const createVehicle = async (req, res, next) => {
  try {
    const db = getDB();
    const fallbackUser = req.user || null;
    const authIdentity = resolveAuthenticatedUserIdentity(fallbackUser);

    const userId = req.body.user_id ?? req.body.userId ?? authIdentity.userId;
    const payload = {
      ...req.body,
      user_id: Number.isFinite(Number(userId)) ? Number(userId) : userId,
      userid: Number.isFinite(Number(userId)) ? Number(userId) : userId,
      plate: vehicleNumberOf(req.body),
      userObjectId: toText(req.body.userObjectId || authIdentity.userObjectId),
      email: toText(req.body.email || fallbackUser?.email),
      customer_name: customerNameOf(req.body) || toText(fallbackUser?.name || fallbackUser?.fullName || fallbackUser?.email),
      mobile: mobileOf(req.body) || toText(fallbackUser?.phone),
      added_by: toText(req.body.added_by || req.body.addedBy || 'user'),
    };

    const created = await upsertVehicleRecord(db, payload, {
      forcedAddedBy: payload.added_by,
      fallbackUser,
    });

    return res.status(201).json({ success: true, message: 'Vehicle added', data: toPublicRecord(created) });
  } catch (error) {
    if (error.message.includes('required')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const createVehicleByAdmin = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = resolveUserIdFromParamOrBody(req);
    const payload = {
      ...req.body,
      user_id: userId,
      userid: userId,
      plate: vehicleNumberOf(req.body),
      email: toText(req.body.email || req.user?.email),
      added_by: 'admin',
    };

    const created = await upsertVehicleRecord(db, payload, { forcedAddedBy: 'admin' });
    return res.status(201).json({ success: true, message: 'Vehicle added by admin', data: toPublicRecord(created) });
  } catch (error) {
    if (error.message.includes('required')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const vehicle = await db.collection('vehicles').findOne({ id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    return res.status(200).json({ success: true, data: toPublicRecord(vehicle) });
  } catch (error) {
    return next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const updates = {};

    if (req.body.customer_name !== undefined || req.body.customerName !== undefined) updates.customer_name = customerNameOf(req.body);
    if (req.body.mobile !== undefined || req.body.phone !== undefined) updates.mobile = mobileOf(req.body);
    if (req.body.vehicle_number !== undefined || req.body.vehicleNumber !== undefined || req.body.plate !== undefined) updates.vehicle_number = vehicleNumberOf(req.body);
    if (req.body.vehicle_company !== undefined || req.body.vehicleCompany !== undefined || req.body.make !== undefined) updates.vehicle_company = vehicleCompanyOf(req.body);
    if (req.body.vehicle_model !== undefined || req.body.vehicleModel !== undefined || req.body.model !== undefined) updates.vehicle_model = vehicleModelOf(req.body);
    if (req.body.vehicle_type !== undefined || req.body.vehicleType !== undefined || req.body.type !== undefined) updates.vehicle_type = vehicleTypeOf(req.body);
    if (req.body.user_id !== undefined || req.body.userId !== undefined) {
      const userId = req.body.user_id ?? req.body.userId;
      updates.user_id = Number.isFinite(Number(userId)) ? Number(userId) : userId;
      updates.userId = updates.user_id;
    }

    updates.updatedAt = new Date().toISOString();

    const result = await db.collection('vehicles').updateOne({ id }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = await db.collection('vehicles').findOne({ id });
    return res.status(200).json({ success: true, message: 'Vehicle updated', data: toPublicRecord(vehicle) });
  } catch (error) {
    return next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const result = await db.collection('vehicles').deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    return res.status(200).json({ success: true, message: 'Vehicle removed' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getVehicles,
  getAllVehicles,
  createVehicle,
  createVehicleByAdmin,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  upsertVehicleRecord,
};
