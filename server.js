require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const requestRoutes = require('./routes/requestRoutes');
const donorRoutes = require('./routes/donorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Connect database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: process.env.APP_NAME || 'BloodBank Pro' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin seed function
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Admin credentials not found in .env');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      phone: '9999999999',
      password: hashedPassword,
      bloodGroup: 'O+',
      role: 'admin',
      city: 'lucknow',
      state: 'uttar pradesh',
      address: 'Admin Office',
      isAvailable: false,
      isEligible: false,
      isEmailVerified: true,
      isPhoneVerified: true
    });

    await adminUser.save();
    console.log('Admin account created successfully');
  } catch (error) {
    console.error('Error creating admin account:', error.message);
  }
}

// Run admin seed after DB connection opens
mongoose.connection.once('open', async () => {
  console.log('MongoDB connection is open');
  await seedAdmin();
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});