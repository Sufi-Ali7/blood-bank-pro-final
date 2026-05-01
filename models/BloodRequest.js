const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requesterName: { type: String, required: true },
    requesterRole: { type: String, default: 'acceptor' },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    unitsNeeded: { type: Number, default: 1 },
    urgency: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' },
    hospitalName: { type: String, required: true },
    hospitalPhone: { type: String, default: '' },
    city: { type: String, required: true, lowercase: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], default: 'pending' },
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodInventory' },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
