const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return req.cookies?.accessToken || null;
}

function isApiRequest(req) {
  return req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json');
}

async function optionalAuth(req, _res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return next();

    const role = String(user.role || 'user').toLowerCase();

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role
    };
    return next();
  } catch (_err) {
    return next();
  }
}

async function protect(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      if (isApiRequest(req)) return next(new AppError('Authentication required', 401));
      req.flash('error', 'Please login to continue');
      return res.redirect('/login');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select('-password');
    if (!user) {
      if (isApiRequest(req)) return next(new AppError('Invalid authentication token', 401));
      req.flash('error', 'Session expired. Please login again.');
      return res.redirect('/login');
    }

    const role = String(user.role || 'user').toLowerCase();

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role
    };

    return next();
  } catch (_err) {
    if (isApiRequest(req)) return next(new AppError('Invalid or expired token', 401));
    req.flash('error', 'Session expired. Please login again.');
    return res.redirect('/login');
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    const normalizedRole = String(req.user.role || '').toLowerCase();
    const allowedRoles = roles.map((role) => String(role || '').toLowerCase());
    if (!allowedRoles.includes(normalizedRole)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }
    return next();
  };
}

module.exports = {
  optionalAuth,
  protect,
  authorize
};
