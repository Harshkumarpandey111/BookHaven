const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookId: {
    type: Number,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 1000
  }
}, {
  timestamps: true
});

reviewSchema.index({ bookId: 1, createdAt: -1 });
reviewSchema.index({ user: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
