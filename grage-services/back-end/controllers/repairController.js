const { getDB } = require('../config/db');

const getNextRepairId = async (db) => {
  const [last] = await db
    .collection('repairs')
    .find({ repairId: /^RP-\d+$/ })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const lastNumber = Number(last?.repairId?.split('-')[1] || 1000);
  return `RP-${lastNumber + 1}`;
};

const scheduleRepair = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      userId,
      name,
      phone,
      email,
      vehicle,
      registration,
      preferredDate,
      preferredTime,
      pickupDrop,
      issue
    } = req.body;

    const repair = {
      repairId: await getNextRepairId(db),
      userId: userId ? Number(userId) : null,
      name,
      phone,
      email,
      vehicle,
      registration,
      preferredDate,
      preferredTime,
      pickupDrop: Boolean(pickupDrop),
      issue,
      status: 'pending',
      eta: null,
      lastUpdate: 'Request received',
      createdAt: new Date().toISOString()
    };

    await db.collection('repairs').insertOne(repair);
    return res.status(201).json({
      success: true,
      message: 'Repair scheduled',
      data: repair
    });
  } catch (error) {
    return next(error);
  }
};

const getRepairStatus = async (req, res, next) => {
  try {
    const db = getDB();
    const { phone, ref, reg } = req.query;

    const query = {};
    if (ref) query.repairId = String(ref);
    if (phone) query.phone = String(phone);
    if (!ref && reg) query.registration = String(reg);

    if (!ref && !phone && !reg) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of phone, ref, or reg'
      });
    }

    const repair = await db.collection('repairs').findOne(query, { sort: { createdAt: -1 } });

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair ticket not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ticket: repair.repairId,
        status: repair.status,
        eta: repair.eta,
        lastUpdate: repair.lastUpdate,
        preferredDate: repair.preferredDate,
        preferredTime: repair.preferredTime
      }
    });
  } catch (error) {
    return next(error);
  }
};

const listAllRepairs = async (req, res, next) => {
  try {
    const db = getDB();
    const records = await db.collection('repairs').find().sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  scheduleRepair,
  getRepairStatus,
  listAllRepairs
};
