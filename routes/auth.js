const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');

// ── GET /register ─────────────────────────────────────────────────────────────
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { title: 'Register' });
});

// ── POST /register ────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirm } = req.body;

    // Validation
    if (!name || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }
    if (password !== confirm) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/register');
    }

    // Check duplicate email in MongoDB
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    // Create user — password hashed automatically by pre('save') hook in model
    const user = await User.create({ name, email, password });

    req.flash('success', 'Account created! Please login.');
    res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/register');
  }
});

// ── GET /login ────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: 'Login' });
});

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email (case-insensitive due to lowercase: true in schema)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Use the model's comparePassword method
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Store minimal info in session — NOT the password
    req.session.user = {
      id:    user._id.toString(),   // MongoDB ObjectId as string
      name:  user.name,
      email: user.email
    };

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
});

// ── GET /logout ───────────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
