const mongoose = require("mongoose");

const paymentsSchema = new mongoose.Schema(
    {
        bookingID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bookingsModel",
        },

        petOwnerID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "petOwnersModel",
        },

        petSitterID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "petSittersModel",
        },
        paymentID: { type: String },
        paymentType: { type: String },
        paymentNotes: { type: String },
        amount: { type: Number, required: true },
        taxAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        finalAmount: { type: Number, required: true },
        transactionID: { type: String, required: true },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUND_INITIATED", "REFUNDED"],
            default: "PENDING",
        },
        refundId: { type: String },
        refundedDate: { type: Date },
        recieptNumber: { type: String },
        paymentFailedReason: { type: String, default: "" },
        paymentDetails: {
            type: {
                method: {
                    type: String,
                    enum: ["card", "netbanking", "wallet", "emi", "upi"],
                },
                cardDetails: {
                    cardholderName: { type: String },
                    last4Digits: { type: String },
                    network: { type: String },
                    cardType: { type: String },
                    issuer: { type: String },
                    isInternationalCard: { type: Boolean },
                    emi: { type: Boolean },
                },
                upi: {
                    vpa: { type: String },
                    upiTxId: { type: String },
                },
                bank: {
                    bank: { type: String },
                },
                wallet: {
                    wallet: { type: String },
                },
            },
        },
    },
    {
        timestamps: true,
    },
);

const paymentsModel = mongoose.model("paymentsModel", paymentsSchema);
module.exports = paymentsModel;
