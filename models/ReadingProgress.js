const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema({
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
  progressPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  scrollPosition: {
    type: Number,
    min: 0,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastReadAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

readingProgressSchema.index({ user: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
