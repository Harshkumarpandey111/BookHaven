const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const User    = require('../models/User');
const ReadingProgress = require('../models/ReadingProgress');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const { clampProgress, getPreviewContent } = require('../services/reading.service');
const { protect } = require('../middlewares/auth.middleware');

const PREVIEW_PERCENT = 12;

// ── GET /books  —  Browse with filters & pagination ────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, origin, availability, minRating, sort, page = '1', perPage = '12' } = req.query;

    // Pagination setup
    const pageNum = Math.max(1, parseInt(page) || 1);
    const perPageNum = Math.max(1, Math.min(50, parseInt(perPage) || 12)); // Cap at 50 per page
    const skip = (pageNum - 1) * perPageNum;

    // Build MongoDB query object dynamically
    const query = {};
    if (category) query.category = category;
    if (origin)   query.origin   = origin;
    if (search) {
      // Case-insensitive regex search on title OR author
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { author: regex }];
    }
    if (availability === 'free') query.price = 0;
    if (availability === 'paid') query.price = { $gt: 0 };
    if (minRating) query.rating = { $gte: Number(minRating) };

    const sortMap = {
      latest: { createdAt: -1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      ratingDesc: { rating: -1 },
      titleAsc: { title: 1 }
    };
    const sortQuery = sortMap[sort] || { id: 1 };

    // Fetch filtered books with pagination, all categories, and total count in parallel
    const [books, allBooks, totalBooks] = await Promise.all([
      Book.find(query).sort(sortQuery).skip(skip).limit(perPageNum),
      Book.find({}, 'category'),
      Book.countDocuments(query)
    ]);

    const wishlistedIds = req.user
      ? (await Wishlist.find({ user: req.user.id, bookId: { $in: books.map((book) => book.id) } }).select('bookId'))
          .map((entry) => entry.bookId)
      : [];

    const categories = [...new Set(allBooks.map(b => b.category))];
    
    // Pagination metadata
    const totalPages = Math.ceil(totalBooks / perPageNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.render('books', {
      books,
      categories,
      category: category || null,
      search:   search   || null,
      origin:   origin   || null,
      availability: availability || null,
      minRating: minRating || null,
      sort: sort || null,
      wishlistedIds,
      currentPage: pageNum,
      totalPages,
      perPage: perPageNum,
      totalBooks,
      hasNextPage,
      hasPrevPage,
      title: 'All Books'
    });
  } catch (err) {
    console.error('Books list error:', err);
    res.status(500).render('404', { title: 'Error' });
  }
});

// ── GET /books/:id  —  Book detail ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    // Find by numeric id field (not MongoDB _id)
    const book = await Book.findOne({ id: parseInt(req.params.id) });
    if (!book) return res.status(404).render('404', { title: 'Not Found' });

    // If logged in, fetch user data to check cart/purchased status
    let userData = null;
    let readingProgress = null;
    let wishlistEntry = null;
    let reviews = [];
    let reviewStats = { count: 0, average: 0 };
    if (req.user) {
      [userData, readingProgress, wishlistEntry] = await Promise.all([
        User.findById(req.user.id),
        ReadingProgress.findOne({ user: req.user.id, bookId: book.id }),
        Wishlist.findOne({ user: req.user.id, bookId: book.id })
      ]);
    }

    const allReviews = await Review.find({ bookId: book.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name');

    if (allReviews.length > 0) {
      reviewStats = {
        count: allReviews.length,
        average: Number((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1))
      };
    }
    reviews = allReviews;

    const userReview = req.user
      ? await Review.findOne({ bookId: book.id, user: req.user.id })
      : null;

    res.render('book-detail', {
      book,
      userData,
      readingProgress,
      wishlistEntry,
      reviews,
      reviewStats,
      userReview,
      previewPercent: PREVIEW_PERCENT,
      title: book.title
    });
  } catch (err) {
    console.error('Book detail error:', err);
    res.status(500).render('404', { title: 'Error' });
  }
});

