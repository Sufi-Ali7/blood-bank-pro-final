const express = require('express');
const BloodInventory = require('../models/BloodInventory');
const User = require('../models/User');

const router = express.Router();

function getCompatibleDonorGroups(recipientGroup) {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };

  return compatibility[recipientGroup] || [recipientGroup];
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/*
Search inventory
Supports:
- bloodGroup
- city
- state
- urgency
- lat/lng nearby search
*/
router.get('/search', async (req, res) => {
  try {
    const {
      bloodGroup,
      city,
      state,
      urgency,
      lat,
      lng,
      radius
    } = req.query;

    let filter = {};

    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    if (city) {
      filter.city = city;
    }

    if (state) {
      filter.state = state;
    }

    if (urgency) {
      filter.urgency = urgency;
    }

    filter.isExpired = false;

    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radius || 100000)
        }
      };
    }

    const results = await BloodInventory.find(filter).sort({
      createdAt: -1
    });

    return res.json({
      count: results.length,
      results
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Server error'
    });
  }
});

/*
Nearby compatible donors
GET /api/inventory/nearby-donors?bloodGroup=A+&lat=26.84&lng=80.94&radius=200
radius in KM
*/
router.get('/nearby-donors', async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius } = req.query;

    if (!bloodGroup || !lat || !lng) {
      return res.status(400).json({
        message: 'bloodGroup, lat and lng are required'
      });
    }

    const compatibleGroups = getCompatibleDonorGroups(bloodGroup);
    const radiusKm = Number(radius || 100);

    const donors = await User.find({
      role: 'donor',
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      isEligible: true,
      isBlocked: false
    });

    const nearbyDonors = donors
      .map((donor) => {
        const coords = donor?.location?.coordinates || [];
        if (!Array.isArray(coords) || coords.length < 2) return null;

        const donorLng = Number(coords[0]);
        const donorLat = Number(coords[1]);

        if (Number.isNaN(donorLat) || Number.isNaN(donorLng)) return null;

        const distanceKm = haversineDistance(
          Number(lat),
          Number(lng),
          donorLat,
          donorLng
        );

        return {
          _id: donor._id,
          firstName: donor.firstName,
          lastName: donor.lastName,
          email: donor.email,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup,
          city: donor.city,
          state: donor.state,
          isAvailable: donor.isAvailable,
          isEligible: donor.isEligible,
          distanceKm: Number(distanceKm.toFixed(1))
        };
      })
      .filter((donor) => donor && donor.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({
      count: nearbyDonors.length,
      donors: nearbyDonors
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Server error'
    });
  }
});

/*
Admin add inventory
*/
router.post('/', async (req, res) => {
  try {
    const inventory = await BloodInventory.create(req.body);

    return res.status(201).json({
      message: 'Inventory added',
      inventory
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Server error'
    });
  }
});

/*
Update inventory
*/
router.patch('/:id', async (req, res) => {
  try {
    const inventory = await BloodInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.json({
      message: 'Inventory updated',
      inventory
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Server error'
    });
  }
});

/*
Delete inventory
*/
router.delete('/:id', async (req, res) => {
  try {
    await BloodInventory.findByIdAndDelete(req.params.id);

    return res.json({
      message: 'Inventory deleted'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;