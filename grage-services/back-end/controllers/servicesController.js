const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { getPaginationParams, buildProjection, formatPaginatedResponse } = require('../utils/queryOptimization');

const getNextServiceId = async (db) => {
  const [lastService] = await db
    .collection('services')
    .find({ id: { $type: 'number' } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  return (lastService?.id || 0) + 1;
};

const getServices = async (req, res, next) => {
  try {
    const db = getDB();
    const { page, limit, skip } = getPaginationParams(req.query);

    // Fields to return for listing (exclude large/unnecessary fields)
    const projection = buildProjection([
      'id', 'name', 'description', 'category', 'price', 'duration', 'image', 'createdAt'
    ]);

    const total = await db.collection('services').countDocuments();
    const services = await db
      .collection('services')
      .find()
      .project(projection)
      .sort({ id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return res.status(200).json(formatPaginatedResponse(services, total, page, limit));
  } catch (error) {
    return next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const db = getDB();
    const raw = req.params.id;
    let service = null;

    // Try numeric id first
    const numId = Number(raw);
    if (Number.isFinite(numId)) {
      service = await db.collection('services').findOne({ id: numId });
    }

    // Fallback: try as MongoDB ObjectId
    if (!service && ObjectId.isValid(raw)) {
      service = await db.collection('services').findOne({ _id: new ObjectId(raw) });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    return next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, basePrice, price, description, category, active, icon, features, estimatedDurationMinutes } = req.body;

    const service = {
      id: await getNextServiceId(db),
      name,
      basePrice: Number(basePrice) || Number(price) || 0,
      description,
      category: category || 'general',
      active: active !== false,
      icon: icon || '🔧',
      features: Array.isArray(features) ? features : [],
      estimatedDurationMinutes: estimatedDurationMinutes || null,
      createdAt: new Date().toISOString()
    };

    await db.collection('services').insertOne(service);

    return res.status(201).json({
      success: true,
      message: 'Service created',
      data: service
    });
  } catch (error) {
    return next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const db = getDB();
    const raw = req.params.id;
    const { name, basePrice, price, description, category, active, icon, features, estimatedDurationMinutes } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (basePrice !== undefined) updates.basePrice = Number(basePrice);
    else if (price !== undefined) updates.basePrice = Number(price);
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (active !== undefined) updates.active = active;
    if (icon !== undefined) updates.icon = icon;
    if (features !== undefined) updates.features = Array.isArray(features) ? features : [];
    if (estimatedDurationMinutes !== undefined) updates.estimatedDurationMinutes = estimatedDurationMinutes;
    updates.updatedAt = new Date().toISOString();

    // Support both numeric id and ObjectId
    let filter = {};
    const numId = Number(raw);
    if (Number.isFinite(numId) && numId > 0) {
      filter = { id: numId };
    } else if (ObjectId.isValid(raw)) {
      filter = { _id: new ObjectId(raw) };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }

    const result = await db.collection('services').updateOne(filter, { $set: updates });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const service = await db.collection('services').findOne(filter);
    return res.status(200).json({
      success: true,
      message: 'Service updated',
      data: service
    });
  } catch (error) {
    return next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const db = getDB();
    const raw = req.params.id;

    let filter = {};
    const numId = Number(raw);
    if (Number.isFinite(numId) && numId > 0) {
      filter = { id: numId };
    } else if (ObjectId.isValid(raw)) {
      filter = { _id: new ObjectId(raw) };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }

    const result = await db.collection('services').deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Service deleted'
    });
  } catch (error) {
    return next(error);
  }
};

const searchServices = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const db = getDB();
    const regex = new RegExp(String(query), 'i');
    const results = await db
      .collection('services')
      .find({ $or: [{ name: regex }, { description: regex }] })
      .toArray();

    return res.status(200).json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    return next(error);
  }
};

const getServicesByCategory = async (req, res, next) => {
  try {
    const db = getDB();
    const { category } = req.params;
    const results = await db.collection('services').find({ category }).toArray();

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No services found in this category'
      });
    }

    return res.status(200).json({
      success: true,
      data: results,
      count: results.length,
      category
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  searchServices,
  getServicesByCategory
};
