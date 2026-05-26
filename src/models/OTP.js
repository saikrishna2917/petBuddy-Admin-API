const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // 30 minutes in seconds
    },
  },
  { timestamps: true }
);

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
