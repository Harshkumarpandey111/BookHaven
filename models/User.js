const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  // Arrays store book IDs (numbers) — same as before but now in MongoDB
  readBooks: {
    type: [Number],
    default: []
  },
  purchasedBooks: {
    type: [Number],
    default: []
  },
  cart: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true   // adds createdAt and updatedAt automatically
});

// Hash password BEFORE saving — Mongoose 9: async hooks don't use next()
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method to compare password at login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
