const { getDB } = require('../config/db');

const getNextNotificationId = async (db) => {
  const [last] = await db.collection('notifications').find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  return (last?.id || 0) + 1;
};

const toSafeString = (value) => String(value || '').trim();
const toLowerSafe = (value) => toSafeString(value).toLowerCase();

const parseDateSafe = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

const resolveUserIdentity = (user = {}) => {
  const numericUserId = Number(user?.userId ?? user?.id);
  const userObjectId = toSafeString(user?._id);
  const email = toLowerSafe(user?.email);
  const name = toSafeString(user?.name || user?.fullName);

  return {
    numericUserId: Number.isFinite(numericUserId) ? numericUserId : null,
    userObjectId,
    email,
    name,
  };
};

const buildNotificationOwnerFilter = (identity = {}) => {
  const clauses = [];

  if (identity.numericUserId !== null) {
    clauses.push(
      { userId: identity.numericUserId },
      { userId: String(identity.numericUserId) }
    );
  }
  if (identity.userObjectId) {
    clauses.push(
      { userObjectId: identity.userObjectId },
      { userId: identity.userObjectId }
    );
  }
  if (identity.email) {
    clauses.push({ email: identity.email });
  }

  return clauses.length ? { $or: clauses } : {};
};

const buildIdSequence = (() => {
  let seed = Date.now();
  return () => {
    seed += 1;
    return seed;
  };
})();

