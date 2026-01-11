const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Require Admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Require Waiter role or higher
const requireWaiter = (req, res, next) => {
  if (!['ADMIN', 'WAITER'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Waiter access required' });
  }
  next();
};

// Require Kitchen role or higher
const requireKitchen = (req, res, next) => {
  if (!['ADMIN', 'KITCHEN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Kitchen access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireWaiter,
  requireKitchen,
};