// ── GET /books/:id/read  —  Open reader ──────────────────────────────────────
router.get('/:id/read', protect, async (req, res) => {
  try {
    const book = await Book.findOne({ id: parseInt(req.params.id) });
    if (!book) return res.status(404).render('404', { title: 'Not Found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).render('404', { title: 'Not Found' });

    const hasFullAccess = user.purchasedBooks.includes(book.id);
    const progressDoc = await ReadingProgress.findOne({ user: req.user.id, bookId: book.id });
    const readableText = hasFullAccess ? (book.fullText || '') : getPreviewContent(book.fullText || '', PREVIEW_PERCENT);

    // Add to reading history using MongoDB $addToSet (no duplicates automatically)
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { readBooks: book.id } }  // $addToSet only adds if not already there
    );

    res.render('read', {
      book,
      readableText,
      hasFullAccess,
      previewPercent: PREVIEW_PERCENT,
      progressPercent: progressDoc?.progressPercent || 0,
      scrollPosition: progressDoc?.scrollPosition || 0,
      title: `Reading: ${book.title}`
    });
  } catch (err) {
    console.error('Read error:', err);
    res.status(500).render('404', { title: 'Error' });
  }
});

// ── GET /books/:id/progress  —  Read saved progress ─────────────────────────
router.get('/:id/progress', protect, async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const progressDoc = await ReadingProgress.findOne({ user: req.user.id, bookId });
    return res.json({
      success: true,
      progressPercent: progressDoc?.progressPercent || 0,
      scrollPosition: progressDoc?.scrollPosition || 0
    });
  } catch (err) {
    console.error('Get progress error:', err);
    return res.status(500).json({ success: false, message: 'Could not load reading progress' });
  }
});

// ── POST /books/:id/progress  —  Save progress ───────────────────────────────
router.post('/:id/progress', protect, async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const book = await Book.findOne({ id: bookId });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const hasFullAccess = user.purchasedBooks.includes(bookId);
    const progressLimit = hasFullAccess ? 100 : PREVIEW_PERCENT;
    const progressPercent = Math.min(clampProgress(req.body.progressPercent), progressLimit);
    const scrollPosition = Math.max(0, Number(req.body.scrollPosition) || 0);

    const progressDoc = await ReadingProgress.findOneAndUpdate(
      { user: req.user.id, bookId },
      {
        $set: {
          progressPercent,
          scrollPosition,
          completed: hasFullAccess && progressPercent >= 98,
          lastReadAt: new Date()
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: {
        readBooks: bookId,
        readingProgress: progressDoc._id
      }
    });

    return res.json({ success: true, progressPercent: progressDoc.progressPercent });
  } catch (err) {
    console.error('Save progress error:', err);
    return res.status(500).json({ success: false, message: 'Could not save reading progress' });
  }
});

// ── POST /books/:id/buy  —  Add to cart ──────────────────────────────────────
router.post('/:id/buy', protect, async (req, res) => {
  try {
    const book = await Book.findOne({ id: parseInt(req.params.id) });
    if (!book) return res.json({ success: false, message: 'Book not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.json({ success: false, message: 'User not found' });

    // Check if already purchased
    if (user.purchasedBooks.includes(book.id)) {
      return res.json({ success: false, message: 'Already purchased' });
    }

    // Check if already in cart
    if (user.cart.includes(book.id)) {
      return res.json({ success: false, message: 'Already in cart' });
    }

    // Add to cart using $push
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { cart: book.id } }
    );

    res.json({ success: true, message: 'Added to cart!' });
  } catch (err) {
    console.error('Buy error:', err);
    res.json({ success: false, message: 'Server error' });
  }
});

// ── POST /books/checkout  —  Complete purchase ───────────────────────────────
router.post('/checkout', protect, async (req, res) => {
  req.flash('error', 'Direct checkout is disabled. Please use secure Razorpay checkout.');
  return res.redirect('/user/dashboard');
});

module.exports = router;
