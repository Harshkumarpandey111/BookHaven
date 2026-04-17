const express = require('express');
const router = express.Router();

const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { createProviderOrder, verifyProviderSignature } = require('../services/payment.service');

router.post('/create-order', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const reqBookIds = Array.isArray(req.body.bookIds)
    ? req.body.bookIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
    : [];

  const sourceBookIds = reqBookIds.length > 0 ? reqBookIds : user.cart;
  const uniqueBookIds = [...new Set(sourceBookIds)];
  const payableBookIds = uniqueBookIds.filter((id) => !user.purchasedBooks.includes(id));

  if (payableBookIds.length === 0) {
    throw new AppError('No payable books found. Your cart may already be purchased.', 400);
  }

  const books = await Book.find({ id: { $in: payableBookIds } });
  if (books.length === 0) {
    throw new AppError('No valid books found for payment', 404);
  }

  const amountRupees = books.reduce((sum, b) => sum + Number(b.price || 0), 0);
  const amountPaise = Math.round(amountRupees * 100);

  if (amountPaise <= 0) {
    throw new AppError('Order amount must be greater than zero', 400);
  }

  const receipt = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const orderDoc = await Order.create({
    user: user._id,
    books: books.map((b) => b.id),
    amount: amountPaise,
    currency: 'INR',
    status: 'created',
    receipt
  });

  const providerOrder = await createProviderOrder({
    amount: amountPaise,
    receipt,
    notes: {
      userId: user._id.toString(),
      orderId: orderDoc._id.toString()
    }
  });

  orderDoc.razorpayOrderId = providerOrder.id;
  await orderDoc.save();

  return res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
    order: providerOrder,
    amount: amountPaise,
    currency: 'INR',
    books: books.map((b) => ({ id: b.id, title: b.title, price: b.price }))
  });
}));

router.post('/verify', protect, asyncHandler(async (req, res) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Missing payment verification fields', 400);
  }

  const orderDoc = await Order.findOne({ razorpayOrderId, user: req.user.id });
  if (!orderDoc) {
    throw new AppError('Order not found for verification', 404);
  }

  if (orderDoc.status === 'paid') {
    return res.json({ success: true, message: 'Payment already verified' });
  }

  const signatureValid = verifyProviderSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!signatureValid) {
    orderDoc.status = 'failed';
    await orderDoc.save();
    throw new AppError('Invalid payment signature', 400);
  }

  orderDoc.status = 'paid';
  orderDoc.razorpayPaymentId = razorpayPaymentId;
  orderDoc.razorpaySignature = razorpaySignature;
  orderDoc.paidAt = new Date();
  await orderDoc.save();

  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { purchasedBooks: { $each: orderDoc.books } },
    $pull: { cart: { $in: orderDoc.books } }
  });

  return res.json({ success: true, message: 'Payment verified and books unlocked' });
}));

module.exports = router;
