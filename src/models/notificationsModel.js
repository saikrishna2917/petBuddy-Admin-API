const mongoose = require("mongoose");

const notificationsSchema = new mongoose.Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId },
    userType: {
      type: String,
      enum: ["PET_OWNER", "PET_SITTER", "ADMIN"],
      required: true,
    },
    type: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    notificationType: {
      type: String,
      enum: [
        "BOOKING",
        "PAYMENT",
        "REFUND",
        "KYC",
        "SUPPORT",
        "PROMOTION",
        "PAYOUT",
        "ACCOUNT",
        "SYSTEM",
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ["PUSH", "SMS", "WHATSAPP", "EMAIL"],
      default: "PUSH",
    },
    notificationFor: { type: String },
    showFor: { type: String },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    referenceType: {
      type: String,
      enum: ["BOOKING", "PAYMENT", "SUPPORT", "KYC", "PET", "OTHER"],
      default: "OTHER",
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "READ"],
      default: "PENDING",
    },
    isRead: { type: Boolean, default: false },
    sentAt: {
      type: Date,
    },
    readAt: { type: Date },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    failureReason: {
      type: String,
      default: "",
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

notificationsSchema.index({ userID: 1, userType: 1 });
notificationsSchema.index({ isRead: 1 });
notificationsSchema.index({ notificationType: 1 });
notificationsSchema.index({ createdAt: -1 });

const notificationsModel = mongoose.model("notifications", notificationsSchema);

module.exports = notificationsModel;
