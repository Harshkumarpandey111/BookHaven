const express = require('express');
const router = express.Router();
const Notification = require('../../models/Notification');
const { protect } = require('../../middlewares/auth.middleware');

// GET /api/notifications — get user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    return res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return res.status(500).json({ success: false, message: 'Could not load notifications' });
  }
});

// GET /api/notifications/count — just the unread count
router.get('/count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    return res.json({ success: true, unreadCount });
  } catch (err) {
    return res.json({ success: true, unreadCount: 0 });
  }
});

// POST /api/notifications/read-all — mark all read
router.post('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not mark notifications' });
  }
});

// POST /api/notifications/:id/read — mark single as read
router.post('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not mark notification' });
  }
});

module.exports = router;
