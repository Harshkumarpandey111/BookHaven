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
  if (!secret) {
    console.error('RAZORPAY_KEY_SECRET not configured');
    return false;
  }

  // Normalize inputs - remove whitespace
  const normalizedOrderId = (orderId || '').trim();
  const normalizedPaymentId = (paymentId || '').trim();
  const normalizedSignature = (signature || '').trim();

  console.log('Verifying signature with:', { normalizedOrderId, normalizedPaymentId, signatureLength: normalizedSignature.length });

  const message = `${normalizedOrderId}|${normalizedPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  console.log('Expected signature:', expectedSignature);
  console.log('Received signature:', normalizedSignature);
  console.log('Signature match:', expectedSignature === normalizedSignature);

  return expectedSignature === normalizedSignature;
}

module.exports = {
  getRazorpayClient,
  createProviderOrder,
  verifyProviderSignature
};
