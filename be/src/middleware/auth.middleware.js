const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || req.query?.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    // Short-lived tokens issued for a purpose (e.g. the 2FA step) are never valid sessions
    if (decoded.purpose) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    req.user = decoded;
    if (req.user.userId && !req.user.id) {
      req.user.id = req.user.userId;
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};

const isAdminOrProduction = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'production')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin or Production access required' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isAdminOrProduction,
};
