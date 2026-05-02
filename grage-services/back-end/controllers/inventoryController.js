const { getDB } = require('../config/db');

const getNextId = async (db, collectionName) => {
  const [last] = await db.collection(collectionName).find({ id: { $type: 'number' } }).sort({ id: -1 }).limit(1).toArray();
  return (last?.id || 0) + 1;
};

exports.listInventory = async (req, res, next) => {
  try {
    const db = getDB();
    const inventory = await db.collection('inventory').find().sort({ id: -1 }).toArray();
    return res.json({ success: true, data: inventory });
  } catch (error) {
    return next(error);
  }
};

exports.addPart = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, category, purchasePrice, sellingPrice, price, stock, minStock, supplier, description, image } = req.body;

    if (!name || stock === undefined) {
      return res.status(400).json({ error: 'name and stock are required' });
    }

    const newPart = {
      id: await getNextId(db, 'inventory'),
      name,
      category: category || '',
      purchasePrice: Number(purchasePrice || price || 0),
      sellingPrice: Number(sellingPrice || price || 0),
      price: Number(sellingPrice || price || 0),
      stock: Number(stock),
      minStock: Number(minStock || 5),
      supplier: supplier || '',
      description: description || '',
      image: image || '',
      active: true,
      createdAt: new Date().toISOString()
    };

    await db.collection('inventory').insertOne(newPart);

    // Log stock history
    await db.collection('stock_history').insertOne({
      id: await getNextId(db, 'stock_history'),
      partId: newPart.id,
      partName: newPart.name,
      action: 'Added',
      quantityChange: Number(stock),
      stockAfter: Number(stock),
      note: 'Initial stock entry',
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ success: true, data: newPart });
  } catch (error) {
    return next(error);
  }
};

exports.updatePart = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const { stock, price, name, category, purchasePrice, sellingPrice, minStock, supplier, description, image, active } = req.body;
    const updates = { updatedAt: new Date().toISOString() };

    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (purchasePrice !== undefined) updates.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) { updates.sellingPrice = Number(sellingPrice); updates.price = Number(sellingPrice); }
    if (price !== undefined && sellingPrice === undefined) { updates.price = Number(price); updates.sellingPrice = Number(price); }
    if (stock !== undefined) updates.stock = Number(stock);
    if (minStock !== undefined) updates.minStock = Number(minStock);
    if (supplier !== undefined) updates.supplier = supplier;
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (active !== undefined) updates.active = active;

    const oldPart = await db.collection('inventory').findOne({ id });
    if (!oldPart) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Log stock change if stock was updated
    if (stock !== undefined && Number(stock) !== Number(oldPart.stock)) {
      const diff = Number(stock) - Number(oldPart.stock);
      await db.collection('stock_history').insertOne({
        id: await getNextId(db, 'stock_history'),
        partId: id,
        partName: oldPart.name,
        action: diff > 0 ? 'Added' : 'Adjusted',
        quantityChange: diff,
        stockAfter: Number(stock),
        note: 'Manual stock update',
        createdAt: new Date().toISOString()
      });
    }

    await db.collection('inventory').updateOne({ id }, { $set: updates });
    const part = await db.collection('inventory').findOne({ id });
    return res.json({ success: true, data: part });
  } catch (error) {
    return next(error);
  }
};

exports.deletePart = async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);
    const part = await db.collection('inventory').findOne({ id });
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    await db.collection('inventory').deleteOne({ id });
    return res.json({ success: true, message: 'Part deleted', data: part });
  } catch (error) {
    return next(error);
  }
};

exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const db = getDB();
    const allItems = await db.collection('inventory').find().toArray();
    const lowStockItems = allItems.filter((item) => Number(item.stock) <= Number(item.minStock || 5));

    return res.json({
      success: true,
      message: lowStockItems.length === 0 ? 'No low stock items' : `${lowStockItems.length} items running low on stock`,
      data: lowStockItems
    });
  } catch (error) {
    return next(error);
  }
};

