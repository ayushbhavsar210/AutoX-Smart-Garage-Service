const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const role = String(req.user.role || '').trim().toLowerCase();
  if (!['admin', 'superadmin'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  return next();
};

module.exports = adminMiddleware;