const buildFallbackAdminNotifications = async (db) => {
  const [recentBookings, recentPayments] = await Promise.all([
    db.collection('bookings')
      .find({}, { projection: { id: 1, customerName: 1, serviceName: 1, status: 1, createdAt: 1, scheduledAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray(),
    db.collection('service_payments')
      .find({}, { projection: { amount: 1, status: 1, createdAt: 1, created_at: 1, verifiedAt: 1, service_name: 1 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray(),
  ]);

  const bookingNotifications = recentBookings.map((booking) => ({
    id: buildIdSequence(),
    type: 'booking',
    title: 'New Booking Update',
    message: `${toSafeString(booking?.customerName) || 'Customer'} - ${toSafeString(booking?.serviceName) || 'Service'} (${toSafeString(booking?.status) || 'pending'})`,
    icon: '📅',
    read: false,
    createdAt: (parseDateSafe(booking?.createdAt, booking?.scheduledAt) || new Date()).toISOString(),
  }));

  const paymentNotifications = recentPayments
    .filter((p) => ['success', 'paid', 'completed', 'captured'].includes(toLowerSafe(p?.status)))
    .map((payment) => ({
      id: buildIdSequence(),
      type: 'payment',
      title: 'Payment Received',
      message: `₹${Number(payment?.amount || 0).toLocaleString('en-IN')} received for ${toSafeString(payment?.service_name) || 'service'}`,
      icon: '💰',
      read: false,
      createdAt: (parseDateSafe(payment?.verifiedAt, payment?.created_at, payment?.createdAt) || new Date()).toISOString(),
    }));

  return [...paymentNotifications, ...bookingNotifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 12);
};

const buildFallbackUserNotifications = async (db, identity = {}) => {
  const bookingClauses = [];
  if (identity.numericUserId !== null) {
    bookingClauses.push(
      { userId: identity.numericUserId },
      { userId: String(identity.numericUserId) },
      { user_id: identity.numericUserId },
      { user_id: String(identity.numericUserId) },
      { userid: identity.numericUserId },
      { userid: String(identity.numericUserId) }
    );
  }
  if (identity.userObjectId) {
    bookingClauses.push(
      { userObjectId: identity.userObjectId },
      { userId: identity.userObjectId }
    );
  }
  if (identity.email) {
    bookingClauses.push({ email: identity.email });
  }
  if (identity.name) {
    bookingClauses.push({ customerName: identity.name });
  }

  const bookingFilter = bookingClauses.length ? { $or: bookingClauses } : {};
  const paymentFilter = identity.email ? { email: identity.email } : {};

  const [bookings, payments] = await Promise.all([
    db.collection('bookings')
      .find(bookingFilter, { projection: { id: 1, serviceName: 1, status: 1, paymentStatus: 1, createdAt: 1, scheduledAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
    db.collection('service_payments')
      .find(paymentFilter, { projection: { amount: 1, status: 1, createdAt: 1, created_at: 1, verifiedAt: 1, service_name: 1 } })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
  ]);

  const bookingNotifications = bookings.map((booking) => ({
    id: buildIdSequence(),
    type: 'booking',
    title: 'Booking Status Update',
    message: `${toSafeString(booking?.serviceName) || 'Service'} is ${toSafeString(booking?.status) || 'scheduled'}`,
    icon: '📅',
    read: false,
    createdAt: (parseDateSafe(booking?.createdAt, booking?.scheduledAt) || new Date()).toISOString(),
  }));

  const paymentNotifications = payments
    .filter((payment) => ['success', 'paid', 'completed', 'captured'].includes(toLowerSafe(payment?.status)))
    .map((payment) => ({
      id: buildIdSequence(),
      type: 'payment',
      title: 'Payment Successful',
      message: `₹${Number(payment?.amount || 0).toLocaleString('en-IN')} paid for ${toSafeString(payment?.service_name) || 'service'}`,
      icon: '💳',
      read: false,
      createdAt: (parseDateSafe(payment?.verifiedAt, payment?.created_at, payment?.createdAt) || new Date()).toISOString(),
    }));

  return [...paymentNotifications, ...bookingNotifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 12);
};

exports.listAllNotifications = async (req, res, next) => {
  try {
    const db = getDB();
    const records = await db.collection('notifications').find().sort({ id: -1 }).toArray();
    return res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    return next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = Number(req.params.userId);
    const { read } = req.query;
    const filter = { userId };

    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const userNotifications = await db.collection('notifications').find(filter).sort({ id: -1 }).toArray();
    return res.json({ success: true, data: userNotifications });
  } catch (error) {
    return next(error);
  }
};

exports.getMyNotifications = async (req, res, next) => {
  try {
    const db = getDB();
    const identity = resolveUserIdentity(req.user);
    const ownerFilter = buildNotificationOwnerFilter(identity);
    const records = await db.collection('notifications').find(ownerFilter).sort({ id: -1 }).toArray();

    if (records.length > 0) {
      return res.json({ success: true, data: records, count: records.length });
    }

    const role = toLowerSafe(req.user?.role);
    const fallbackNotifications = role === 'admin'
      ? await buildFallbackAdminNotifications(db)
      : await buildFallbackUserNotifications(db, identity);

    return res.json({ success: true, data: fallbackNotifications, count: fallbackNotifications.length });
  } catch (error) {
    return next(error);
  }
};

exports.sendNotification = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId, message, type, title } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const newNotification = {
      id: await getNextNotificationId(db),
      userId: Number(userId),
      title,
      message,
      type: type || 'general',
      read: false,
      createdAt: new Date().toISOString()
    };

    await db.collection('notifications').insertOne(newNotification);
    return res.status(201).json({ success: true, data: newNotification });
  } catch (error) {
    return next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const result = await db.collection('notifications').updateOne(
      { id },
      {
        $set: {
          read: true,
          readAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = await db.collection('notifications').findOne({ id });
    return res.json({ success: true, data: notification });
  } catch (error) {
    return next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const db = getDB();
    const identity = resolveUserIdentity(req.user);
    const ownerFilter = buildNotificationOwnerFilter(identity);

    await db.collection('notifications').updateMany(
      { ...ownerFilter, read: false },
      {
        $set: {
          read: true,
          readAt: new Date().toISOString()
        }
      }
    );

    const records = await db.collection('notifications').find(ownerFilter).sort({ id: -1 }).toArray();
    return res.json({ success: true, message: 'All notifications marked as read', data: records });
  } catch (error) {
    return next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const notification = await db.collection('notifications').findOne({ id });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await db.collection('notifications').deleteOne({ id });
    return res.json({ success: true, message: 'Notification deleted', data: notification });
  } catch (error) {
    return next(error);
  }
};

exports.sendEmailNotification = async (req, res, next) => {
  try {
    const db = getDB();
    const { email, subject, message, userId } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'email, subject, and message are required' });
    }

    const emailNotification = {
      id: `EMAIL-${Date.now()}`,
      email,
      subject,
      message,
      userId,
      status: 'sent',
      sentAt: new Date().toISOString()
    };

    await db.collection('notification_logs').insertOne({ channel: 'email', ...emailNotification });
    return res.status(201).json({ message: 'Email notification sent', notification: emailNotification });
  } catch (error) {
    return next(error);
  }
};

exports.sendSmsNotification = async (req, res, next) => {
  try {
    const db = getDB();
    const { phoneNumber, message, userId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'phoneNumber and message are required' });
    }

    const smsNotification = {
      id: `SMS-${Date.now()}`,
      phoneNumber,
      message,
      userId,
      status: 'sent',
      sentAt: new Date().toISOString()
    };

    await db.collection('notification_logs').insertOne({ channel: 'sms', ...smsNotification });
    return res.status(201).json({ message: 'SMS notification sent', notification: smsNotification });
  } catch (error) {
    return next(error);
  }
};
