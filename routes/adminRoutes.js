const express = require('express');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const ContactMessage = require('../models/ContactMessage');
const { protect, adminOnly } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  const [totalUsers, totalDonors, pendingRequests, totalUnits, totalRequests, totalDonations] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'donor' }),
    BloodRequest.countDocuments({ status: 'pending' }),
    BloodInventory.aggregate([{ $group: { _id: null, total: { $sum: '$units' } } }]),
    BloodRequest.countDocuments(),
    Donation.countDocuments()
  ]);
  const bloodGroupStats = await BloodInventory.aggregate([{ $group: { _id: '$bloodGroup', units: { $sum: '$units' } } }, { $sort: { _id: 1 } }]);
  const monthlyDonations = await Donation.aggregate([
    { $group: { _id: { $month: '$donatedAt' }, count: { $sum: 1 } } },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    totalUsers,
    totalDonors,
    pendingRequests,
    totalUnits: totalUnits[0]?.total || 0,
    totalRequests,
    totalDonations,
    bloodGroupStats,
    monthlyDonations
  });
});

router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

router.patch('/users/:id/block', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
});

router.delete('/users/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
});

router.get('/requests', async (req, res) => {
  const requests = await BloodRequest.find().sort({ createdAt: -1 });
  res.json({ requests });
});

router.patch('/requests/:id', async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  request.status = req.body.status;
  if (req.body.donorId) request.donorId = req.body.donorId;
  await request.save();
  await createNotification(request.requester, 'Request updated', `Your request is now ${request.status}`, request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'info', { requestId: request._id });
  res.json({ message: 'Request updated', request });
});

router.get('/inventory', async (req, res) => {
  const inventory = await BloodInventory.find().sort({ createdAt: -1 });
  res.json({ inventory });
});

router.delete('/inventory/expired/cleanup', async (req, res) => {
  const result = await BloodInventory.deleteMany({ expiryDate: { $lt: new Date() } });
  res.json({ message: 'Expired inventory removed', deletedCount: result.deletedCount });
});

router.get('/notifications', async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
  res.json({ notifications });
});

router.get('/contact-messages', async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
  res.json({ messages });
});

router.patch('/contact-messages/:id', async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  message.status = req.body.status || message.status;
  await message.save();
  res.json({ message: 'Contact message updated', contact: message });
});

module.exports = router;
