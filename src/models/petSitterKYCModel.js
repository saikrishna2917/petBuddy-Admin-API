const mongoose = require("mongoose");

const petSitterKYCSchema = new mongoose.Schema(
  {
    petSitterID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetSitter",
    },
    governmentIDType: {
      type: String,
      enum: ["AADHAR", "PAN", "DRIVING_LICENSE", "PASSPORT", "VOTER_ID"],
      required: true,
    },
    selfieImage: {
      type: String,
    },
    governmentIDNumber: { type: String },
    governmentIDFrontImage: { type: String },
    governmentIDBackImage: { type: String },
    backgroundVerificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "UNDER_REVIEW", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    verifiedOn: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

petSitterKYCSchema.index({ petSitterID: 1 });
petSitterKYCSchema.index({ backgroundVerificationStatus: 1 });

const petSitterKYCModel = mongoose.model(
  "petSitterKYCModel",
  petSitterKYCSchema,
);

module.exports = petSitterKYCModel;
