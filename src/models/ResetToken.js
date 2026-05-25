const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // 30 minutes in seconds
    },
  },
  { timestamps: true }
);

const ResetToken = mongoose.model('ResetToken', resetTokenSchema);

module.exports = ResetToken;
