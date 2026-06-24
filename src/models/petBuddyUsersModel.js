const mongoose = require("mongoose");

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
      enum: [
        "SUPER_ADMIN",
        "OPERATIONS_ADMIN",
        "SUPPORT_ADMIN",
        "FINANCE_ADMIN",
      ],
      default: "SUPER_ADMIN",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const petBuddyUsersModel = mongoose.model("petBuddyUsers", adminSchema);

module.exports = petBuddyUsersModel;
