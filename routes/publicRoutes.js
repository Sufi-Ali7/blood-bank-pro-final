const express = require('express');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const ContactMessage = require('../models/ContactMessage');
const router = express.Router();

router.get('/site', (req, res) => {
  res.json({
    quickLinks: [
      { key: 'home', label: 'Home' },
      { key: 'search', label: 'Find Blood' },
      { key: 'donor-dashboard', label: 'Donate Blood' },
      { key: 'admin', label: 'Admin Portal' }
    ],
    legal: [
      { key: 'privacy', label: 'Privacy Policy' },
      { key: 'terms', label: 'Terms of Service' },
      { key: 'cookies', label: 'Cookie Policy' },
      { key: 'compliance', label: 'HIPAA Compliance' }
    ],
    contact: {
      email: 'support@bloodbank.com',
      phone: '1800366283',
      displayPhone: '1-800-DONATE'
    }
  });
});

router.get('/summary', async (req, res) => {
  const [activeDonors, pendingRequests, unitsAgg, recentRequests] = await Promise.all([
    User.countDocuments({ role: 'donor', isAvailable: true, isEligible: true, isBlocked: false }),
    BloodRequest.countDocuments({ status: 'pending' }),
    BloodInventory.aggregate([{ $group: { _id: null, total: { $sum: '$units' } } }]),
    BloodRequest.find().sort({ createdAt: -1 }).limit(3)
  ]);
  res.json({
    activeDonors,
    pendingRequests,
    totalUnits: unitsAgg[0]?.total || 0,
    recentRequests
  });
});


router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      phone: phone || '',
      subject: subject || 'General enquiry',
      message
    });

    res.status(201).json({ message: 'Message received successfully', contactId: contact._id });
  } catch (error) {
    res.status(500).json({ message: 'Could not save contact message' });
  }
});

module.exports = router;
