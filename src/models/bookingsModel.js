const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    ownerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "petOwnerProfileModel",
    },
    sitterID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PetSitterModel",
    },
    petID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "petsModel",
    },
    bookingID: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["PENDING", "BOOKED", "RE_SCHEDULED", "IN_PROGRESS", "CANCELLED", "COMPLETED"] },
    cancellationReason: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["PENDING", "PAID", "FAILED", "REFUNDED"], default: "PENDING" },
    reviewGiven: {
        type: Boolean,
        default: false,
    },
    paymentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "paymentsModel",
    },
    completedOn: { type: Date },
    specialInstructions: { type: String, default: "" },
}, {
    timestamps: true,
});

bookingSchema.index({ petOwnerID: 1 });
bookingSchema.index({ petSitterID: 1 });

// Pre-save hook to set timestamps if not provided
bookingSchema.pre('save', function (next) {
    if (!this.createdOn) {
        this.createdOn = new Date();
    }
    if (!this.updatedOn) {
        this.updatedOn = new Date();
    }
    next();
});

// Pre-update hook to set updatedOn
bookingSchema.pre(['updateOne', 'findOneAndUpdate', 'update'], function (next) {
    this.set({ updatedOn: new Date() });
    next();
});

const bookingsModel = mongoose.model("bookingsModel", bookingSchema);

module.exports = bookingsModel;