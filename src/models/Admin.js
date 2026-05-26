const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['SuperAdmin', 'Moderator', 'Support'],
      default: 'SuperAdmin',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
