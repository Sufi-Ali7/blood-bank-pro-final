const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema(
  {
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    units: {
      type: Number,
      required: true,
      min: 0
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true
    },
    hospitalPhone: {
      type: String,
      default: '',
      trim: true
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal'
    },
    expiryDate: {
      type: Date,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isExpired: {
      type: Boolean,
      default: false
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [80.9462, 26.8467]
      }
    }
  },
  {
    timestamps: true
  }
);

bloodInventorySchema.index({ location: '2dsphere' });

bloodInventorySchema.pre('save', function (next) {
  this.isExpired = new Date(this.expiryDate) < new Date();
  next();
});

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);