const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password, passwordHash, ...safe } = user;
  return safe;
};

const findUserFilter = (id) => {
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
    return { _id: new ObjectId(id) };
  }
  const numId = Number(id);
  if (Number.isFinite(numId)) {
    return { userId: numId };
  }
  return { _id: new ObjectId(id) };
};

const getUsers = async (req, res, next) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find().toArray();
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne(findUserFilter(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, email, password, role, phone } = req.body;
    const [lastUser] = await db
      .collection('users')
      .find({ userId: { $type: 'number' } })
      .sort({ userId: -1 })
      .limit(1)
      .toArray();
    const nextUserId = (lastUser?.userId || 0) + 1;
    const user = {
      userId: nextUserId,
      name,
      email: String(email).toLowerCase(),
      password,
      phone: phone || '',
      role: role || 'user',
      createdAt: new Date().toISOString()
    };
    await db.collection('users').insertOne(user);
    res.status(201).json({
      success: true,
      message: 'User created',
      data: { id: user.userId, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, email, phone, role } = req.body;
    const safeUpdates = {};
    if (name !== undefined) safeUpdates.name = name;
    if (email !== undefined) safeUpdates.email = String(email).toLowerCase();
    if (phone !== undefined) safeUpdates.phone = phone;
    if (role !== undefined) safeUpdates.role = role;
    const result = await db.collection("users").updateOne(
      findUserFilter(req.params.id),
      { $set: safeUpdates }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User updated" });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await db.collection("users").deleteOne(findUserFilter(req.params.id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = req.user.id || req.user._id;
    const user = await db.collection("users").findOne(findUserFilter(userId));
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = req.user.id || req.user._id;
    const { name, email, phone } = req.body;
    const safeUpdates = {};
    if (name !== undefined) safeUpdates.name = name;
    if (email !== undefined) safeUpdates.email = String(email).toLowerCase();
    if (phone !== undefined) safeUpdates.phone = phone;
    const result = await db.collection("users").updateOne(
      findUserFilter(userId),
      { $set: safeUpdates }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe
};
