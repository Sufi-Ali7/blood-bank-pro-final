require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const BloodInventory = require('./models/BloodInventory');
const BloodRequest = require('./models/BloodRequest');
const Donation = require('./models/Donation');
const Notification = require('./models/Notification');

async function seed() {
  await connectDB();

  await Promise.all([
    BloodRequest.deleteMany({}),
    BloodInventory.deleteMany({}),
    Donation.deleteMany({}),
    Notification.deleteMany({}),
    User.deleteMany({
      email: {
        $in: [
          'admin@bloodbank.com',
          'manager@bloodbank.com',
          'donor@bloodbank.com',
          'acceptor@bloodbank.com',
          'donor2@bloodbank.com'
        ]
      }
    })
  ]);

  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  const donorPassword = await bcrypt.hash('Donor@123', 10);
  const acceptorPassword = await bcrypt.hash('Acceptor@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: process.env.ADMIN_EMAIL || 'admin@bloodbank.com',
    phone: '9000000001',
    password: adminPassword,
    role: 'admin',
    city: 'lucknow',
    state: 'uttar pradesh',
    isAvailable: false,
    isEligible: false,
    isEmailVerified: true,
    isPhoneVerified: true,
    location: { type: 'Point', coordinates: [80.9462, 26.8467] }
  });

  const manager = await User.create({
    firstName: 'Hospital',
    lastName: 'Manager',
    email: 'manager@bloodbank.com',
    phone: '9000000002',
    password: managerPassword,
    role: 'manager',
    city: 'lucknow',
    state: 'uttar pradesh',
    isAvailable: false,
    isEligible: false,
    isEmailVerified: true,
    isPhoneVerified: true,
    location: { type: 'Point', coordinates: [80.9462, 26.8467] }
  });

  const donor = await User.create({
    firstName: 'Rahul',
    lastName: 'Donor',
    email: 'donor@bloodbank.com',
    phone: '9123456789',
    password: donorPassword,
    bloodGroup: 'A+',
    role: 'donor',
    city: 'lucknow',
    state: 'uttar pradesh',
    isAvailable: true,
    isEligible: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    location: { type: 'Point', coordinates: [80.9231, 26.8697] }
  });

  const donor2 = await User.create({
    firstName: 'Sana',
    lastName: 'Donor',
    email: 'donor2@bloodbank.com',
    phone: '9123456790',
    password: donorPassword,
    bloodGroup: 'O-',
    role: 'donor',
    city: 'kanpur',
    state: 'uttar pradesh',
    isAvailable: true,
    isEligible: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    location: { type: 'Point', coordinates: [80.3319, 26.4499] }
  });

  const acceptor = await User.create({
    firstName: 'Aman',
    lastName: 'Patient',
    email: 'acceptor@bloodbank.com',
    phone: '9123456780',
    password: acceptorPassword,
    bloodGroup: 'O+',
    role: 'acceptor',
    city: 'lucknow',
    state: 'uttar pradesh',
    isAvailable: false,
    isEligible: false,
    isEmailVerified: true,
    isPhoneVerified: true,
    location: { type: 'Point', coordinates: [80.9462, 26.8467] }
  });

  const inventoryData = [
    {
      bloodGroup: 'A+',
      units: 12,
      city: 'delhi',
      state: 'delhi',
      hospitalName: 'AIIMS Delhi',
      hospitalPhone: '01126588500',
      urgency: 'normal',
      expiryDate: new Date(Date.now() + 20 * 86400000),
      location: { type: 'Point', coordinates: [77.2100, 28.5672] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'A-',
      units: 4,
      city: 'delhi',
      state: 'delhi',
      hospitalName: 'Sir Ganga Ram Hospital',
      hospitalPhone: '01125750000',
      urgency: 'urgent',
      expiryDate: new Date(Date.now() + 15 * 86400000),
      location: { type: 'Point', coordinates: [77.1890, 28.6380] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'B+',
      units: 8,
      city: 'mumbai',
      state: 'maharashtra',
      hospitalName: 'Lilavati Hospital',
      hospitalPhone: '02269318000',
      urgency: 'normal',
      expiryDate: new Date(Date.now() + 22 * 86400000),
      location: { type: 'Point', coordinates: [72.8295, 19.0515] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'O-',
      units: 2,
      city: 'kolkata',
      state: 'west bengal',
      hospitalName: 'Tata Medical Center',
      hospitalPhone: '03366057000',
      urgency: 'emergency',
      expiryDate: new Date(Date.now() + 7 * 86400000),
      location: { type: 'Point', coordinates: [88.4332, 22.5736] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'AB+',
      units: 6,
      city: 'bangalore',
      state: 'karnataka',
      hospitalName: 'Apollo Hospital Bangalore',
      hospitalPhone: '08026304050',
      urgency: 'normal',
      expiryDate: new Date(Date.now() + 18 * 86400000),
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'O+',
      units: 10,
      city: 'hyderabad',
      state: 'telangana',
      hospitalName: 'Fortis Hyderabad',
      hospitalPhone: '04049662222',
      urgency: 'urgent',
      expiryDate: new Date(Date.now() + 25 * 86400000),
      location: { type: 'Point', coordinates: [78.4867, 17.3850] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'A+',
      units: 9,
      city: 'lucknow',
      state: 'uttar pradesh',
      hospitalName: 'KGMU Lucknow',
      hospitalPhone: '05222255555',
      urgency: 'normal',
      expiryDate: new Date(Date.now() + 12 * 86400000),
      location: { type: 'Point', coordinates: [80.9231, 26.8697] },
      addedBy: manager._id
    },
    {
      bloodGroup: 'O+',
      units: 5,
      city: 'lucknow',
      state: 'uttar pradesh',
      hospitalName: 'Balrampur Hospital',
      hospitalPhone: '05222620000',
      urgency: 'urgent',
      expiryDate: new Date(Date.now() + 8 * 86400000),
      location: { type: 'Point', coordinates: [80.9462, 26.8559] },
      addedBy: manager._id
    },
    {
      bloodGroup: 'B+',
      units: 7,
      city: 'lucknow',
      state: 'uttar pradesh',
      hospitalName: 'Civil Hospital Lucknow',
      hospitalPhone: '05222231234',
      urgency: 'normal',
      expiryDate: new Date(Date.now() + 10 * 86400000),
      location: { type: 'Point', coordinates: [80.9469, 26.8477] },
      addedBy: manager._id
    },
    {
      bloodGroup: 'AB-',
      units: 2,
      city: 'lucknow',
      state: 'uttar pradesh',
      hospitalName: 'Era Hospital',
      hospitalPhone: '05226606000',
      urgency: 'emergency',
      expiryDate: new Date(Date.now() + 5 * 86400000),
      location: { type: 'Point', coordinates: [81.0137, 26.8710] },
      addedBy: manager._id
    },
    {
      bloodGroup: 'B-',
      units: 3,
      city: 'kanpur',
      state: 'uttar pradesh',
      hospitalName: 'Lala Lajpat Rai Hospital',
      hospitalPhone: '05122530000',
      urgency: 'urgent',
      expiryDate: new Date(Date.now() + 9 * 86400000),
      location: { type: 'Point', coordinates: [80.3319, 26.4499] },
      addedBy: admin._id
    },
    {
      bloodGroup: 'O-',
      units: 4,
      city: 'gorakhpur',
      state: 'uttar pradesh',
      hospitalName: 'BRD Medical College',
      hospitalPhone: '05512205000',
      urgency: 'emergency',
      expiryDate: new Date(Date.now() + 6 * 86400000),
      location: { type: 'Point', coordinates: [83.3732, 26.7606] },
      addedBy: admin._id
    }
  ];

  const inventory = await BloodInventory.insertMany(inventoryData);

  const request1 = await BloodRequest.create({
    requester: acceptor._id,
    requesterName: 'Aman Patient',
    requesterRole: 'acceptor',
    bloodGroup: 'A+',
    unitsNeeded: 1,
    urgency: 'urgent',
    hospitalName: 'KGMU Lucknow',
    hospitalPhone: '05222255555',
    city: 'lucknow',
    state: 'uttar pradesh',
    status: 'pending',
    inventoryId: inventory.find(i => i.hospitalName === 'KGMU Lucknow')._id,
    notes: 'Urgent surgery case'
  });

  const request2 = await BloodRequest.create({
    requester: acceptor._id,
    requesterName: 'Aman Patient',
    requesterRole: 'acceptor',
    bloodGroup: 'O+',
    unitsNeeded: 1,
    urgency: 'normal',
    hospitalName: 'Balrampur Hospital',
    hospitalPhone: '05222620000',
    city: 'lucknow',
    state: 'uttar pradesh',
    status: 'approved',
    inventoryId: inventory.find(i => i.hospitalName === 'Balrampur Hospital')._id,
    donorId: donor._id,
    notes: 'Recovery support'
  });

  const donation = await Donation.create({
    donor: donor._id,
    requestId: request2._id,
    bloodGroup: donor.bloodGroup,
    quantityMl: 450,
    hospitalName: 'Balrampur Hospital',
    donatedAt: new Date(Date.now() - 15 * 86400000),
    receiptId: 'DON-2026-001'
  });

  donor.lastDonationAt = donation.donatedAt;
  await donor.save();

  await Notification.insertMany([
    {
      user: admin._id,
      title: 'New request pending',
      message: 'A+ request at KGMU Lucknow requires review',
      type: 'warning'
    },
    {
      user: donor._id,
      title: 'Donor opportunity',
      message: 'A compatible urgent request is available in Lucknow',
      type: 'info'
    },
    {
      user: acceptor._id,
      title: 'Request approved',
      message: 'Your O+ request at Balrampur Hospital was approved',
      type: 'success'
    }
  ]);

  console.log('MongoDB connected');
  console.log('Sample data inserted');
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});