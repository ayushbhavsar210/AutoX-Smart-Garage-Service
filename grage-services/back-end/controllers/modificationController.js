const { getDB } = require('../config/db');
const sendEmail = require('../utils/sendEmail');

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const sendNotificationEmail = async (to, subject, html) => {
  if (!to) return;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('MODIFICATION EMAIL ERROR:', error?.message || error);
  }
};

const buildModificationQuoteEmail = (mod = {}) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Modification Quote Ready</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(mod.customer, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">Your modification quote is ready.</p>
        <p style="margin:0 0 8px;"><strong>Modification:</strong> ${toText(mod.modType, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${toText(mod.vehicle, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Final Quote:</strong> ${formatCurrency(mod.quote?.exactPrice || mod.estimatedCost)}</p>
        <p style="margin:0 0 8px;"><strong>Duration:</strong> ${toText(mod.duration, 'N/A')}</p>
        <p style="margin:0;"><strong>Assigned Staff:</strong> ${toText(mod.assignedTo, 'To be assigned')}</p>
      </div>
    </div>
  </div>
`;

const buildModificationAssignedEmail = (mod = {}) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Staff Assigned</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(mod.customer, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">A staff member has been assigned to your modification request.</p>
        <p style="margin:0 0 8px;"><strong>Assigned Staff:</strong> ${toText(mod.assignedTo, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Modification:</strong> ${toText(mod.modType, 'N/A')}</p>
        <p style="margin:0;"><strong>Status:</strong> ${toText(mod.status, 'N/A')}</p>
      </div>
    </div>
  </div>
`;

const buildModificationCompletedEmail = (mod = {}) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Your Work Is Completed</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(mod.customer, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">Your modification work has been completed successfully.</p>
        <p style="margin:0 0 8px;"><strong>Modification:</strong> ${toText(mod.modType, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${toText(mod.vehicle, 'N/A')}</p>
        <p style="margin:0;"><strong>Status:</strong> Completed</p>
      </div>
    </div>
  </div>
`;

const getNextId = async (db, collectionName) => {
  const [last] = await db.collection(collectionName).find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  return (last?.id || 0) + 1;
};

const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const parsePositiveNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
};

const normalizeStatus = (status) => {
  const value = toText(status).toLowerCase();

  if (!value) return '';
  if (value.includes('quote') && value.includes('request')) return 'Quote Requested';
  if (value.includes('quote') || value.includes('quoted')) return 'Quoted';
  if (value.includes('confirm')) return 'Confirmed';
  if (value.includes('pickup')) return 'Pickup Scheduled';
  if (value.includes('progress')) return 'In Progress';
  if (value.includes('complete') || value.includes('done')) return 'Completed';
  if (value.includes('reject') || value.includes('cancel')) return 'Rejected';

  return status;
};

const isAdminUser = (user = {}) => String(user?.role || '').trim().toLowerCase() === 'admin';

const getUserIdentityCandidates = (authUser = {}) => {
  const numericId = Number(authUser?.userId ?? authUser?.id);
  const objectIdText = toText(authUser?._id);
  const emailText = toText(authUser?.email).toLowerCase();
  const phoneText = toText(authUser?.phone || authUser?.mobile);
  const nameText = toText(authUser?.name || authUser?.fullName);

  const candidates = {
    numericId: Number.isFinite(numericId) && numericId > 0 ? numericId : null,
    objectIdText,
    emailText,
    phoneText,
    nameText,
  };

  return candidates;
};

const buildMineFilterFromUser = (authUser = {}) => {
  const identity = getUserIdentityCandidates(authUser);
  const filters = [];

  if (identity.numericId != null) {
    filters.push(
      { 'requestBy.userId': identity.numericId },
      { 'requestBy.userId': String(identity.numericId) },
      { userId: identity.numericId },
      { userId: String(identity.numericId) }
    );
  }

  if (identity.objectIdText) {
    filters.push(
      { 'requestBy.userObjectId': identity.objectIdText },
      { userObjectId: identity.objectIdText },
      { userId: identity.objectIdText },
      { 'requestBy.userId': identity.objectIdText }
    );
  }

  if (identity.emailText) {
    filters.push(
      { 'requestBy.email': identity.emailText },
      { email: identity.emailText }
    );
  }

  if (identity.phoneText) {
    filters.push(
      { 'requestBy.phone': identity.phoneText },
      { phone: identity.phoneText }
    );
  }

  if (identity.nameText) {
    filters.push(
      { 'requestBy.name': identity.nameText },
      { customer: identity.nameText }
    );
  }

  if (!filters.length) return null;
  return { $or: filters };
};

const canAccessModification = (mod = {}, authUser = {}) => {
  if (!mod || !authUser) return false;
  if (isAdminUser(authUser)) return true;

  const identity = getUserIdentityCandidates(authUser);
  const modNumericUserId = Number(mod?.requestBy?.userId ?? mod?.userId);
  const modUserObjectId = toText(mod?.requestBy?.userObjectId || mod?.userObjectId || mod?.userId);
  const modEmail = toText(mod?.requestBy?.email || mod?.email).toLowerCase();
  const modPhone = toText(mod?.requestBy?.phone || mod?.phone);
  const modName = toText(mod?.requestBy?.name || mod?.customer);

  if (identity.numericId != null && Number.isFinite(modNumericUserId) && identity.numericId === modNumericUserId) return true;
  if (identity.objectIdText && modUserObjectId && identity.objectIdText === modUserObjectId) return true;
  if (identity.emailText && modEmail && identity.emailText === modEmail) return true;
  if (identity.phoneText && modPhone && identity.phoneText === modPhone) return true;
  if (identity.nameText && modName && identity.nameText === modName) return true;

  return false;
};

const buildMineFilter = (query = {}) => {
  const userId = toText(query.userId);
  const userObjectId = toText(query.userObjectId);
  const email = toText(query.email).toLowerCase();
  const phone = toText(query.mobile || query.phone);
  const customerName = toText(query.customerName || query.customer);

  const filters = [];

  if (userId) {
    filters.push(
      { 'requestBy.userId': userId },
      { 'requestBy.userId': Number(userId) },
      { userId },
      { userId: Number(userId) }
    );
  }

  if (userObjectId) {
    filters.push({ 'requestBy.userObjectId': userObjectId }, { userObjectId });
  }

  if (email) {
    filters.push({ 'requestBy.email': email }, { email });
  }

  if (phone) {
    filters.push({ 'requestBy.phone': phone }, { phone });
  }

  if (customerName) {
    filters.push({ 'requestBy.name': customerName }, { customer: customerName });
  }

  if (!filters.length) return null;
  return { $or: filters };
};

exports.listModifications = async (req, res, next) => {
  try {
    const db = getDB();
    const isAdmin = isAdminUser(req.user);
    const mineFlag = String(req.query.mine || '').toLowerCase() === 'true';
    let filter = {};

    if (mineFlag || !isAdmin) {
      const mineFilter = buildMineFilterFromUser(req.user);
      if (!mineFilter) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      filter = mineFilter;
    }

    const modifications = await db.collection('modifications').find(filter).sort({ id: -1 }).toArray();
    return res.json({ success: true, data: modifications });
  } catch (error) {
    return next(error);
  }
};

exports.createModification = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      customer,
      vehicle,
      modType,
      description,
      estimatedCost,
      duration,
      phone,
      status,
      assignedTo,
      progress,
      budget,
      mods,
      category,
      registration,
      email,
      userId,
      userObjectId,
      pickupDropRequired,
      pickupAddress,
      pickupDate,
      pickupSlot,
      dropAddress,
      notes,
    } = req.body;

    const requestedAt = new Date().toISOString();
    const normalizedExactEstimate = parsePositiveNumber(estimatedCost);

    const authUser = req.user || {};
    const authNumericId = Number(authUser.userId ?? authUser.id);
    const resolvedUserId = Number.isFinite(authNumericId) && authNumericId > 0 ? authNumericId : (toText(authUser._id) || null);
    const resolvedUserObjectId = toText(authUser._id);
    const resolvedUserName = toText(authUser.name || authUser.fullName || customer || '—');
    const resolvedUserEmail = toText(authUser.email || email || '').toLowerCase();
    const resolvedUserPhone = toText(authUser.phone || phone || '');

    const newMod = {
      id: await getNextId(db, 'modifications'),
      customer: resolvedUserName || '—',
      vehicle: vehicle || '—',
      modType: modType || '—',
      description: description || '—',
      estimatedCost: normalizedExactEstimate || estimatedCost || '—',
      duration: duration || '—',
      phone: resolvedUserPhone || '—',
      assignedTo: assignedTo || '—',
      status: normalizeStatus(status || 'Quote Requested') || 'Quote Requested',
      progress: progress != null ? progress : 0,
      budget: budget || '',
      mods: mods || [],
      category: category || '',
      registration: registration || '',
      email: resolvedUserEmail || '',
      notes: notes || '',
      requestBy: {
        userId: resolvedUserId,
        userObjectId: resolvedUserObjectId || userObjectId || '',
        name: resolvedUserName || '—',
        email: resolvedUserEmail || '',
        phone: resolvedUserPhone || '',
      },
      quote: {
        exactPrice: null,
        currency: 'INR',
        notes: '',
        respondedBy: '',
        respondedAt: null,
      },
      userDecision: {
        decision: 'pending',
        decidedAt: null,
      },
      pickupDrop: {
        required: Boolean(pickupDropRequired),
        pickupAddress: pickupAddress || '',
        pickupDate: pickupDate || '',
        pickupSlot: pickupSlot || '',
        dropAddress: dropAddress || '',
        status: pickupDropRequired ? 'requested' : 'not_required',
      },
      timeline: [
        {
          at: requestedAt,
          event: 'REQUEST_CREATED',
          by: 'user',
          note: 'Modification quote request created',
        },
      ],
      createdAt: requestedAt,
      updatedAt: requestedAt,
    };

    await db.collection('modifications').insertOne(newMod);
    return res.status(201).json({ success: true, data: newMod });
  } catch (error) {
    return next(error);
  }
};

exports.getModificationById = async (req, res, next) => {
  try {
    const db = getDB();
    const mod = await db.collection('modifications').findOne({ id: Number(req.params.id) });

    if (!mod) {
      return res.status(404).json({ success: false, message: 'Modification not found' });
    }

    if (!canAccessModification(mod, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({ success: true, data: mod });
  } catch (error) {
    return next(error);
  }
};

exports.setModificationDecision = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const decision = String(req.body?.decision || '').trim().toLowerCase();

    if (!['book', 'not_now'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'decision must be either book or not_now' });
    }

    const now = new Date().toISOString();
    const shouldPickupDrop = Boolean(req.body?.pickupDropRequired);

    const updates = {
      bookingDecision: decision,
      bookingDecisionAt: now,
      updatedAt: now,
      status: decision === 'book' ? (shouldPickupDrop ? 'Pickup Scheduled' : 'Confirmed') : 'Rejected',
      userDecision: {
        decision,
        decidedAt: now,
      },
      'pickupDrop.required': shouldPickupDrop,
      'pickupDrop.status': decision === 'book' ? (shouldPickupDrop ? 'scheduled' : 'not_required') : 'not_required',
    };

    const existing = await db.collection('modifications').findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    if (!canAccessModification(existing, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await db.collection('modifications').updateOne(
      { id },
      {
        $set: updates,
        $push: {
          timeline: {
            at: now,
            event: 'USER_DECISION',
            by: 'user',
            note: decision === 'book' ? 'User confirmed quote' : 'User postponed quote',
          },
        },
      }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    const updated = await db.collection('modifications').findOne({ id });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

exports.respondModificationQuote = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const exactPrice = parsePositiveNumber(req.body?.exactPrice);

    if (!exactPrice) {
      return res.status(400).json({ success: false, message: 'exactPrice must be a positive number' });
    }

    const now = new Date().toISOString();
    const updateFields = {
      status: 'Quoted',
      estimatedCost: exactPrice,
      duration: toText(req.body?.duration),
      assignedTo: toText(req.body?.assignedTo),
      updatedAt: now,
      quote: {
        exactPrice,
        currency: toText(req.body?.currency, 'INR') || 'INR',
        notes: toText(req.body?.quoteNotes),
        respondedBy: toText(req.body?.respondedBy, 'admin') || 'admin',
        respondedAt: now,
      },
    };

    const result = await db.collection('modifications').updateOne(
      { id },
      {
        $set: updateFields,
        $push: {
          timeline: {
            at: now,
            event: 'ADMIN_QUOTE_SENT',
            by: 'admin',
            note: `Exact quote shared: ${exactPrice}`,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    const updated = await db.collection('modifications').findOne({ id });

    const receiverEmail = toText(updated?.email || updated?.requestBy?.email).toLowerCase();
    if (receiverEmail) {
      await sendNotificationEmail(
        receiverEmail,
        'AutoX Garage | Modification Quote Shared',
        buildModificationQuoteEmail(updated)
      );
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

exports.updatePickupDrop = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const required = Boolean(req.body?.required);
    const now = new Date().toISOString();

    const updates = {
      updatedAt: now,
      'pickupDrop.required': required,
      'pickupDrop.pickupAddress': toText(req.body?.pickupAddress),
      'pickupDrop.pickupDate': toText(req.body?.pickupDate),
      'pickupDrop.pickupSlot': toText(req.body?.pickupSlot),
      'pickupDrop.dropAddress': toText(req.body?.dropAddress),
      'pickupDrop.status': required ? 'scheduled' : 'not_required',
      status: required ? 'Pickup Scheduled' : 'Confirmed',
    };

    const existing = await db.collection('modifications').findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    if (!canAccessModification(existing, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await db.collection('modifications').updateOne(
      { id },
      {
        $set: updates,
        $push: {
          timeline: {
            at: now,
            event: 'PICKUP_DROP_UPDATED',
            by: 'user',
            note: required ? 'Pickup/Drop details submitted' : 'Pickup/Drop not required',
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    const updated = await db.collection('modifications').findOne({ id });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

exports.updateModificationStatus = async (req, res, next) => {
  try {
    const db = getDB();
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const id = Number(req.params.id);
    const normalized = normalizeStatus(toText(req.body?.status));

    if (!normalized) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const existing = await db.collection('modifications').findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Modification request not found' });
    }

    const now = new Date().toISOString();
    const updateFields = {
      status: normalized,
      assignedTo: toText(req.body?.assignedTo),
      updatedAt: now,
    };

    if (Number.isFinite(Number(req.body?.progress))) {
      updateFields.progress = Number(req.body.progress);
    }

    const result = await db.collection('modifications').updateOne(
      { id },
      {
        $set: updateFields,
        $push: {
          timeline: {
            at: now,
            event: 'STATUS_UPDATED',
            by: 'admin',
            note: `Status changed to ${normalized}`,
          },
        },
      }
    );

    const updated = await db.collection('modifications').findOne({ id });

    const receiverEmail = toText(updated?.email || updated?.requestBy?.email).toLowerCase();
    const previousAssignedTo = toText(existing?.assignedTo).toLowerCase();
    const nextAssignedTo = toText(updated?.assignedTo).toLowerCase();
    if (receiverEmail && nextAssignedTo && previousAssignedTo !== nextAssignedTo && nextAssignedTo !== '—') {
      await sendNotificationEmail(
        receiverEmail,
        'AutoX Garage | Staff Assigned For Modification',
        buildModificationAssignedEmail(updated)
      );
    }

    if (receiverEmail && normalized === 'Completed' && normalizeStatus(existing?.status) !== 'Completed') {
      await sendNotificationEmail(
        receiverEmail,
        'AutoX Garage | Your Work Is Completed',
        buildModificationCompletedEmail(updated)
      );
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

exports.createModQuote = async (req, res, next) => {
  try {
    const db = getDB();
    const { modId, vehicleId, additionalNotes } = req.body;
    const authNumericId = Number(req.user?.userId ?? req.user?.id);
    const resolvedUserId = Number.isFinite(authNumericId) && authNumericId > 0 ? authNumericId : null;

    if (!resolvedUserId || !modId) {
      return res.status(400).json({ error: 'userId and modId are required' });
    }

    const mod = await db.collection('modifications').findOne({ id: Number(modId) });
    if (!mod) {
      return res.status(404).json({ error: 'Modification not found' });
    }

    const newQuote = {
      id: await getNextId(db, 'mod_quotes'),
      userId: Number(resolvedUserId),
      modId: Number(modId),
      modName: mod.name,
      vehicleId,
      additionalNotes,
      status: 'pending',
      quotePrice: Number(mod.price) * 1.1,
      createdAt: new Date().toISOString()
    };

    await db.collection('mod_quotes').insertOne(newQuote);
    return res.status(201).json({ success: true, data: newQuote });
  } catch (error) {
    return next(error);
  }
};

exports.listModQuotes = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId, status } = req.query;
    const filter = {};
    if (isAdminUser(req.user)) {
      if (userId) filter.userId = Number(userId);
    } else {
      const authNumericId = Number(req.user?.userId ?? req.user?.id);
      if (!Number.isFinite(authNumericId) || authNumericId <= 0) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      filter.userId = authNumericId;
    }
    if (status) filter.status = status;

    const quotes = await db.collection('mod_quotes').find(filter).sort({ id: -1 }).toArray();
    return res.json({ success: true, data: quotes });
  } catch (error) {
    return next(error);
  }
};

exports.updateModQuoteStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const { status, quotePrice } = req.body;
    const updates = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (quotePrice !== undefined) updates.quotePrice = Number(quotePrice);

    const existing = await db.collection('mod_quotes').findOne({ id });
    if (!existing) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (!isAdminUser(req.user)) {
      const authNumericId = Number(req.user?.userId ?? req.user?.id);
      if (!Number.isFinite(authNumericId) || authNumericId <= 0 || authNumericId !== Number(existing.userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const result = await db.collection('mod_quotes').updateOne({ id }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const quote = await db.collection('mod_quotes').findOne({ id });
    return res.json({ success: true, data: quote });
  } catch (error) {
    return next(error);
  }
};

exports.createModOrder = async (req, res, next) => {
  try {
    const db = getDB();
    const { modQuoteId, scheduleDate } = req.body;

    if (!modQuoteId) {
      return res.status(400).json({ error: 'modQuoteId is required' });
    }

    const quote = await db.collection('mod_quotes').findOne({ id: Number(modQuoteId) });
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (!isAdminUser(req.user)) {
      const authNumericId = Number(req.user?.userId ?? req.user?.id);
      if (!Number.isFinite(authNumericId) || authNumericId <= 0 || authNumericId !== Number(quote.userId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const newOrder = {
      id: await getNextId(db, 'mod_orders'),
      modQuoteId: Number(modQuoteId),
      userId: quote.userId,
      modName: quote.modName,
      quotePrice: quote.quotePrice,
      scheduleDate,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    await db.collection('mod_orders').insertOne(newOrder);
    await db.collection('mod_quotes').updateOne({ id: Number(modQuoteId) }, { $set: { status: 'approved' } });

    return res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    return next(error);
  }
};
