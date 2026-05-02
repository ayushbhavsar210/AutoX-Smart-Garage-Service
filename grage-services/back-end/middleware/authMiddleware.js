const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const isTruthyVerificationValue = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return value === true || value === 1 || normalized === 'true' || normalized === '1' || normalized === 'active';
};

const auth = async (req, res, next) => {
  try {

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, "qweuansdasdg123123");

    const db = getDB();

    const candidateFilters = [];
    const decodedId = String(decoded?.id || '').trim();
    const decodedEmail = String(decoded?.email || '').trim().toLowerCase();

    if (decodedId) {
      if (ObjectId.isValid(decodedId) && String(new ObjectId(decodedId)) === decodedId) {
        candidateFilters.push({ _id: new ObjectId(decodedId) });
      }

      const numericId = Number(decodedId);
      if (Number.isFinite(numericId)) {
        candidateFilters.push({ userId: numericId }, { userId: String(numericId) });
      }

      candidateFilters.push(
        { userId: decodedId },
        { user_id: decodedId },
        { userid: decodedId },
        { userObjectId: decodedId }
      );
    }

    if (decodedEmail) {
      candidateFilters.push({ email: { $regex: `^${decodedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    }

    const userQuery = candidateFilters.length ? { $or: candidateFilters } : { _id: null };
    const user = await db.collection("users").findOne(userQuery);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    const role = String(user.role || '').trim().toLowerCase();
    const hasStatusField = user.status !== undefined && user.status !== null && String(user.status).trim() !== '';
    const hasIsActiveField = user.isActive !== undefined && user.isActive !== null;

    const statusActive = isTruthyVerificationValue(user.status);
    const isActiveFieldActive = isTruthyVerificationValue(user.isActive);

    let isAccountActive = true;
    if (role !== 'admin') {
      if (hasStatusField && hasIsActiveField) {
        isAccountActive = statusActive || isActiveFieldActive;
      } else if (hasStatusField) {
        isAccountActive = statusActive;
      } else if (hasIsActiveField) {
        isAccountActive = user.isActive !== false;
      }
    }

    if (!isAccountActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    delete user.password;
    delete user.passwordHash;

    req.user = user;

    next();

  } catch (error) {

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });

  }
};

module.exports = auth;