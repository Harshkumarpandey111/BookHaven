const mongoose = require('mongoose');
const crypto = require('crypto');

const readingListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'List name is required'],
    trim: true,
    maxlength: 80
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 300
  },
  books: {
    type: [Number],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareSlug: {
    type: String,
    unique: true,
    sparse: true,
    default: () => crypto.randomBytes(6).toString('hex')
  }
}, {
  timestamps: true
});

readingListSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ReadingList', readingListSchema);
