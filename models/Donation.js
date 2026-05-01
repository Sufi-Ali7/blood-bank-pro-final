const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', default: null },
    bloodGroup: { type: String, required: true },
    quantityMl: { type: Number, default: 450 },
    hospitalName: { type: String, required: true },
    donatedAt: { type: Date, default: Date.now },
    receiptId: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
