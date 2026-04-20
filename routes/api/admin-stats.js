const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth.middleware');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Book = require('../../models/Book');
const Review = require('../../models/Review');

router.use(protect, authorize('admin'));

// GET /api/admin/stats — aggregated analytics data
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

    // 1. Revenue by day (last 30 days)
    const revenueByDay = await Order.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill gaps for days with no revenue
    const revenueMap = {};
    revenueByDay.forEach(r => { revenueMap[r._id] = r.total / 100; });
    const revenueDays = [];
    const revenueValues = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      revenueDays.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      revenueValues.push(revenueMap[key] || 0);
    }

    // 2. Most purchased books (top 10)
    const mostPurchased = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$books' },
      { $group: { _id: '$books', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const purchasedBookIds = mostPurchased.map(m => m._id);
    const purchasedBooks = await Book.find({ id: { $in: purchasedBookIds } }).select('id title');
    const bookTitleMap = {};
    purchasedBooks.forEach(b => { bookTitleMap[b.id] = b.title; });

    // 3. User registrations per week (last 8 weeks)
    const registrations = await User.aggregate([
      { $match: { createdAt: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Indian vs Foreign books ratio
    const originCounts = await Book.aggregate([
      { $group: { _id: '$origin', count: { $sum: 1 } } }
    ]);

    // 5. Average ratings per category
    const ratingsByCategory = await Review.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: 'id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $group: {
          _id: '$book.category',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    // 6. Total revenue
    const totalRevenueResult = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total / 100 : 0;

    // 7. Total orders
    const totalOrders = await Order.countDocuments({ status: 'paid' });

    return res.json({
      success: true,
      revenue: { labels: revenueDays, values: revenueValues },
      mostPurchased: mostPurchased.map(m => ({
        title: bookTitleMap[m._id] || `Book #${m._id}`,
        count: m.count
      })),
      registrations: registrations.map(r => ({ week: r._id, count: r.count })),
      originRatio: originCounts.map(o => ({ origin: o._id, count: o.count })),
      ratingsByCategory: ratingsByCategory.map(r => ({
        category: r._id,
        avgRating: Number(r.avgRating.toFixed(1)),
        reviewCount: r.count
      })),
      totalRevenue,
      totalOrders
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Could not load stats' });
  }
});

module.exports = router;
