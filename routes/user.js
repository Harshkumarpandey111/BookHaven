const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const User    = require('../models/User');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue');
    return res.redirect('/login');
  }
  next();
}

// ── GET /user/dashboard ───────────────────────────────────────────────────────
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    // Fetch logged-in user from MongoDB
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    // Fetch full book objects for each list using $in operator
    // $in matches any document whose id field is in the given array
    const [readBooks, purchasedBooks, cartBooks] = await Promise.all([
      Book.find({ id: { $in: user.readBooks      } }),
      Book.find({ id: { $in: user.purchasedBooks } }),
      Book.find({ id: { $in: user.cart           } })
    ]);

    // Calculate cart total
    const cartTotal = cartBooks.reduce((sum, b) => sum + b.price, 0);

    res.render('dashboard', {
      user,
      readBooks,
      purchasedBooks,
      cartBooks,
      cartTotal,
      title: 'My Dashboard'
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.redirect('/');
  }
});

// ── POST /user/cart/remove/:id ────────────────────────────────────────────────
router.post('/cart/remove/:id', requireLogin, async (req, res) => {
  try {
    // $pull removes a specific value from an array
    await User.findByIdAndUpdate(
      req.session.user.id,
      { $pull: { cart: parseInt(req.params.id) } }
    );
    res.redirect('/user/dashboard');
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.redirect('/user/dashboard');
  }
});

module.exports = router;
