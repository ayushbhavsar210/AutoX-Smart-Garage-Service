const { getDB } = require('../config/db');

const getNextMechanicId = async (db) => {
  const [last] = await db
    .collection('mechanics')
    .find({ id: { $type: 'number' } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  return (last?.id || 0) + 1;
};

const listMechanics = async (req, res, next) => {
  try {
    const db = getDB();
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = String(status);

    const records = await db.collection('mechanics').find(filter).sort({ id: -1 }).toArray();
    return res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    return next(error);
  }
};

const createMechanic = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, expertise, phone, experience, status, rating } = req.body;

    const mechanic = {
      id: await getNextMechanicId(db),
      name,
      expertise,
      phone,
      experience: experience || '',
      status: status || 'Available',
      rating: Number(rating || 0),
      assignedJobs: 0,
      createdAt: new Date().toISOString()
    };

    await db.collection('mechanics').insertOne(mechanic);
    return res.status(201).json({ success: true, message: 'Mechanic added', data: mechanic });
  } catch (error) {
    return next(error);
  }
};

const updateMechanic = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);

    const result = await db.collection('mechanics').updateOne(
      { id },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Mechanic not found' });
    }

    const updated = await db.collection('mechanics').findOne({ id });
    return res.status(200).json({ success: true, message: 'Mechanic updated', data: updated });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listMechanics,
  createMechanic,
  updateMechanic
};
