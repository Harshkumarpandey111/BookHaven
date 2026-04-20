const express = require('express');
const router = express.Router();
const Book = require('../../models/Book');

// GET /api/search/suggest?q=...
router.get('/suggest', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json([]);
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const books = await Book.find({
      $or: [{ title: regex }, { author: regex }]
    })
      .select('id title author cover price')
      .limit(6)
      .sort({ bestseller: -1, rating: -1 });

    return res.json(books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.cover,
      price: b.price
    })));
  } catch (err) {
    console.error('Search suggest error:', err);
    return res.json([]);
  }
});

module.exports = router;
