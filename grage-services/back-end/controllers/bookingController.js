const { getDB } = require('../config/db');
const { upsertVehicleRecord } = require('./vehicleController');
const sendEmail = require('../utils/sendEmail');
const { clearCache } = require('../utils/responseCache');
const { getPaginationParams, buildProjection, formatPaginatedResponse } = require('../utils/queryOptimization');

const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const sendBookingStatusEmail = async (to, subject, html) => {
  if (!to) return;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('BOOKING STATUS EMAIL ERROR:', error?.message || error);
  }
};

const buildBookingAssignmentTemplate = (booking = {}) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Staff Assigned</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(booking.customerName, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">A staff member has been assigned to your booking.</p>
        <p style="margin:0 0 8px;"><strong>Booking ID:</strong> ${toText(booking.id, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Service:</strong> ${toText(booking.serviceName, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${toText(booking.vehicleNumber, 'N/A')}</p>
        <p style="margin:0;"><strong>Assigned Staff:</strong> ${toText(booking.mechanicName, 'N/A')}</p>
      </div>
    </div>
  </div>
`;

const buildBookingCompletedTemplate = (booking = {}) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Your Work Is Completed</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(booking.customerName, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">Your service work has been completed successfully.</p>
        <p style="margin:0 0 8px;"><strong>Booking ID:</strong> ${toText(booking.id, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Service:</strong> ${toText(booking.serviceName, 'N/A')}</p>
        <p style="margin:0;"><strong>Vehicle:</strong> ${toText(booking.vehicleNumber, 'N/A')}</p>
      </div>
    </div>
  </div>
`;

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveAuthUserFilter = (authUser = {}) => {
  const numericId = Number(authUser?.userId ?? authUser?.id);
  const objectIdText = String(authUser?._id || '').trim();
  const emailText = String(authUser?.email || '').trim();

  const candidates = [];
  
  // Match by numeric userId
  if (Number.isFinite(numericId) && numericId > 0) {
    candidates.push(
      { userId: numericId },
      { userId: String(numericId) },
      { user_id: numericId },
      { user_id: String(numericId) },
      { userid: numericId },
      { userid: String(numericId) }
    );
  }
  
  // Match by MongoDB ObjectId (_id)
  if (objectIdText) {
    candidates.push(
      { userObjectId: objectIdText },
      { userId: objectIdText },
      { user_id: objectIdText },
      { userid: objectIdText }
    );
  }
  
  // Match by email (case-insensitive)
  if (emailText) {
    const escapedEmail = escapeRegex(emailText);
    candidates.push(
      { email: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: 'i' } },
      { email: { $regex: escapedEmail, $options: 'i' } }
    );
  }

  if (!candidates.length) return {};
  return { $or: candidates };
};

const buildLooseUserFallbackFilter = (authUser = {}) => {
  const emailText = String(authUser?.email || '').trim();
  const objectIdText = String(authUser?._id || '').trim();
  const numericId = Number(authUser?.userId ?? authUser?.id);
  const conditions = [];

  if (emailText) {
    const escapedEmail = escapeRegex(emailText);
    conditions.push(
      { email: { $regex: escapedEmail, $options: 'i' } },
      { customerEmail: { $regex: escapedEmail, $options: 'i' } }
    );
  }

  if (objectIdText) {
    conditions.push(
      { userObjectId: objectIdText },
      { userId: objectIdText },
      { user_id: objectIdText },
      { userid: objectIdText }
    );
  }

  if (Number.isFinite(numericId) && numericId > 0) {
    conditions.push(
      { userId: numericId },
      { userId: String(numericId) },
      { user_id: numericId },
      { user_id: String(numericId) },
      { userid: numericId },
      { userid: String(numericId) }
    );
  }

  return conditions.length ? { $or: conditions } : {};
};

const normalizeBookingStatus = (status) => {
  const raw = String(status || '').trim().toLowerCase();
  if (['pending'].includes(raw)) return 'pending';
  if (['in progress', 'in-progress', 'in_progress'].includes(raw)) return 'in-progress';
  if (['completed', 'complete'].includes(raw)) return 'completed';
  if (['cancelled', 'canceled'].includes(raw)) return 'canceled';
  return raw || 'pending';
};

const enrichBookings = async (db, records = []) => {
  if (!Array.isArray(records) || !records.length) return [];

  const numericUserIds = Array.from(
    new Set(
      records
        .map((item) => Number(item?.userId ?? item?.user_id))
        .filter((value) => Number.isFinite(value))
    )
  );

  const vehicleIds = Array.from(
    new Set(
      records
        .map((item) => Number(item?.vehicleId ?? item?.vehicle_id))
        .filter((value) => Number.isFinite(value))
    )
  );

  const [users, vehicles] = await Promise.all([
    numericUserIds.length
      ? db.collection('users').find({ userId: { $in: numericUserIds } }).toArray()
      : Promise.resolve([]),
    vehicleIds.length
      ? db.collection('vehicles').find({ id: { $in: vehicleIds } }).toArray()
      : Promise.resolve([]),
  ]);

  const userMap = new Map(users.map((user) => [Number(user.userId), user]));
  const vehicleMap = new Map(vehicles.map((vehicle) => [Number(vehicle.id), vehicle]));

  return records.map((record) => {
    const user = userMap.get(Number(record.userId ?? record.user_id));
    const vehicle = vehicleMap.get(Number(record.vehicleId ?? record.vehicle_id));

    return {
      ...record,
      user_id: record.userId ?? record.user_id ?? null,
      vehicle_id: record.vehicleId ?? record.vehicle_id ?? vehicle?.id ?? null,
      customerName:
        record.customerName ||
        record.customer_name ||
        user?.fullName ||
        user?.name ||
        user?.email ||
        'N/A',
      mobile: record.phone || record.mobile || user?.phone || 'N/A',
      vehicleNumber:
        record.vehicleNumber || record.vehicle_number || vehicle?.vehicle_number || vehicle?.plate || 'N/A',
      vehicleModel:
        record.vehicleModel || record.vehicle_model || vehicle?.vehicle_model || vehicle?.model || 'N/A',
      vehicleCompany:
        record.vehicleCompany || record.vehicle_company || vehicle?.vehicle_company || vehicle?.make || 'N/A',
      serviceType: record.serviceName || record.serviceType || record.serviceId || 'N/A',
      bookingDate: record.date || record.bookingDate || record.scheduledAt || record.createdAt,
      bookingStatus: normalizeBookingStatus(record.status),
      mechanicName: record.mechanicName || 'Unassigned',
    };
  });
};

const getNextBookingId = async (db) => {
  const [lastBooking] = await db
    .collection('bookings')
    .find({ id: { $type: 'number' } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  return (lastBooking?.id || 0) + 1;
};

const getBookings = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = resolveAuthUserFilter(req.user);
    const { page, limit, skip } = getPaginationParams(req.query);

    // Fields to return for listing (exclude large/unnecessary fields)
    const projection = buildProjection([
      'id', 'customerName', 'vehicleNumber', 'serviceName', 
      'status', 'dateScheduled', 'timeSlot', 'createdAt', 'totalPrice'
    ]);

    const total = await db.collection('bookings').countDocuments(filter);
    let records = await db
      .collection('bookings')
      .find(filter)
      .project(projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    if (!records.length && req.user) {
      const looseFilter = buildLooseUserFallbackFilter(req.user);
      const looseTotal = await db.collection('bookings').countDocuments(looseFilter);
      records = await db
        .collection('bookings')
        .find(looseFilter)
        .project(projection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      return res.status(200).json(formatPaginatedResponse(records, looseTotal, page, limit));
    }

    return res.status(200).json(formatPaginatedResponse(records, total, page, limit));
  } catch (error) {
    return next(error);
  }
};

const getMyServiceHistory = async (req, res, next) => {
  try {
    const db = getDB();
    const filter = resolveAuthUserFilter(req.user);

    let records = await db
      .collection('bookings')
      .find({
        ...filter,
        status: { $in: ['completed', 'Completed'] },
      })
      .sort({ id: -1 })
      .toArray();

    if (!records.length && req.user) {
      const looseFilter = buildLooseUserFallbackFilter(req.user);
      records = await db
        .collection('bookings')
        .find({
          ...looseFilter,
          status: { $in: ['completed', 'Completed'] },
        })
        .sort({ id: -1 })
        .toArray();
    }

    return res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    return next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const db = getDB();
    const { vehicleNumber, customerName, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = normalizeBookingStatus(status);
    }

    let records = await db.collection('bookings').find(filter).sort({ id: -1 }).toArray();
    records = await enrichBookings(db, records);

    if (vehicleNumber) {
      const search = String(vehicleNumber).toLowerCase();
      records = records.filter((item) => String(item?.vehicleNumber || '').toLowerCase().includes(search));
    }

    if (customerName) {
      const search = String(customerName).toLowerCase();
      records = records.filter((item) => String(item?.customerName || '').toLowerCase().includes(search));
    }

    return res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    return next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const {
      serviceId,
      serviceName,
      scheduledAt,
      notes,
      amount,
      paymentMethod,
      paymentStatus,
      paymentDate,
      invoiceNumber,
      transactionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      vehicleNumber,
      vehicleCompany,
      vehicleModel,
      vehicleType,
    } = req.body;
    const db = getDB();
    
    // Extract user IDs from authenticated user
    const currentUserId = Number(req.user.userId) || null;  // Numeric ID (may be null for older users)
    const currentUserObjectId = String(req.user._id || '').trim();  // MongoDB ObjectId
    
    // Handle serviceId - could be numeric or string (MongoDB ObjectId)
    const parsedServiceId = (() => {
      const numServiceId = Number(serviceId);
      return !isNaN(numServiceId) && serviceId !== '' ? numServiceId : serviceId;
    })();
    
    // Prevent duplicate bookings: look for a recent pending booking with same user/service/scheduledAt/vehicle
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const duplicateFilter = {
      userId: currentUserId || null,
      serviceId: parsedServiceId,
      scheduledAt: scheduledAt || null,
      vehicleNumber: vehicleNumber || null,
      createdAt: { $gte: tenMinutesAgo },
    };

    const existing = await db.collection('bookings').findOne(duplicateFilter);
    if (existing) {
      return res.status(200).json({ success: true, message: 'Booking already exists', data: existing });
    }

    const booking = {
      id: await getNextBookingId(db),
      userId: currentUserId,
      user_id: currentUserId,
      userObjectId: currentUserObjectId,
      serviceId: parsedServiceId,
      serviceName: serviceName || '',
      scheduledAt,
      notes,
      customerName: req.user.name || req.user.fullName || req.user.email || 'Customer',
      phone: req.user.phone || '',
      email: req.user.email || '',
      amount: amount ? Number(amount) : 0,
      paymentMethod: paymentMethod || '',
      paymentStatus: paymentStatus || '',
      paymentDate: paymentDate || null,
      invoiceNumber: invoiceNumber || '',
      transactionId: transactionId || '',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      vehicleNumber,
      vehicleCompany,
      vehicleModel,
      vehicleType,
      status: 'scheduled',
      bookingStatus: 'scheduled',
      createdAt: new Date().toISOString()
    };

    await db.collection('bookings').insertOne(booking);
    clearCache('dashboard-metrics');
    clearCache('revenue-analytics');
    clearCache('booking-trends');

    if (vehicleNumber) {
      const vehicleRecord = await upsertVehicleRecord(
        db,
        {
          user_id: currentUserId,
          email: req.user.email || '',
          customer_name: req.user.name || req.user.fullName || req.user.email || 'Customer',
          mobile: req.user.phone || '',
          vehicle_number: vehicleNumber,
          vehicle_company: vehicleCompany || '',
          vehicle_model: vehicleModel || '',
          vehicle_type: vehicleType || 'Car',
          added_by: 'user',
        },
        { forcedAddedBy: 'user', fallbackUser: req.user }
      );

      if (vehicleRecord?.id) {
        booking.vehicleId = Number(vehicleRecord.id);
        booking.vehicle_id = Number(vehicleRecord.id);
        await db.collection('bookings').updateOne(
          { id: booking.id },
          { $set: { vehicleId: booking.vehicleId, vehicle_id: booking.vehicle_id } }
        );
        clearCache('dashboard-metrics');
        clearCache('revenue-analytics');
        clearCache('booking-trends');
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created',
      data: booking
    });
  } catch (error) {
    return next(error);
  }
};

const createBookingPublic = async (req, res, next) => {
  try {
    const {
      userId,
      userObjectId,
      serviceId,
      serviceName,
      customerName,
      email,
      phone,
      vehicleNumber,
      vehicleCompany,
      vehicleModel,
      vehicleType,
      date,
      timeSlot,
      scheduledAt,
      notes,
      amount,
      paymentMethod,
      paymentStatus,
      paymentDate,
      invoiceNumber,
      transactionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const db = getDB();
    
    // Handle serviceId - could be numeric or string (MongoDB ObjectId)
    const parsedServiceId = (() => {
      const numServiceId = Number(serviceId);
      return !isNaN(numServiceId) && serviceId !== '' ? numServiceId : serviceId;
    })();
    
    const numericUserId = Number(userId);
    const resolvedUserId = Number.isFinite(numericUserId) && numericUserId > 0 ? numericUserId : null;
    const resolvedPaymentStatus = String(paymentStatus || '').trim().toLowerCase();

    // Prevent duplicate public bookings: match by email/serviceName/scheduledAt/vehicle created recently
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const duplicateFilter = {
      email: (email || '').toLowerCase() || (String(userObjectId || userId || '') || '').toLowerCase(),
      serviceName: serviceName || null,
      scheduledAt: scheduledAt || null,
      vehicleNumber: vehicleNumber || null,
      createdAt: { $gte: tenMinutesAgo },
    };

    const existing = await db.collection('bookings').findOne(duplicateFilter);
    if (existing) {
      return res.status(200).json({ success: true, message: 'Booking already exists', data: existing });
    }

    const booking = {
      id: await getNextBookingId(db),
      userId: resolvedUserId,
      user_id: resolvedUserId,
      userObjectId: resolvedUserId ? '' : String(userObjectId || userId || '').trim(),
      serviceId: parsedServiceId,
      serviceName,
      customerName,
      email,
      phone,
      vehicleNumber,
      vehicleCompany,
      vehicleModel,
      vehicleType,
      date,
      timeSlot,
      scheduledAt: scheduledAt || null,
      notes,
      amount: amount ? Number(amount) : 0,
      paymentMethod: paymentMethod || '',
      paymentStatus: paymentStatus || '',
      paymentDate: paymentDate || null,
      invoiceNumber: invoiceNumber || '',
      transactionId: transactionId || '',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      status: resolvedPaymentStatus === 'completed' || resolvedPaymentStatus === 'paid' ? 'scheduled' : 'pending',
      bookingStatus: resolvedPaymentStatus === 'completed' || resolvedPaymentStatus === 'paid' ? 'scheduled' : 'pending',
      createdAt: new Date().toISOString()
    };

    await db.collection('bookings').insertOne(booking);
    clearCache('dashboard-metrics');
    clearCache('revenue-analytics');
    clearCache('booking-trends');

    if (vehicleNumber) {
      const vehicleRecord = await upsertVehicleRecord(
        db,
        {
          user_id: userId ? Number(userId) : null,
          email: email || '',
          customer_name: customerName || email || 'Customer',
          mobile: phone || '',
          vehicle_number: vehicleNumber,
          vehicle_company: vehicleCompany || '',
          vehicle_model: vehicleModel || '',
          vehicle_type: vehicleType || 'Car',
          added_by: 'user',
        },
        { forcedAddedBy: 'user' }
      );

      if (vehicleRecord?.id) {
        booking.vehicleId = Number(vehicleRecord.id);
        booking.vehicle_id = Number(vehicleRecord.id);
        await db.collection('bookings').updateOne(
          { id: booking.id },
          { $set: { vehicleId: booking.vehicleId, vehicle_id: booking.vehicle_id } }
        );
        clearCache('dashboard-metrics');
        clearCache('revenue-analytics');
        clearCache('booking-trends');
      }
    }

    return res.status(201).json({ success: true, message: 'Booking created', data: booking });
  } catch (error) {
    return next(error);
  }
};

const getMyBookings = async (req, res, next) => getBookings(req, res, next);

const getBookingById = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const booking = await db.collection('bookings').findOne({ id, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const userId = Number(req.user.id);

    const updateResult = await db.collection('bookings').updateOne(
      { id, userId },
      {
        $set: {
          status: 'canceled',
          canceledAt: new Date().toISOString()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const updated = await db.collection('bookings').findOne({ id, userId });

    return res.status(200).json({
      success: true,
      message: 'Booking canceled',
      data: updated
    });
  } catch (error) {
    return next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const result = await db.collection('bookings').deleteOne({ id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking deleted'
    });
  } catch (error) {
    return next(error);
  }
};

const getBookingStats = async (req, res, next) => {
  try {
    const db = getDB();

    const [
      totalBookings,
      scheduledBookings,
      completedBookings,
      canceledBookings
    ] = await Promise.all([
      db.collection('bookings').countDocuments(),
      db.collection('bookings').countDocuments({ status: 'scheduled' }),
      db.collection('bookings').countDocuments({ status: 'completed' }),
      db.collection('bookings').countDocuments({ status: 'canceled' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        scheduledBookings,
        completedBookings,
        canceledBookings,
        completionRate: totalBookings > 0 ? `${((completedBookings / totalBookings) * 100).toFixed(2)}%` : '0%'
      }
    });
  } catch (error) {
    return next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const { status, mechanicId, mechanicName } = req.body;
    const existingBooking = await db.collection('bookings').findOne({ id });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const normalizedStatus = normalizeBookingStatus(status);

    if (!['pending', 'scheduled', 'in-progress', 'completed', 'canceled'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    let resolvedMechanicName = mechanicName || '';
    let resolvedMechanicId = mechanicId;

    if (mechanicId && !mechanicName) {
      const mechanic = await db.collection('mechanics').findOne({ id: Number(mechanicId) });
      if (mechanic) {
        resolvedMechanicName = mechanic.name;
        resolvedMechanicId = mechanic.id;
      }
    }

    const updateData = {
      status: normalizedStatus,
      statusUpdatedAt: new Date().toISOString(),
    };

    if (resolvedMechanicId !== undefined && resolvedMechanicId !== null && resolvedMechanicId !== '') {
      updateData.mechanicId = Number(resolvedMechanicId);
    }

    if (resolvedMechanicName) {
      updateData.mechanicName = resolvedMechanicName;
    }

    await db.collection('bookings').updateOne(
      { id },
      {
        $set: updateData
      }
    );
    clearCache('dashboard-metrics');
    clearCache('revenue-analytics');
    clearCache('booking-trends');

    const updated = await db.collection('bookings').findOne({ id });
    const receiverEmail = toText(updated?.email).toLowerCase();

    const newlyAssignedMechanic =
      toText(updated?.mechanicName)
      && toText(updated?.mechanicName).toLowerCase() !== toText(existingBooking?.mechanicName).toLowerCase();

    if (receiverEmail && newlyAssignedMechanic) {
      await sendBookingStatusEmail(
        receiverEmail,
        'AutoX Garage | Staff Assigned For Your Booking',
        buildBookingAssignmentTemplate(updated)
      );
    }

    const movedToCompleted =
      normalizeBookingStatus(existingBooking?.status) !== 'completed'
      && normalizedStatus === 'completed';

    if (receiverEmail && movedToCompleted) {
      await sendBookingStatusEmail(
        receiverEmail,
        'AutoX Garage | Your Work Is Completed',
        buildBookingCompletedTemplate(updated)
      );
    }

    const [enriched] = await enrichBookings(db, [updated]);

    return res.status(200).json({
      success: true,
      message: 'Booking status updated',
      data: enriched || updated
    });
  } catch (error) {
    return next(error);
  }
};

const deleteBookingByAdmin = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const result = await db.collection('bookings').deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    return next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const db = getDB();
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const bookings = await db.collection('bookings').find({
      scheduledAt: { $gte: dayStart.toISOString(), $lte: dayEnd.toISOString() },
      status: { $nin: ['canceled'] }
    }).toArray();

    const slotTemplate = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];
    const occupied = new Set(bookings.map((item) => {
      const hour = new Date(item.scheduledAt).getUTCHours();
      if (hour === 9) return '09:00-10:00';
      if (hour === 10) return '10:00-11:00';
      if (hour === 11) return '11:00-12:00';
      if (hour === 14) return '14:00-15:00';
      if (hour === 15) return '15:00-16:00';
      if (hour === 16) return '16:00-17:00';
      return null;
    }).filter(Boolean));

    const data = slotTemplate.filter((slot) => !occupied.has(slot)).map((time) => ({ time, available: true }));

    return res.status(200).json({
      success: true,
      date,
      data
    });
  } catch (error) {
    return next(error);
  }
};

const rescheduleBooking = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const { newScheduledAt } = req.body;
    const userId = Number(req.user.id);

    const booking = await db.collection('bookings').findOne({ id, userId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!newScheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'newScheduledAt is required'
      });
    }

    await db.collection('bookings').updateOne(
      { id, userId },
      {
        $set: {
          scheduledAt: newScheduledAt,
          rescheduledAt: new Date().toISOString(),
          previousScheduledAt: booking.scheduledAt
        }
      }
    );
    clearCache('dashboard-metrics');
    clearCache('revenue-analytics');
    clearCache('booking-trends');

    const updated = await db.collection('bookings').findOne({ id, userId });
    return res.status(200).json({
      success: true,
      message: 'Booking rescheduled',
      data: updated
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getBookings,
  getAllBookings,
  getMyBookings,
  getMyServiceHistory,
  createBooking,
  createBookingPublic,
  getBookingById,
  cancelBooking,
  deleteBooking,
  getBookingStats,
  updateBookingStatus,
  deleteBookingByAdmin,
  getAvailableSlots,
  rescheduleBooking
};
