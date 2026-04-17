const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signAccessToken } = require('../utils/jwt');

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role
  };
}

async function registerUser(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: 'user'
  });

  return sanitizeUser(user);
}

async function loginUser(payload) {
  const user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user || !(await user.comparePassword(payload.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const safeUser = sanitizeUser(user);
  const accessToken = signAccessToken(safeUser);

  return {
    user: safeUser,
    accessToken
  };
}

module.exports = {
  registerUser,
  loginUser,
  sanitizeUser
};
