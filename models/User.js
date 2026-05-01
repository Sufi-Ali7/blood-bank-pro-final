const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: null
    },
    role: {
      type: String,
      enum: ['donor', 'acceptor', 'admin', 'manager'],
      default: 'donor'
    },
    city: {
      type: String,
      default: 'lucknow',
      trim: true
    },
    state: {
      type: String,
      default: 'uttar pradesh',
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    bio: {
      type: String,
      default: '',
      trim: true
    },
    avatar: {
      type: String,
      default: '',
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isEligible: {
      type: Boolean,
      default: true
    },
    lastDonationDate: {
      type: Date,
      default: null
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    livesSaved: {
      type: Number,
      default: 0
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null
    },
    phoneOtp: {
      type: String,
      default: null
    },
    phoneOtpExpires: {
      type: Date,
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    notifications: [
      {
        title: {
          type: String,
          required: true
        },
        message: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['info', 'success', 'warning', 'error'],
          default: 'info'
        },
        isRead: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [80.9462, 26.8467]
      }
    }
  },
  {
    timestamps: true
  }
);

// Only one email index definition
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);