// Stock history log
exports.getStockHistory = async (req, res, next) => {
  try {
    const db = getDB();
    const { partId } = req.query;
    const filter = {};
    if (partId) filter.partId = Number(partId);
    const history = await db.collection('stock_history').find(filter).sort({ id: -1 }).limit(200).toArray();
    return res.json({ success: true, data: history });
  } catch (error) {
    return next(error);
  }
};

// Use part in service — deducts stock and logs history
exports.usePartInService = async (req, res, next) => {
  try {
    const db = getDB();
    const { partId, quantity, serviceId, customerName } = req.body;

    if (!partId || !quantity) {
      return res.status(400).json({ error: 'partId and quantity are required' });
    }

    const part = await db.collection('inventory').findOne({ id: Number(partId) });
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const qty = Number(quantity);
    if (qty > Number(part.stock)) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const newStock = Number(part.stock) - qty;
    await db.collection('inventory').updateOne({ id: Number(partId) }, { $set: { stock: newStock, updatedAt: new Date().toISOString() } });

    await db.collection('stock_history').insertOne({
      id: await getNextId(db, 'stock_history'),
      partId: Number(partId),
      partName: part.name,
      action: 'Used in Service',
      quantityChange: -qty,
      stockAfter: newStock,
      serviceId: serviceId || null,
      customerName: customerName || '',
      note: serviceId ? `Used in service #${serviceId}` : 'Used in service',
      createdAt: new Date().toISOString()
    });

    const updatedPart = await db.collection('inventory').findOne({ id: Number(partId) });
    return res.json({ success: true, data: updatedPart });
  } catch (error) {
    return next(error);
  }
};

// Inventory reports
exports.getInventoryReport = async (req, res, next) => {
  try {
    const db = getDB();
    const inventory = await db.collection('inventory').find().sort({ id: -1 }).toArray();
    const stockHistory = await db.collection('stock_history').find().sort({ id: -1 }).toArray();

    const totalParts = inventory.length;
    const inStock = inventory.filter(i => Number(i.stock) > Number(i.minStock || 5)).length;
    const lowStock = inventory.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.minStock || 5)).length;
    const outOfStock = inventory.filter(i => Number(i.stock) <= 0).length;
    const totalValue = inventory.reduce((s, i) => s + (Number(i.sellingPrice || i.price || 0) * Number(i.stock || 0)), 0);
    const totalCost = inventory.reduce((s, i) => s + (Number(i.purchasePrice || i.price || 0) * Number(i.stock || 0)), 0);

    // Most used parts — aggregate from stock_history
    const usageMap = {};
    stockHistory.filter(h => h.action === 'Used in Service').forEach(h => {
      const key = h.partId;
      if (!usageMap[key]) usageMap[key] = { partId: key, partName: h.partName, totalUsed: 0 };
      usageMap[key].totalUsed += Math.abs(h.quantityChange || 0);
    });
    const mostUsed = Object.values(usageMap).sort((a, b) => b.totalUsed - a.totalUsed).slice(0, 10);

    return res.json({
      success: true,
      data: { totalParts, inStock, lowStock, outOfStock, totalValue, totalCost, mostUsed, inventory }
    });
  } catch (error) {
    return next(error);
  }
};

exports.createPartOrder = async (req, res, next) => {
  try {
    const db = getDB();
    const { partId, quantity, supplier } = req.body;

    if (!partId || !quantity || !supplier) {
      return res.status(400).json({ error: 'partId, quantity, and supplier are required' });
    }

    const part = await db.collection('inventory').findOne({ id: Number(partId) });
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const newOrder = {
      id: await getNextId(db, 'part_orders'),
      partId: Number(partId),
      partName: part.name,
      quantity: Number(quantity),
      supplier,
      status: 'ordered',
      createdAt: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };

    await db.collection('part_orders').insertOne(newOrder);
    return res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    return next(error);
  }
};
