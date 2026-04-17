const crypto = require('crypto');
const Razorpay = require('razorpay');
const AppError = require('../utils/AppError');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError('Razorpay is not configured on server', 500);
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

async function createProviderOrder({ amount, receipt, notes }) {
  const razorpay = getRazorpayClient();
  return razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes
  });
}

function verifyProviderSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  getRazorpayClient,
  createProviderOrder,
  verifyProviderSignature
};
