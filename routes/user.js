const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const User    = require('../models/User');
const ReadingProgress = require('../models/ReadingProgress');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const Order = require('../models/Order');
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

    // ── Reading Statistics ──
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [booksThisMonth, userReviews, paidOrders] = await Promise.all([
      ReadingProgress.countDocuments({ user: req.user.id, lastReadAt: { $gte: monthStart } }),
      Review.find({ user: req.user.id }).select('rating'),
      Order.find({ user: req.user.id, status: 'paid' }).select('amount books paidAt receipt razorpayPaymentId _id').sort({ paidAt: -1 })
    ]);

    const avgRating = userReviews.length > 0
      ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
      : '—';

    const totalSpent = paidOrders.reduce((sum, o) => sum + (o.amount / 100), 0);

    // Top genre
    let topGenre = '—';
    if (user.readBooks.length > 0) {
      const genreCounts = await Book.aggregate([
        { $match: { id: { $in: user.readBooks } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      if (genreCounts.length > 0) topGenre = genreCounts[0]._id;
    }

    const readingStats = {
      booksThisMonth,
      avgRating,
      topGenre,
      totalSpent: totalSpent.toFixed(0)
    };

    res.render('dashboard', {
      user,
      readBooks,
      purchasedBooks,
      cartBooks,
      wishlistedBooks,
      readingProgressMap,
      cartTotal,
      readingStats,
      paidOrders,
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
