const express = require('express');
const router = express.Router();
const ReadingList = require('../models/ReadingList');
const Book = require('../models/Book');
const { protect } = require('../middlewares/auth.middleware');

// GET /lists — user's reading lists page
router.get('/', protect, async (req, res) => {
  try {
    const lists = await ReadingList.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Gather all book IDs across all lists
    const allBookIds = [...new Set(lists.flatMap(l => l.books))];
    const books = await Book.find({ id: { $in: allBookIds } }).select('id title author cover price');
    const bookMap = {};
    books.forEach(b => { bookMap[b.id] = b; });

    res.render('reading-lists', {
      title: 'My Collections',
      lists,
      bookMap
    });
  } catch (err) {
    console.error('Reading lists error:', err);
    req.flash('error', 'Could not load collections');
    res.redirect('/user/dashboard');
  }
});

// POST /lists — create new list
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    if (!name || !name.trim()) {
      req.flash('error', 'List name is required');
      return res.redirect('/lists');
    }

    const count = await ReadingList.countDocuments({ user: req.user.id });
    if (count >= 20) {
      req.flash('error', 'Maximum 20 lists allowed');
      return res.redirect('/lists');
    }

    await ReadingList.create({
      user: req.user.id,
      name: name.trim(),
      description: (description || '').trim(),
      isPublic: isPublic === 'on' || isPublic === 'true'
    });

    req.flash('success', `Collection "${name.trim()}" created!`);
    return res.redirect('/lists');
  } catch (err) {
    console.error('Create list error:', err);
    req.flash('error', 'Could not create collection');
    return res.redirect('/lists');
  }
});

// POST /lists/:id/add/:bookId — add book to list
router.post('/:id/add/:bookId', protect, async (req, res) => {
  try {
    const list = await ReadingList.findOne({ _id: req.params.id, user: req.user.id });
    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    const bookId = Number(req.params.bookId);
    if (list.books.includes(bookId)) {
      return res.json({ success: false, message: 'Book already in this list' });
    }

    if (list.books.length >= 100) {
      return res.json({ success: false, message: 'Maximum 100 books per list' });
    }

    list.books.push(bookId);
    await list.save();
    return res.json({ success: true, message: `Added to "${list.name}"` });
  } catch (err) {
    console.error('Add to list error:', err);
    return res.status(500).json({ success: false, message: 'Could not add book' });
  }
});

// POST /lists/:id/remove/:bookId — remove book from list
router.post('/:id/remove/:bookId', protect, async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    await ReadingList.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $pull: { books: bookId } }
    );
    req.flash('success', 'Book removed from collection');
    return res.redirect('/lists');
  } catch (err) {
    console.error('Remove from list error:', err);
    req.flash('error', 'Could not remove book');
    return res.redirect('/lists');
  }
});

// POST /lists/:id/delete — delete list
router.post('/:id/delete', protect, async (req, res) => {
  try {
    await ReadingList.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    req.flash('success', 'Collection deleted');
    return res.redirect('/lists');
  } catch (err) {
    console.error('Delete list error:', err);
    req.flash('error', 'Could not delete collection');
    return res.redirect('/lists');
  }
});

// GET /lists/shared/:slug — public shareable view
router.get('/shared/:slug', async (req, res) => {
  try {
    const list = await ReadingList.findOne({ shareSlug: req.params.slug, isPublic: true }).populate('user', 'name');
    if (!list) {
      return res.status(404).render('404', { title: 'Not Found' });
    }

    const books = await Book.find({ id: { $in: list.books } });
    const bookMap = {};
    books.forEach(b => { bookMap[b.id] = b; });

    res.render('reading-lists', {
      title: `${list.name} — Shared Collection`,
      lists: [list],
      bookMap,
      sharedView: true,
      sharedOwner: list.user?.name || 'A BookHaven Reader'
    });
  } catch (err) {
    console.error('Shared list error:', err);
    res.status(500).render('404', { title: 'Error' });
  }
});

// API: Get user's lists (for dropdown on book detail page)
router.get('/api/my-lists', protect, async (req, res) => {
  try {
    const lists = await ReadingList.find({ user: req.user.id }).select('name books').sort({ createdAt: -1 });
    return res.json({ success: true, lists });
  } catch (err) {
    return res.json({ success: true, lists: [] });
  }
});

module.exports = router;
