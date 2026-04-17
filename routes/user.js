const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const User    = require('../models/User');
const ReadingProgress = require('../models/ReadingProgress');
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middlewares/auth.middleware');

// ── GET /user/dashboard ──────────────────────────────────────────────────────
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Fetch logged-in user from MongoDB
    const user = await User.findById(req.user.id);
    if (!user) {
      res.clearCookie('accessToken');
      return res.redirect('/login');
    }

    // Pagination settings for preview sections (show last 4 items)
    const previewLimit = 4;

    // Fetch full book objects for each list using $in operator
    // $in matches any document whose id field is in the given array
    const [readBooks, purchasedBooks, cartBooks, progressDocs, wishlistEntries] = await Promise.all([
      Book.find({ id: { $in: user.readBooks      } }).limit(previewLimit).sort({ _id: -1 }),
      Book.find({ id: { $in: user.purchasedBooks } }).limit(previewLimit).sort({ _id: -1 }),
      Book.find({ id: { $in: user.cart           } }), // Full cart (not paginated)
      ReadingProgress.find({ user: req.user.id }).select('bookId progressPercent lastReadAt').limit(previewLimit).sort({ lastReadAt: -1 }),
      Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(previewLimit)
    ]);

    const readingProgressMap = progressDocs.reduce((acc, p) => {
      acc[p.bookId] = {
        progressPercent: p.progressPercent,
        lastReadAt: p.lastReadAt
      };
      return acc;
    }, {});

    const wishlistedBooks = await Book.find({ id: { $in: wishlistEntries.map((entry) => entry.bookId) } }).sort({ id: 1 });

    // Calculate cart total
    const cartTotal = cartBooks.reduce((sum, b) => sum + b.price, 0);

    // Count totals for panel headers
    const totalReadBooks = user.readBooks.length;
    const totalPurchasedBooks = user.purchasedBooks.length;
    const totalWishlist = user.wishlist ? user.wishlist.length : 0;

    res.render('dashboard', {
      user,
      readBooks,
      purchasedBooks,
      cartBooks,
      wishlistedBooks,
      readingProgressMap,
      cartTotal,
      // Pagination metadata for preview sections
      totalReadBooks,
      totalPurchasedBooks,
      totalWishlist,
      showReadMoreRead: totalReadBooks > previewLimit,
      showReadMorePurchased: totalPurchasedBooks > previewLimit,
      showReadMoreWishlist: totalWishlist > previewLimit,
      title: 'My Dashboard'
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.redirect('/');
  }
});

// ── POST /user/cart/remove/:id ────────────────────────────────────────────────
router.post('/cart/remove/:id', protect, async (req, res) => {
  try {
    // $pull removes a specific value from an array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { cart: parseInt(req.params.id) } }
    );
    res.redirect('/user/dashboard');
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.redirect('/user/dashboard');
  }
});

module.exports = router;
