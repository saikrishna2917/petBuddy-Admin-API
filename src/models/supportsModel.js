const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    ticketID: { type: String, required: true, unique: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    raisedByType: {
      type: String,
      required: true,
      enum: ["PET_OWNER", "PET_SITTER", "ADMIN"],
    },
    bookingID: { type: mongoose.Schema.Types.ObjectId, ref: "bookingsModel" },
    subject: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: [
        "BOOKING",
        "PAYMENT",
        "REFUND",
        "PET_SITTER",
        "PET_OWNER",
        "TECHNICAL",
        "ACCOUNT",
        "General Support",
        "OTHER",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "LOW",
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "petBuddyUsers",
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "petBuddyUsers",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "petBuddyUsers",
    },
    escalatedAt: { type: Date },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "petBuddyUsers",
        },
        content: { type: String },
        createdAt: { type: Date, default: Date.now },
        isEdited: { type: Boolean, default: false },
        editedAt: { type: Date },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "petBuddyUsers",
        },
      },
    ],
    timeline: [
      {
        action: { type: String, required: true },
        by: { type: String, required: true },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "petBuddyUsers",
        },
        date: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const supportModel = mongoose.model("supportsModel", supportSchema);

module.exports = supportModel;
