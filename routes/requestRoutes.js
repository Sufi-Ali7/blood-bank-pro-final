const express = require('express');
const BloodRequest = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getCompatibleDonors } = require('../utils/blood');
const { createNotification } = require('../utils/notify');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { inventoryId, bloodGroup, unitsNeeded, urgency, hospitalName, hospitalPhone, city, notes } = req.body;
    const request = await BloodRequest.create({
      requester: req.user._id,
      requesterName: `${req.user.firstName} ${req.user.lastName}`,
      requesterRole: req.user.role,
      inventoryId,
      bloodGroup,
      unitsNeeded,
      urgency,
      hospitalName,
      hospitalPhone: hospitalPhone || '',
      city: (city || req.user.city || 'lucknow').toLowerCase(),
      notes: notes || ''
    });

    if (inventoryId) {
      const item = await BloodInventory.findById(inventoryId);
      if (item && item.units > 0) item.urgency = urgency || item.urgency;
      if (item) await item.save();
    }

    const notifyAdmins = await User.find({ role: { $in: ['admin', 'manager'] } });
    await Promise.all(notifyAdmins.map((u) => createNotification(u._id, 'New blood request', `${request.bloodGroup} request created at ${request.hospitalName}`, 'warning', { requestId: request._id })));

    const compatibleGroups = getCompatibleDonors(bloodGroup);
    const donors = await User.find({ role: 'donor', bloodGroup: { $in: compatibleGroups }, isAvailable: true, isEligible: true, isBlocked: false }).limit(20);
    await Promise.all(donors.map((u) => createNotification(u._id, 'Emergency blood alert', `${bloodGroup} is needed at ${hospitalName}`, urgency === 'emergency' ? 'error' : 'warning', { requestId: request._id })));

    res.status(201).json({ message: 'Blood request created', request });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Could not create request' });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'donor'
      ? { $or: [{ donorId: req.user._id }, { requester: req.user._id }] }
      : { requester: req.user._id };
    const requests = await BloodRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch requests' });
  }
});

router.post('/:id/contact-donor', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    const compatible = getCompatibleDonors(request.bloodGroup);
    const donor = await User.findOne({ role: 'donor', bloodGroup: { $in: compatible }, isAvailable: true, isEligible: true, isBlocked: false });
    if (!donor) return res.status(404).json({ message: 'No available donor found yet' });
    request.donorId = donor._id;
    await request.save();
    await createNotification(donor._id, 'Contact request', `Please contact ${request.hospitalName} for ${request.bloodGroup}`, 'info', { requestId: request._id });
    res.json({ message: 'Donor contact initiated', donor: { name: `${donor.firstName} ${donor.lastName}`, phone: donor.phone, city: donor.city } });
  } catch (error) {
    res.status(500).json({ message: 'Could not contact donor' });
  }
});

router.post('/:id/complete', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'completed';
    request.completedAt = new Date();
    if (!request.donorId && req.user.role === 'donor') request.donorId = req.user._id;
    await request.save();

    const effectiveDonorId = request.donorId || request.requester;
    if (!request.donorId) {
      request.donorId = effectiveDonorId;
      await request.save();
    }

    if (effectiveDonorId) {
      const donor = await User.findById(effectiveDonorId);
      if (donor) {
        donor.lastDonationAt = new Date();
        donor.isEligible = false;
        donor.isAvailable = false;
        await donor.save();

        const existingDonation = await Donation.findOne({ requestId: request._id });
        if (!existingDonation) {
          await Donation.create({
            donor: donor._id,
            requestId: request._id,
            bloodGroup: request.bloodGroup || donor.bloodGroup,
            quantityMl: Math.max(1, Number(request.unitsNeeded || 1)) * 450,
            hospitalName: request.hospitalName,
            receiptId: `DON-${Date.now()}`
          });
        }

        setTimeout(async () => {
          donor.isEligible = true;
          donor.isAvailable = true;
          await donor.save();
        }, 1000);
      }
    }

    if (request.inventoryId) {
      const inventory = await BloodInventory.findById(request.inventoryId);
      if (inventory) {
        inventory.units = Math.max(0, inventory.units - (request.unitsNeeded || 1));
        await inventory.save();
      }
    }

    await createNotification(request.requester, 'Request completed', `${request.bloodGroup} request at ${request.hospitalName} was marked completed`, 'success', { requestId: request._id });
    res.json({ message: 'Request completed', request });
  } catch (error) {
    res.status(500).json({ message: 'Could not complete request' });
  }
});

module.exports = router;
