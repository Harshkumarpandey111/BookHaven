const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Keep the numeric id from JSON so existing routes still work
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  pages: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  },
  preview: {
    type: String,
    default: ''
  },
  fullText: {
    type: String,
    default: ''
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  origin: {
    type: String,
    enum: ['Indian', 'Foreign'],
    required: true
  }
}, {
  timestamps: true
});

// Text index for search — lets us do fast text searches on title + author
bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
