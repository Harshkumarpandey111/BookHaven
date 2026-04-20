const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signAccessToken } = require('../utils/jwt');
const otpService = require('./otp.service');
const { sendWelcomeEmail } = require('./email.service');
const Notification = require('../models/Notification');

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role
  };
}

async function startRegistration(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  await otpService.createAndSendOtp({
    email: payload.email,
    purpose: 'register',
    payload: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: payload.password
    }
  });

  return { email: payload.email.toLowerCase() };
}

async function verifyRegistrationOtp(payload) {
  const verifiedPayload = await otpService.verifyOtp({
    email: payload.email,
    purpose: 'register',
    otp: payload.otp
  });

  const existing = await User.findOne({ email: verifiedPayload.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    name: verifiedPayload.name,
    email: verifiedPayload.email,
    password: verifiedPayload.password,
    role: 'user'
  });

  const safeUser = sanitizeUser(user);
  const accessToken = signAccessToken(safeUser);

  // Send welcome email and create welcome notification (fire-and-forget)
  sendWelcomeEmail({ to: user.email, name: user.name });
  Notification.create({
    user: user._id,
    type: 'welcome',
    title: 'Welcome to BookHaven! 🎉',
    message: `Hi ${user.name}, your account is ready. Start exploring our library of Indian and world classics.`,
    link: '/books'
  }).catch(() => {});

  return {
    user: safeUser,
    accessToken
  };
}

async function startPasswordReset(payload) {
  const user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    return { email: payload.email.toLowerCase() };
  }

  await otpService.createAndSendOtp({
    email: user.email,
    purpose: 'reset_password',
    payload: { userId: user._id.toString() }
  });

  return { email: user.email };
}

async function resetPasswordWithOtp(payload) {
  const verifiedPayload = await otpService.verifyOtp({
    email: payload.email,
    purpose: 'reset_password',
    otp: payload.otp
  });

  const user = await User.findById(verifiedPayload.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = payload.password;
  await user.save();
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
  startRegistration,
  verifyRegistrationOtp,
  startPasswordReset,
  resetPasswordWithOtp,
  loginUser,
  sanitizeUser
};
