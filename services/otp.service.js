const crypto = require('crypto');
const EmailOtp = require('../models/EmailOtp');
const AppError = require('../utils/AppError');
const { sendOtpEmail } = require('./email.service');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function createAndSendOtp({ email, purpose, payload = {} }) {
  const normalizedEmail = email.toLowerCase();
  const otp = generateOtp();

  await EmailOtp.findOneAndUpdate(
    { email: normalizedEmail, purpose },
    {
      otpHash: hashOtp(otp),
      payload,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS)
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  await sendOtpEmail({ to: normalizedEmail, otp, purpose });
}

async function verifyOtp({ email, purpose, otp }) {
  const normalizedEmail = email.toLowerCase();

  const otpDoc = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose
  });

  if (!otpDoc) {
    throw new AppError('OTP not found. Please request a new OTP.', 400);
  }

  if (otpDoc.expiresAt.getTime() < Date.now()) {
    await otpDoc.deleteOne();
    throw new AppError('OTP expired. Please request a new OTP.', 400);
  }

  if (otpDoc.otpHash !== hashOtp(otp)) {
    otpDoc.attempts += 1;

    if (otpDoc.attempts >= MAX_ATTEMPTS) {
      await otpDoc.deleteOne();
      throw new AppError('Too many invalid attempts. Please request a new OTP.', 429);
    }

    await otpDoc.save();
    throw new AppError('Invalid OTP', 400);
  }

  const payload = otpDoc.payload || {};
  await otpDoc.deleteOne();

  return payload;
}

module.exports = {
  createAndSendOtp,
  verifyOtp
};
