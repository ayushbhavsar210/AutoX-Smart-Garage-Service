const { getDB } = require('../config/db');
const sendEmail = require('../utils/sendEmail');

const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const sendAssignmentEmail = async (to, subject, html) => {
  if (!to) return;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('ASSIGNMENT EMAIL ERROR:', error?.message || error);
  }
};

const buildAssignedTemplate = ({ customerName, serviceName, vehicle, mechanicName, bookingId }) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Staff Assigned</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(customerName, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">A staff member has been assigned for your service booking.</p>
        <p style="margin:0 0 8px;"><strong>Booking ID:</strong> ${toText(bookingId, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Service:</strong> ${toText(serviceName, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${toText(vehicle, 'N/A')}</p>
        <p style="margin:0;"><strong>Assigned Staff:</strong> ${toText(mechanicName, 'N/A')}</p>
      </div>
    </div>
  </div>
`;

const buildCompletedTemplate = ({ customerName, serviceName, vehicle, bookingId }) => `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Your Work Is Completed</h2></div>
      <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
        <p style="margin:0 0 12px;">Hello <strong>${toText(customerName, 'Customer')}</strong>,</p>
        <p style="margin:0 0 12px;">Your service work has been completed successfully.</p>
        <p style="margin:0 0 8px;"><strong>Booking ID:</strong> ${toText(bookingId, 'N/A')}</p>
        <p style="margin:0 0 8px;"><strong>Service:</strong> ${toText(serviceName, 'N/A')}</p>
        <p style="margin:0;"><strong>Vehicle:</strong> ${toText(vehicle, 'N/A')}</p>
      </div>
    </div>
  </div>
`;

const resolveBookingEmail = async (db, booking = {}) => {
  const bookingEmail = toText(booking.email).toLowerCase();
  if (bookingEmail) return bookingEmail;

  const numericUserId = Number(booking.userId ?? booking.user_id);
  const userObjectId = toText(booking.userObjectId || booking.userId);
  const userFilters = [];

  if (Number.isFinite(numericUserId) && numericUserId > 0) {
    userFilters.push({ userId: numericUserId }, { userId: String(numericUserId) });
  }
  if (userObjectId) {
    userFilters.push({ _id: userObjectId }, { userObjectId }, { userId: userObjectId });
  }

  if (!userFilters.length) return '';

  const user = await db.collection('users').findOne({ $or: userFilters });
  return toText(user?.email).toLowerCase();
};

const getNextAssignmentId = async (db) => {
  const [last] = await db.collection('assignments').find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  return (last?.id || 0) + 1;
};

const normalizeStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (['pending', 'assigned', 'open', 'scheduled'].includes(raw)) return 'assigned';
  if (['in progress', 'in-progress', 'in_progress'].includes(raw)) return 'in-progress';
  if (['completed', 'complete', 'done'].includes(raw)) return 'completed';
  return raw || 'assigned';
};

const toDisplayStatus = (value) => {
  const status = normalizeStatus(value);
  if (status === 'assigned') return 'Assigned';
  if (status === 'in-progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  return String(value || 'Assigned');
};

const toAssignmentRecord = (assignment = {}) => ({
  ...assignment,
  mechanic: assignment.mechanicName || assignment.mechanic || assignment.mechanicId || '—',
  customer: assignment.customerName || assignment.customer || '—',
  vehicle: assignment.vehicle || assignment.vehicleNumber || '—',
  service: assignment.service || assignment.serviceName || '—',
  job: assignment.notes || assignment.job || '—',
  status: toDisplayStatus(assignment.status),
  statusKey: normalizeStatus(assignment.status),
  startDate: assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString('en-IN') : '—',
  startTime: assignment.createdAt ? new Date(assignment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
  estimatedDuration: assignment.estimatedDuration || '—',
  progress: Array.isArray(assignment.progress) ? `${assignment.progress.length} steps` : (assignment.progress || '—'),
});

const bookingToAssignmentRecord = (booking = {}) => {
  const statusFromBooking = normalizeStatus(
    booking?.status === 'scheduled' ? 'assigned' : booking?.status
  );

  return toAssignmentRecord({
    id: booking.id,
    bookingId: Number(booking.id),
    mechanicId: booking.mechanicId,
    mechanicName: booking.mechanicName || '',
    customerName: booking.customerName || '',
    vehicle: booking.vehicleNumber || booking.vehicle || '',
    service: booking.serviceName || booking.serviceType || '',
    estimatedDuration: booking.estimatedDuration || '',
    phone: booking.phone || booking.mobile || '',
    notes: booking.notes || '',
    status: statusFromBooking,
    createdAt: booking.createdAt || booking.updatedAt || new Date().toISOString(),
    source: 'bookings',
  });
};

exports.getAllAssignments = async (req, res, next) => {
  try {
    const db = getDB();
    const [assignments, bookingAssignments] = await Promise.all([
      db.collection('assignments').find({}).toArray(),
      db.collection('bookings').find({
        $or: [
          { mechanicId: { $exists: true, $ne: null } },
          { mechanicName: { $exists: true, $ne: '' } },
        ],
      }).toArray(),
    ]);

    const mappedAssignments = assignments.map(toAssignmentRecord);
    const mappedFromBookings = bookingAssignments.map(bookingToAssignmentRecord);

    // Prefer explicit assignment records when both sources exist for the same booking.
    const dedupe = new Map();
    mappedFromBookings.forEach((item) => {
      const key = Number(item.bookingId || item.id);
      dedupe.set(key, item);
    });
    mappedAssignments.forEach((item) => {
      const key = Number(item.bookingId || item.id);
      dedupe.set(key, item);
    });

    const combined = Array.from(dedupe.values()).sort((a, b) => {
      const t1 = new Date(b.createdAt || 0).getTime();
      const t2 = new Date(a.createdAt || 0).getTime();
      return t1 - t2;
    });

    return res.json({ success: true, data: combined });
  } catch (error) {
    return next(error);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const db = getDB();
    const { bookingId, mechanicId, notes, status, customerName, vehicle, service, estimatedDuration, phone, mechanicName } = req.body;

    if (!bookingId || !mechanicId) {
      return res.status(400).json({ error: 'bookingId and mechanicId are required' });
    }

    const newAssignment = {
      id: await getNextAssignmentId(db),
      bookingId: Number(bookingId),
      mechanicId: Number(mechanicId),
      mechanicName: mechanicName || '',
      customerName: customerName || '',
      vehicle: vehicle || '',
      service: service || '',
      estimatedDuration: estimatedDuration || '',
      phone: phone || '',
      notes,
      status: normalizeStatus(status),
      createdAt: new Date().toISOString()
    };

    await db.collection('assignments').insertOne(newAssignment);

    await db.collection('bookings').updateOne(
      { id: Number(bookingId) },
      {
        $set: {
          mechanicId: Number(mechanicId),
          mechanicName: mechanicName || '',
          status: normalizeStatus(status) === 'assigned' ? 'scheduled' : normalizeStatus(status),
          statusUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const linkedBooking = await db.collection('bookings').findOne({ id: Number(bookingId) });
    const receiverEmail = await resolveBookingEmail(db, linkedBooking || {});
    if (receiverEmail) {
      await sendAssignmentEmail(
        receiverEmail,
        'AutoX Garage | Staff Assigned For Your Booking',
        buildAssignedTemplate({
          customerName: linkedBooking?.customerName || customerName,
          serviceName: linkedBooking?.serviceName || service,
          vehicle: linkedBooking?.vehicleNumber || vehicle,
          mechanicName: linkedBooking?.mechanicName || mechanicName,
          bookingId,
        })
      );
    }

    return res.status(201).json({ success: true, data: toAssignmentRecord(newAssignment) });
  } catch (error) {
    return next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const db = getDB();
    const assignment = await db.collection('assignments').findOne({ id: Number(req.params.id) });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    return res.json({ success: true, data: assignment });
  } catch (error) {
    return next(error);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const { status, notes } = req.body;
    const existing = await db.collection('assignments').findOne({ id });
    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (status) updates.status = normalizeStatus(status);
    if (notes !== undefined) updates.notes = notes;

    await db.collection('assignments').updateOne({ id }, { $set: updates });

    const assignment = await db.collection('assignments').findOne({ id });

    const movedToCompleted =
      normalizeStatus(existing?.status) !== 'completed'
      && normalizeStatus(assignment?.status) === 'completed';

    if (movedToCompleted) {
      const linkedBooking = await db.collection('bookings').findOne({ id: Number(assignment?.bookingId) });
      const receiverEmail = await resolveBookingEmail(db, linkedBooking || {});

      if (receiverEmail) {
        await sendAssignmentEmail(
          receiverEmail,
          'AutoX Garage | Your Work Is Completed',
          buildCompletedTemplate({
            customerName: linkedBooking?.customerName || assignment?.customerName,
            serviceName: linkedBooking?.serviceName || assignment?.service,
            vehicle: linkedBooking?.vehicleNumber || assignment?.vehicle,
            bookingId: assignment?.bookingId,
          })
        );
      }
    }

    return res.json({ success: true, data: toAssignmentRecord(assignment) });
  } catch (error) {
    return next(error);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const assignment = await db.collection('assignments').findOne({ id });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await db.collection('assignments').deleteOne({ id });
    return res.json({ success: true, message: 'Assignment deleted', data: toAssignmentRecord(assignment) });
  } catch (error) {
    return next(error);
  }
};

exports.getMechanicAssignments = async (req, res, next) => {
  try {
    const db = getDB();
    const mechanicAssignments = await db.collection('assignments').find({ mechanicId: Number(req.params.mechanicId) }).toArray();

    return res.json({ success: true, data: mechanicAssignments.map(toAssignmentRecord) });
  } catch (error) {
    return next(error);
  }
};

exports.getJobProgress = async (req, res, next) => {
  try {
    const db = getDB();
    const assignment = await db.collection('assignments').findOne({ id: Number(req.params.id) });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const progress = {
      assignmentId: assignment.id,
      status: toDisplayStatus(assignment.status),
      timeline: [
        { stage: 'Assigned', completed: true, timestamp: assignment.createdAt },
        { stage: 'In Progress', completed: normalizeStatus(assignment.status) === 'in-progress' || normalizeStatus(assignment.status) === 'completed' },
        { stage: 'Completed', completed: normalizeStatus(assignment.status) === 'completed' }
      ]
    };

    return res.json({ success: true, data: progress });
  } catch (error) {
    return next(error);
  }
};
