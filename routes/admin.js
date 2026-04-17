const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/auth.middleware');
const Book = require('../models/Book');
const User = require('../models/User');
const ReadingProgress = require('../models/ReadingProgress');
const Order = require('../models/Order');

router.use(protect, authorize('admin'));

function parseBookPayload(body) {
  return {
    id: Number(body.id),
    title: (body.title || '').trim(),
    author: (body.author || '').trim(),
    price: Number(body.price || 0),
    category: (body.category || '').trim(),
    rating: Number(body.rating || 0),
    pages: Number(body.pages || 0),
    description: body.description || '',
    cover: body.cover || '',
    preview: body.preview || '',
    fullText: body.fullText || '',
    pdfUrl: body.pdfUrl || '',
    bestseller: body.bestseller === 'true' || body.bestseller === 'on',
    origin: body.origin === 'Foreign' ? 'Foreign' : 'Indian'
  };
}

router.get('/dashboard', protect, authorize('admin'), (req, res) => {
  return res.redirect('/admin');
});

router.get('/', async (req, res) => {
  try {
    const [books, rawUsers, totalBooks, totalUsers, totalAdmins] = await Promise.all([
      Book.find({}).sort({ id: 1 }).limit(60),
      User.find({}).sort({ createdAt: -1 }).limit(80),
      Book.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' })
    ]);

    const users = rawUsers.map((user) => ({
      ...user.toObject(),
      role: String(user.role || 'user').toLowerCase()
    }));

    return res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      books,
      users,
      currentAdminId: req.user.id,
      stats: {
        totalBooks,
        totalUsers,
        totalAdmins
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Could not load admin dashboard');
    return res.redirect('/');
  }
});

router.get('/books/new', (req, res) => {
  return res.render('admin/book-form', {
    title: 'Add Book',
    isEdit: false,
    action: '/admin/books',
    book: {}
  });
});

router.post('/books', async (req, res) => {
  try {
    const payload = parseBookPayload(req.body);
    if (!payload.id || !payload.title || !payload.author || !payload.category) {
      req.flash('error', 'ID, title, author, and category are required');
      return res.redirect('/admin/books/new');
    }

    const exists = await Book.findOne({ id: payload.id });
    if (exists) {
      req.flash('error', 'A book with this ID already exists');
      return res.redirect('/admin/books/new');
    }

    await Book.create(payload);
    req.flash('success', 'Book created successfully');
    return res.redirect('/admin');
  } catch (err) {
    console.error('Create book error:', err);
    req.flash('error', 'Could not create book');
    return res.redirect('/admin/books/new');
  }
});

router.get('/books/:id/edit', async (req, res) => {
  try {
    const book = await Book.findOne({ id: Number(req.params.id) });
    if (!book) {
      req.flash('error', 'Book not found');
      return res.redirect('/admin');
    }

    return res.render('admin/book-form', {
      title: 'Edit Book',
      isEdit: true,
      action: `/admin/books/${book.id}/update`,
      book
    });
  } catch (err) {
    console.error('Edit form error:', err);
    req.flash('error', 'Could not load edit form');
    return res.redirect('/admin');
  }
});

router.post('/books/:id/update', async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    const payload = parseBookPayload(req.body);
    payload.id = bookId;

    await Book.findOneAndUpdate({ id: bookId }, payload, { runValidators: true });
    req.flash('success', 'Book updated successfully');
    return res.redirect('/admin');
  } catch (err) {
    console.error('Update book error:', err);
    req.flash('error', 'Could not update book');
    return res.redirect(`/admin/books/${req.params.id}/edit`);
  }
});

router.post('/books/:id/delete', async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    await Promise.all([
      Book.deleteOne({ id: bookId }),
      User.updateMany({}, {
        $pull: {
          readBooks: bookId,
          purchasedBooks: bookId,
          cart: bookId
        }
      }),
      ReadingProgress.deleteMany({ bookId }),
      Order.updateMany({}, { $pull: { books: bookId } })
    ]);

    req.flash('success', 'Book deleted successfully');
    return res.redirect('/admin');
  } catch (err) {
    console.error('Delete book error:', err);
    req.flash('error', 'Could not delete book');
    return res.redirect('/admin');
  }
});

router.post('/users/:id/role', async (req, res) => {
  try {
    const userId = req.params.id;
    const role = req.body.role === 'admin' ? 'admin' : 'user';

    if (userId === req.user.id && role !== 'admin') {
      req.flash('error', 'You cannot remove your own admin access');
      return res.redirect('/admin');
    }

    await User.findByIdAndUpdate(userId, { $set: { role } }, { runValidators: true });
    req.flash('success', 'User role updated');
    return res.redirect('/admin');
  } catch (err) {
    console.error('Update user role error:', err);
    req.flash('error', 'Could not update user role');
    return res.redirect('/admin');
  }
});

router.post('/users/:id/delete', async (req, res) => {
  try {
    const userId = req.params.id;
    if (userId === req.user.id) {
      req.flash('error', 'You cannot delete your own admin account');
      return res.redirect('/admin');
    }

    await Promise.all([
      User.findByIdAndDelete(userId),
      ReadingProgress.deleteMany({ user: userId }),
      Order.deleteMany({ user: userId })
    ]);

    req.flash('success', 'User deleted successfully');
    return res.redirect('/admin');
  } catch (err) {
    console.error('Delete user error:', err);
    req.flash('error', 'Could not delete user');
    return res.redirect('/admin');
  }
});

module.exports = router;
