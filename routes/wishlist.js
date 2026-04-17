const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');

router.get('/', protect, asyncHandler(async (req, res) => {
  const entries = await Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 });
  const wishlistedBooks = await Book.find({ id: { $in: entries.map((entry) => entry.bookId) } }).sort({ id: 1 });

  return res.render('wishlist', {
    title: 'My Wishlist',
    wishlistedBooks,
    entryCount: entries.length
  });
}));

router.post('/toggle/:bookId', protect, asyncHandler(async (req, res) => {
  const bookId = Number(req.params.bookId);
  const book = await Book.findOne({ id: bookId });
  if (!book) {
    return res.status(404).json({ success: false, message: 'Book not found' });
  }

  const existing = await Wishlist.findOne({ user: req.user.id, bookId });
  if (existing) {
    await Wishlist.deleteOne({ _id: existing._id });
    return res.json({ success: true, action: 'removed', message: 'Removed from wishlist' });
  }

  await Wishlist.create({ user: req.user.id, bookId });
  return res.json({ success: true, action: 'added', message: 'Added to wishlist' });
}));

router.post('/remove/:bookId', protect, asyncHandler(async (req, res) => {
  const bookId = Number(req.params.bookId);
  await Wishlist.deleteOne({ user: req.user.id, bookId });
  return res.redirect('/wishlist');
}));

module.exports = router;
