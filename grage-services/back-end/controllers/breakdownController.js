const { getDB } = require('../config/db');
const sendEmail = require('../utils/sendEmail');

const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const buildBreakdownCreatedEmail = (call = {}) => `
  <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;color:#ffffff;padding:20px 24px;">
                <h2 style="margin:0;font-size:20px;">Breakdown Request Received</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;color:#1f2937;">
                <p style="margin:0 0 12px;">Hello <strong>${toText(call.customerName, 'Customer')}</strong>,</p>
                <p style="margin:0 0 14px;line-height:1.6;">We have received your breakdown request. Our team will contact you shortly.</p>
                <div style="border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;padding:14px;">
                  <p style="margin:0 0 8px;"><strong>Ticket No:</strong> ${toText(call.ticketNo, 'N/A')}</p>
                  <p style="margin:0 0 8px;"><strong>Location:</strong> ${toText(call.location, 'N/A')}</p>
                  <p style="margin:0 0 8px;"><strong>Issue:</strong> ${toText(call.description, 'N/A')}</p>
                  <p style="margin:0;"><strong>Contact:</strong> ${toText(call.phone, 'N/A')}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const getNextBreakdownId = async (db) => {
  const [last] = await db.collection('breakdown_calls').find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  return (last?.id || 0) + 1;
};

exports.createBreakdownCall = async (req, res, next) => {
  try {
    const {
      userId,
      location,
      description,
      vehicleId,
      latitude,
      longitude,
      customerName,
      phone,
      email,
      vehicle,
      status,
      mechanic,
      amount,
    } = req.body;
    const db = getDB();

    if (!location) {
      return res.status(400).json({ error: 'location is required' });
    }

    const normalizedUserId = Number(userId);
    const breakdownId = await getNextBreakdownId(db);
    const receiverEmail = toText(email) || toText(req.user?.email);

    const newCall = {
      id: breakdownId,
      ticketNo: `BRK-${String(breakdownId).padStart(4, '0')}`,
      userId: Number.isFinite(normalizedUserId) && normalizedUserId > 0 ? normalizedUserId : null,
      vehicleId,
      location,
      description,
      customerName: customerName || '',
      phone: phone || '',
      email: receiverEmail,
      vehicle: vehicle || '',
      latitude,
      longitude,
      status: status || 'pending',
      assignedMechanicName: mechanic || '',
      amount: amount || '',
      createdAt: new Date().toISOString()
    };

    await db.collection('breakdown_calls').insertOne(newCall);

    if (receiverEmail) {
      try {
        await sendEmail(
          receiverEmail,
          `AutoX Garage | Breakdown Request ${newCall.ticketNo}`,
          buildBreakdownCreatedEmail(newCall)
        );
      } catch (emailError) {
        console.error('BREAKDOWN EMAIL ERROR:', emailError?.message || emailError);
      }
    }

    return res.status(201).json({ success: true, data: newCall });
  } catch (error) {
    return next(error);
  }
};

exports.listBreakdownCalls = async (req, res, next) => {
  try {
    const db = getDB();
    const calls = await db.collection('breakdown_calls').find().sort({ id: -1 }).toArray();
    return res.json({ success: true, data: calls });
  } catch (error) {
    return next(error);
  }
};

exports.getBreakdownCall = async (req, res, next) => {
  try {
    const db = getDB();
    const call = await db.collection('breakdown_calls').findOne({ id: Number(req.params.id) });

    if (!call) {
      return res.status(404).json({ success: false, message: 'Breakdown call not found' });
    }

    return res.json({ success: true, data: call });
  } catch (error) {
    return next(error);
  }
};

exports.updateBreakdownStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const { status, assignedMechanicId, eta } = req.body;

    const updates = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (assignedMechanicId !== undefined) updates.assignedMechanicId = assignedMechanicId;
    if (eta !== undefined) updates.eta = eta;

    const result = await db.collection('breakdown_calls').updateOne({ id }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Breakdown call not found' });
    }

    const call = await db.collection('breakdown_calls').findOne({ id });
    return res.json({ success: true, data: call });
  } catch (error) {
    return next(error);
  }
};

exports.findNearestMechanic = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const db = getDB();
    const mechanics = await db
      .collection('mechanics')
      .find({ availability: true })
      .project({ _id: 0, mechanicId: 1, name: 1, rating: 1, availability: 1, distance: 1, eta: 1 })
      .sort({ distance: 1 })
      .limit(5)
      .toArray();

    return res.json({ success: true, data: mechanics });
  } catch (error) {
    return next(error);
  }
};
