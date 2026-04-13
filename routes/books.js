const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const User    = require('../models/User');

// ── Middleware: require login ─────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue');
    return res.redirect('/login');
  }
  next();
}

// ── GET /books  —  Browse with filters ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, origin } = req.query;

    // Build MongoDB query object dynamically
    const query = {};
    if (category) query.category = category;
    if (origin)   query.origin   = origin;
    if (search) {
      // Case-insensitive regex search on title OR author
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { author: regex }];
    }

    // Fetch filtered books and all categories in parallel
    const [books, allBooks] = await Promise.all([
      Book.find(query).sort({ id: 1 }),
      Book.find({}, 'category')
    ]);

    const categories = [...new Set(allBooks.map(b => b.category))];

    res.render('books', {
      books,
      categories,
      category: category || null,
      search:   search   || null,
      origin:   origin   || null,
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
    if (req.session.user) {
      userData = await User.findById(req.session.user.id);
    }

    res.render('book-detail', { book, userData, title: book.title });
  } catch (err) {
    console.error('Book detail error:', err);
    res.status(500).render('404', { title: 'Error' });
  }
});

// ── GET /books/:id/read  —  Open reader ──────────────────────────────────────
router.get('/:id/read', requireLogin, async (req, res) => {
  try {
    const book = await Book.findOne({ id: parseInt(req.params.id) });
    if (!book) return res.status(404).render('404', { title: 'Not Found' });

    // Add to reading history using MongoDB $addToSet (no duplicates automatically)
    await User.findByIdAndUpdate(
      req.session.user.id,
      { $addToSet: { readBooks: book.id } }  // $addToSet only adds if not already there
    );

    res.render('read', { book, title: `Reading: ${book.title}` });
  } catch (err) {
    console.error('Read error:', err);
    res.status(500).render('404', { title: 'Error' });
  }
});

// ── POST /books/:id/buy  —  Add to cart ──────────────────────────────────────
router.post('/:id/buy', requireLogin, async (req, res) => {
  try {
    const book = await Book.findOne({ id: parseInt(req.params.id) });
    if (!book) return res.json({ success: false, message: 'Book not found' });

    const user = await User.findById(req.session.user.id);
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
      req.session.user.id,
      { $push: { cart: book.id } }
    );

    res.json({ success: true, message: 'Added to cart!' });
  } catch (err) {
    console.error('Buy error:', err);
    res.json({ success: false, message: 'Server error' });
  }
});

// ── POST /books/checkout  —  Complete purchase ───────────────────────────────
router.post('/checkout', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/user/dashboard');
    }

    // Move cart items to purchasedBooks (avoid duplicates with $addToSet)
    // $each lets us push multiple values at once
    await User.findByIdAndUpdate(
      req.session.user.id,
      {
        $addToSet: { purchasedBooks: { $each: user.cart } }, // add all cart items
        $set:      { cart: [] }                               // empty the cart
      }
    );

    req.flash('success', 'Purchase successful! Books added to your library.');
    res.redirect('/user/dashboard');
  } catch (err) {
    console.error('Checkout error:', err);
    req.flash('error', 'Checkout failed. Please try again.');
    res.redirect('/user/dashboard');
  }
});

module.exports = router;
