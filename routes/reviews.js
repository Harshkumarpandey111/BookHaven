const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Book = require('../models/Book');
const User = require('../models/User');
const Review = require('../models/Review');

router.post('/books/:id/reviews', protect, asyncHandler(async (req, res) => {
  const bookId = Number(req.params.id);
  const book = await Book.findOne({ id: bookId });
  if (!book) throw new AppError('Book not found', 404);

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  const rating = Number(req.body.rating);
  const comment = (req.body.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }
  if (comment.length < 3) {
    throw new AppError('Review comment is too short', 400);
  }

  const review = await Review.findOneAndUpdate(
    { user: req.user.id, bookId },
    {
      $set: {
        rating,
        comment
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, review });
  }

  req.flash('success', 'Your review has been saved');
  return res.redirect(`/books/${bookId}`);
}));

router.post('/books/:id/reviews/:reviewId/delete', protect, asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.reviewId, user: req.user.id });
  if (!review) throw new AppError('Review not found', 404);
  await Review.deleteOne({ _id: review._id });

  req.flash('success', 'Review deleted');
  return res.redirect(`/books/${req.params.id}`);
}));

module.exports = router;
