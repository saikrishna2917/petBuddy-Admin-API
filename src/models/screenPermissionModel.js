const mongoose = require("mongoose");

const screenPermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN"],
      required: true,
      unique: true,
    },
    dashboardScreen: { type: Boolean, default: false },
    bookingScreen: { type: Boolean, default: false },
    usersScreen: { type: Boolean, default: false },
    supportScreen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const screenPermissionModel = mongoose.model("screenPermission", screenPermissionSchema);
module.exports = screenPermissionModel;
