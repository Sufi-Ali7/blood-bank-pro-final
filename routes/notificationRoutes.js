const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
});

router.patch('/:id/read', async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  notification.isRead = true;
  await notification.save();
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
