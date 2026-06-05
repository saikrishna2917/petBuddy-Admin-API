const mongoose = require("mongoose");

const reviewAndRatingSchema = new mongoose.Schema(
  {
    reviewID: { type: String, required: true, unique: true },
    bookingID: { type: String, required: true },
    ownerID: { type: String, ref: "petOwnerProfileModel", required: true },
    sitterID: { type: String, ref: "petSitterProfileModel", required: true },
    petID: { type: String, ref: "petsModel" },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewTitle: { type: String, trim: true, default: "" },
    review: { type: String, required: true },
    reviewImages: [
      {
        fileUrl: String,
      },
    ],
    sitterReply: {
      type: String,
      default: "",
    },
    repliedAt: { type: Date },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      default: "",
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
reviewAndRatingSchema.index({ ownerID: 1 });
reviewAndRatingSchema.index({ sitterID: 1 });
reviewAndRatingSchema.index({ bookingID: 1 });
reviewAndRatingSchema.index({ rating: 1 });
const reviewAndRatingModel = mongoose.model(
  "reviewAndRatingModel",
  reviewAndRatingSchema,
);

module.exports = reviewAndRatingModel;
